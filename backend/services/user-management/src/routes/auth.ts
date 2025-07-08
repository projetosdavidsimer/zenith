/**
 * ROTAS DE AUTENTICAÇÃO
 * 
 * Implementa:
 * - Login/Logout seguro
 * - Registro de usuários
 * - Recuperação de senha
 * - 2FA (Two-Factor Authentication)
 * - Refresh tokens
 * - Verificação de email
 * 
 * @author Cybersecurity Expert - Vizinho Virtual
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../utils/logger';
import { validateRequest } from '../middleware/validation';
import { authSchemas } from '../schemas/authSchemas';
import { UserService } from '../services/UserService';
import { EmailService } from '../services/EmailService';
import { SMSService } from '../services/SMSService';
import { RedisService } from '../services/RedisService';
import { 
  generateTokens, 
  verifyRefreshToken, 
  blacklistToken,
  hashPassword,
  verifyPassword 
} from '../utils/auth';

const router = Router();
const userService = new UserService();
const emailService = new EmailService();
const smsService = new SMSService();
const redisService = new RedisService();

// ==============================================
// REGISTRO DE USUÁRIO
// ==============================================

router.post('/register', validateRequest(authSchemas.register), async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role, buildingId, apartmentNumber, nif } = req.body;

    // Verificar se usuário já existe
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email já está em uso',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Verificar se NIF já existe (para Portugal)
    if (nif) {
      const existingNIF = await userService.findByNIF(nif);
      if (existingNIF) {
        return res.status(409).json({
          error: 'NIF já está em uso',
          code: 'NIF_ALREADY_EXISTS'
        });
      }
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Gerar token de verificação de email
    const emailVerificationToken = uuidv4();

    // Criar usuário
    const userData = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      phone,
      role: role || 'MORADOR',
      buildingId,
      apartmentNumber,
      nif,
      emailVerified: false,
      emailVerificationToken,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const user = await userService.create(userData);

    // Enviar email de verificação
    await emailService.sendVerificationEmail(email, name, emailVerificationToken);

    // Log de auditoria
    logger.info('Usuário registrado', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso. Verifique seu email para ativar a conta.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    logger.error('Erro no registro de usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// ==============================================
// LOGIN
// ==============================================

router.post('/login', validateRequest(authSchemas.login), async (req: Request, res: Response) => {
  try {
    const { email, password, twoFactorCode } = req.body;
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent') || 'unknown';

    // Buscar usuário
    const user = await userService.findByEmail(email);
    if (!user) {
      logger.warn('Tentativa de login com email inexistente', {
        email,
        ip: clientIP,
        userAgent
      });
      
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      logger.warn('Tentativa de login com usuário inativo', {
        userId: user.id,
        email,
        ip: clientIP
      });
      
      return res.status(401).json({
        error: 'Conta desativada. Entre em contato com o suporte.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      // Incrementar tentativas de login falhadas
      await userService.incrementFailedLogins(user.id);
      
      logger.warn('Tentativa de login com senha incorreta', {
        userId: user.id,
        email,
        ip: clientIP,
        userAgent
      });
      
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar se email foi verificado
    if (!user.emailVerified) {
      return res.status(401).json({
        error: 'Email não verificado. Verifique sua caixa de entrada.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Verificar 2FA se habilitado
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          requiresTwoFactor: true,
          message: 'Código de autenticação de dois fatores necessário'
        });
      }

      const isValidTwoFactor = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2 // Permitir 2 códigos anteriores/posteriores
      });

      if (!isValidTwoFactor) {
        logger.warn('Código 2FA inválido', {
          userId: user.id,
          email,
          ip: clientIP
        });
        
        return res.status(401).json({
          error: 'Código de autenticação inválido',
          code: 'INVALID_2FA_CODE'
        });
      }
    }

    // Gerar tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    // Salvar refresh token no Redis
    await redisService.setRefreshToken(user.id, refreshToken);

    // Resetar tentativas de login falhadas
    await userService.resetFailedLogins(user.id);

    // Atualizar último login
    await userService.updateLastLogin(user.id, clientIP, userAgent);

    // Log de sucesso
    logger.info('Login realizado com sucesso', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: clientIP,
      userAgent,
      twoFactorUsed: !!user.twoFactorEnabled
    });

    res.status(200).json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        buildingId: user.buildingId,
        apartmentNumber: user.apartmentNumber,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'LOGIN_ERROR'
    });
  }
});

// ==============================================
// REFRESH TOKEN
// ==============================================

router.post('/refresh', validateRequest(authSchemas.refresh), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Verificar refresh token
    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        error: 'Refresh token inválido ou expirado',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Verificar se token existe no Redis
    const storedToken = await redisService.getRefreshToken(decoded.userId);
    if (storedToken !== refreshToken) {
      return res.status(401).json({
        error: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Buscar usuário
    const user = await userService.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Usuário não encontrado ou inativo',
        code: 'USER_NOT_FOUND'
      });
    }

    // Gerar novos tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

    // Atualizar refresh token no Redis
    await redisService.setRefreshToken(user.id, newRefreshToken);

    logger.info('Token renovado', {
      userId: user.id,
      ip: req.ip
    });

    res.status(200).json({
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    logger.error('Erro ao renovar token:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'REFRESH_ERROR'
    });
  }
});

// ==============================================
// LOGOUT
// ==============================================

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const refreshToken = req.body.refreshToken;

    // Blacklist access token se fornecido
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      await blacklistToken(accessToken);
    }

    // Remover refresh token do Redis se fornecido
    if (refreshToken) {
      const decoded = await verifyRefreshToken(refreshToken);
      if (decoded) {
        await redisService.deleteRefreshToken(decoded.userId);
      }
    }

    logger.info('Logout realizado', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    logger.error('Erro no logout:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'LOGOUT_ERROR'
    });
  }
});

// ==============================================
// VERIFICAÇÃO DE EMAIL
// ==============================================

router.post('/verify-email', validateRequest(authSchemas.verifyEmail), async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    // Buscar usuário pelo token
    const user = await userService.findByEmailVerificationToken(token);
    if (!user) {
      return res.status(400).json({
        error: 'Token de verificação inválido ou expirado',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    // Verificar email
    await userService.verifyEmail(user.id);

    logger.info('Email verificado', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      message: 'Email verificado com sucesso'
    });

  } catch (error) {
    logger.error('Erro na verificação de email:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'EMAIL_VERIFICATION_ERROR'
    });
  }
});

// ==============================================
// REENVIAR VERIFICAÇÃO DE EMAIL
// ==============================================

router.post('/resend-verification', validateRequest(authSchemas.resendVerification), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await userService.findByEmail(email);
    if (!user) {
      // Não revelar se email existe ou não
      return res.status(200).json({
        message: 'Se o email existir, um novo link de verificação será enviado'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Email já foi verificado',
        code: 'EMAIL_ALREADY_VERIFIED'
      });
    }

    // Gerar novo token
    const newToken = uuidv4();
    await userService.updateEmailVerificationToken(user.id, newToken);

    // Enviar email
    await emailService.sendVerificationEmail(user.email, user.name, newToken);

    logger.info('Reenvio de verificação de email', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      message: 'Novo link de verificação enviado'
    });

  } catch (error) {
    logger.error('Erro no reenvio de verificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'RESEND_VERIFICATION_ERROR'
    });
  }
});

// ==============================================
// ESQUECI MINHA SENHA
// ==============================================

router.post('/forgot-password', validateRequest(authSchemas.forgotPassword), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await userService.findByEmail(email);
    if (!user) {
      // Não revelar se email existe ou não
      return res.status(200).json({
        message: 'Se o email existir, um link de recuperação será enviado'
      });
    }

    // Gerar token de recuperação
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hora

    await userService.setPasswordResetToken(user.id, resetToken, resetExpires);

    // Enviar email de recuperação
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    logger.info('Solicitação de recuperação de senha', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      message: 'Link de recuperação enviado para seu email'
    });

  } catch (error) {
    logger.error('Erro na recuperação de senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

// ==============================================
// RESETAR SENHA
// ==============================================

router.post('/reset-password', validateRequest(authSchemas.resetPassword), async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // Buscar usuário pelo token
    const user = await userService.findByPasswordResetToken(token);
    if (!user) {
      return res.status(400).json({
        error: 'Token de recuperação inválido ou expirado',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha
    await userService.updatePassword(user.id, hashedPassword);

    // Invalidar todos os tokens do usuário
    await redisService.deleteRefreshToken(user.id);

    logger.info('Senha resetada', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    logger.error('Erro no reset de senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'RESET_PASSWORD_ERROR'
    });
  }
});

// ==============================================
// CONFIGURAR 2FA
// ==============================================

router.post('/setup-2fa', async (req: Request, res: Response) => {
  try {
    // Implementar middleware de autenticação aqui
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const user = await userService.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Gerar secret para 2FA
    const secret = speakeasy.generateSecret({
      name: `Vizinho Virtual (${user.email})`,
      issuer: 'Vizinho Virtual'
    });

    // Gerar QR Code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Salvar secret temporário (não ativar ainda)
    await userService.setTempTwoFactorSecret(userId, secret.base32);

    logger.info('2FA setup iniciado', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });

  } catch (error) {
    logger.error('Erro no setup 2FA:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'SETUP_2FA_ERROR'
    });
  }
});

// ==============================================
// VERIFICAR E ATIVAR 2FA
// ==============================================

router.post('/verify-2fa', validateRequest(authSchemas.verify2FA), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const user = await userService.findById(userId);
    if (!user || !user.tempTwoFactorSecret) {
      return res.status(400).json({
        error: 'Setup 2FA não iniciado',
        code: 'NO_2FA_SETUP'
      });
    }

    // Verificar token
    const isValid = speakeasy.totp.verify({
      secret: user.tempTwoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!isValid) {
      return res.status(400).json({
        error: 'Código inválido',
        code: 'INVALID_2FA_CODE'
      });
    }

    // Ativar 2FA
    await userService.enable2FA(userId, user.tempTwoFactorSecret);

    logger.info('2FA ativado', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      message: '2FA ativado com sucesso'
    });

  } catch (error) {
    logger.error('Erro na verificação 2FA:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'VERIFY_2FA_ERROR'
    });
  }
});

// ==============================================
// DESATIVAR 2FA
// ==============================================

router.post('/disable-2fa', validateRequest(authSchemas.disable2FA), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { password, twoFactorCode } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const user = await userService.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Senha incorreta',
        code: 'INVALID_PASSWORD'
      });
    }

    // Verificar código 2FA
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({
        error: '2FA não está ativado',
        code: '2FA_NOT_ENABLED'
      });
    }

    const isValidTwoFactor = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2
    });

    if (!isValidTwoFactor) {
      return res.status(400).json({
        error: 'Código 2FA inválido',
        code: 'INVALID_2FA_CODE'
      });
    }

    // Desativar 2FA
    await userService.disable2FA(userId);

    logger.info('2FA desativado', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      message: '2FA desativado com sucesso'
    });

  } catch (error) {
    logger.error('Erro ao desativar 2FA:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'DISABLE_2FA_ERROR'
    });
  }
});

export { router as authRoutes };