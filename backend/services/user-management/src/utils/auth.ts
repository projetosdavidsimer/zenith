/**
 * UTILITÁRIOS DE AUTENTICAÇÃO E SEGURANÇA
 * 
 * Implementa:
 * - Geração e verificação de tokens JWT
 * - Hash e verificação de senhas
 * - Blacklist de tokens
 * - Geração de códigos seguros
 * - Criptografia de dados sensíveis
 * 
 * @author Cybersecurity Expert - Vizinho Virtual
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { RedisService } from '../services/RedisService';

const redisService = new RedisService();

// ==============================================
// INTERFACES
// ==============================================

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SINDICO' | 'MORADOR' | 'PROFISSIONAL' | 'ADMIN';
  buildingId?: string;
  apartmentNumber?: string;
  permissions?: string[];
}

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  buildingId?: string;
  apartmentId?: string;
  permissions: string[];
  iat: number;
  exp: number;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// ==============================================
// CONFIGURAÇÕES DE SEGURANÇA
// ==============================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-encryption-key-32-chars!';

// ==============================================
// GERAÇÃO E VERIFICAÇÃO DE SENHAS
// ==============================================

/**
 * Gerar hash seguro da senha
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    
    logger.debug('Senha hasheada com sucesso');
    return hash;
  } catch (error) {
    logger.error('Erro ao hashear senha:', error);
    throw new Error('Erro ao processar senha');
  }
};

/**
 * Verificar senha contra hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    const isValid = await bcrypt.compare(password, hash);
    
    logger.debug('Verificação de senha realizada', { isValid });
    return isValid;
  } catch (error) {
    logger.error('Erro ao verificar senha:', error);
    return false;
  }
};

/**
 * Gerar senha temporária segura
 */
export const generateTemporaryPassword = (length: number = 12): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  // Garantir que tem pelo menos um de cada tipo
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@#$%&*]/.test(password);
  
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return generateTemporaryPassword(length); // Tentar novamente
  }
  
  return password;
};

// ==============================================
// GERAÇÃO E VERIFICAÇÃO DE TOKENS JWT
// ==============================================

/**
 * Gerar tokens de acesso e refresh
 */
export const generateTokens = async (user: User): Promise<Tokens> => {
  try {
    // Buscar permissões do usuário
    const permissions = await getUserPermissions(user.role, user.buildingId);
    
    // Payload do token de acesso
    const accessPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      buildingId: user.buildingId,
      apartmentId: user.apartmentNumber,
      permissions,
      type: 'access'
    };
    
    // Payload do token de refresh
    const refreshPayload = {
      userId: user.id,
      email: user.email,
      type: 'refresh'
    };
    
    // Gerar tokens
    const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'vizinho-virtual',
      audience: 'vizinho-virtual-app'
    });
    
    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'vizinho-virtual',
      audience: 'vizinho-virtual-app'
    });
    
    logger.info('Tokens gerados com sucesso', {
      userId: user.id,
      role: user.role
    });
    
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Erro ao gerar tokens:', error);
    throw new Error('Erro ao gerar tokens de autenticação');
  }
};

/**
 * Verificar token de acesso
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'vizinho-virtual',
      audience: 'vizinho-virtual-app'
    }) as TokenPayload;
    
    if (decoded.type !== 'access') {
      throw new Error('Tipo de token inválido');
    }
    
    return decoded;
  } catch (error) {
    logger.warn('Token de acesso inválido:', error);
    return null;
  }
};

/**
 * Verificar token de refresh
 */
export const verifyRefreshToken = (token: string): { userId: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'vizinho-virtual',
      audience: 'vizinho-virtual-app'
    }) as any;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Tipo de token inválido');
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    logger.warn('Token de refresh inválido:', error);
    return null;
  }
};

/**
 * Adicionar token à blacklist
 */
export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return;
    }
    
    // Calcular TTL baseado na expiração do token
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;
    
    if (ttl > 0) {
      await redisService.setBlacklistedToken(token, ttl);
      logger.info('Token adicionado à blacklist', {
        tokenId: decoded.jti || 'unknown',
        userId: decoded.userId,
        ttl
      });
    }
  } catch (error) {
    logger.error('Erro ao adicionar token à blacklist:', error);
  }
};

/**
 * Verificar se token está na blacklist
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    return await redisService.isTokenBlacklisted(token);
  } catch (error) {
    logger.error('Erro ao verificar blacklist:', error);
    return false; // Em caso de erro, permitir o token
  }
};

// ==============================================
// PERMISSÕES E AUTORIZAÇÃO
// ==============================================

/**
 * Obter permissões do usuário baseado no role
 */
const getUserPermissions = async (role: string, buildingId?: string): Promise<string[]> => {
  const basePermissions: { [key: string]: string[] } = {
    ADMIN: [
      'admin:*',
      'user:*',
      'building:*',
      'financial:*',
      'communication:*',
      'assembly:*',
      'marketplace:*',
      'professional:*',
      'security:*'
    ],
    SINDICO: [
      'user:read',
      'user:update',
      'building:read',
      'building:update',
      'financial:*',
      'communication:*',
      'assembly:*',
      'marketplace:read',
      'professional:read',
      'security:read'
    ],
    MORADOR: [
      'user:read:own',
      'user:update:own',
      'building:read',
      'financial:read:own',
      'financial:pay',
      'communication:read',
      'communication:send',
      'assembly:read',
      'assembly:vote',
      'marketplace:*',
      'professional:read'
    ],
    PROFISSIONAL: [
      'user:read:own',
      'user:update:own',
      'professional:*',
      'communication:read',
      'communication:send',
      'marketplace:read'
    ]
  };
  
  return basePermissions[role] || [];
};

/**
 * Verificar se usuário tem permissão específica
 */
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  // Verificar permissão exata
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Verificar permissões wildcard
  const parts = requiredPermission.split(':');
  for (let i = parts.length; i > 0; i--) {
    const wildcardPermission = parts.slice(0, i).join(':') + ':*';
    if (userPermissions.includes(wildcardPermission)) {
      return true;
    }
  }
  
  // Verificar permissão admin total
  if (userPermissions.includes('admin:*')) {
    return true;
  }
  
  return false;
};

// ==============================================
// CRIPTOGRAFIA DE DADOS SENSÍVEIS
// ==============================================

/**
 * Criptografar dados sensíveis
 */
export const encryptSensitiveData = (data: string): string => {
  try {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('vizinho-virtual', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combinar IV, authTag e dados criptografados
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    logger.error('Erro ao criptografar dados:', error);
    throw new Error('Erro na criptografia');
  }
};

/**
 * Descriptografar dados sensíveis
 */
export const decryptSensitiveData = (encryptedData: string): string => {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Formato de dados criptografados inválido');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('vizinho-virtual', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Erro ao descriptografar dados:', error);
    throw new Error('Erro na descriptografia');
  }
};

// ==============================================
// GERAÇÃO DE CÓDIGOS SEGUROS
// ==============================================

/**
 * Gerar código numérico seguro
 */
export const generateSecureCode = (length: number = 6): string => {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    code += digits[randomIndex];
  }
  
  return code;
};

/**
 * Gerar token alfanumérico seguro
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Gerar UUID v4
 */
export const generateUUID = (): string => {
  return uuidv4();
};

// ==============================================
// VALIDAÇÃO DE FORÇA DE SENHA
// ==============================================

export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
  isStrong: boolean;
}

/**
 * Avaliar força da senha
 */
export const evaluatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Comprimento
  if (password.length >= 8) score += 1;
  else feedback.push('Use pelo menos 8 caracteres');

  if (password.length >= 12) score += 1;
  else feedback.push('Use pelo menos 12 caracteres para maior segurança');

  // Complexidade
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Inclua letras minúsculas');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Inclua letras maiúsculas');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Inclua números');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('Inclua caracteres especiais');

  // Padrões ruins
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Evite repetir o mesmo caractere');
  }

  if (/123|abc|qwe|password|admin|123456/i.test(password)) {
    score -= 1;
    feedback.push('Evite sequências ou palavras comuns');
  }

  const isStrong = score >= 4 && password.length >= 8;

  return {
    score: Math.max(0, Math.min(5, score)),
    feedback,
    isStrong
  };
};

// ==============================================
// UTILITÁRIOS DE TEMPO
// ==============================================

/**
 * Gerar timestamp de expiração
 */
export const generateExpirationTime = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Verificar se timestamp expirou
 */
export const isExpired = (expirationTime: Date): boolean => {
  return new Date() > expirationTime;
};

// ==============================================
// HASH DE DADOS PARA AUDITORIA
// ==============================================

/**
 * Gerar hash SHA-256 para auditoria
 */
export const generateAuditHash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Verificar integridade de dados
 */
export const verifyDataIntegrity = (data: string, hash: string): boolean => {
  const computedHash = generateAuditHash(data);
  return computedHash === hash;
};