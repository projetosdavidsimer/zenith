/**
 * MIDDLEWARE DE AUTENTICAÇÃO E AUTORIZAÇÃO
 * 
 * Implementa:
 * - Verificação JWT
 * - Controle de acesso baseado em roles (RBAC)
 * - Proteção contra ataques de token
 * - Auditoria de acesso
 * 
 * @author Cybersecurity Expert - Vizinho Virtual
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/redis';

// Interfaces
interface JWTPayload {
  userId: string;
  email: string;
  role: 'SINDICO' | 'MORADOR' | 'PROFISSIONAL' | 'ADMIN';
  buildingId?: string;
  apartmentId?: string;
  permissions: string[];
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// ==============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ==============================================

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extrair token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Token de acesso requerido',
        code: 'MISSING_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar se token está na blacklist (logout/revogação)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({
        error: 'Token inválido ou expirado',
        code: 'TOKEN_BLACKLISTED'
      });
      return;
    }

    // Verificar e decodificar JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload;

    // Verificar se usuário ainda existe e está ativo
    const userExists = await redisClient.get(`user:${decoded.userId}:active`);
    if (!userExists) {
      res.status(401).json({
        error: 'Usuário não encontrado ou inativo',
        code: 'USER_INACTIVE'
      });
      return;
    }

    // Adicionar informações do usuário à request
    req.user = decoded;

    // Log de auditoria
    logger.info('Acesso autenticado', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    logger.error('Erro na autenticação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// ==============================================
// MIDDLEWARE DE AUTORIZAÇÃO POR ROLE
// ==============================================

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Tentativa de acesso negado', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.path
      });

      res.status(403).json({
        error: 'Acesso negado. Permissões insuficientes.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

// ==============================================
// MIDDLEWARE DE AUTORIZAÇÃO POR PERMISSÃO
// ==============================================

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      logger.warn('Tentativa de acesso negado por permissão', {
        userId: req.user.userId,
        role: req.user.role,
        requiredPermission: permission,
        userPermissions: req.user.permissions,
        endpoint: req.path
      });

      res.status(403).json({
        error: 'Acesso negado. Permissão específica requerida.',
        code: 'MISSING_PERMISSION'
      });
      return;
    }

    next();
  };
};

// ==============================================
// MIDDLEWARE DE AUTORIZAÇÃO POR CONDOMÍNIO
// ==============================================

export const requireBuildingAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  const buildingId = req.params.buildingId || req.body.buildingId;
  
  // Admin tem acesso a todos os condomínios
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  // Verificar se usuário tem acesso ao condomínio
  if (req.user.buildingId !== buildingId) {
    logger.warn('Tentativa de acesso a condomínio não autorizado', {
      userId: req.user.userId,
      userBuildingId: req.user.buildingId,
      requestedBuildingId: buildingId,
      endpoint: req.path
    });

    res.status(403).json({
      error: 'Acesso negado. Você não tem permissão para este condomínio.',
      code: 'BUILDING_ACCESS_DENIED'
    });
    return;
  }

  next();
};

// ==============================================
// MIDDLEWARE OPCIONAL (para rotas públicas)
// ==============================================

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    // Verificar blacklist
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      next();
      return;
    }

    // Verificar JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload;

    req.user = decoded;
    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    next();
  }
};

// ==============================================
// UTILITÁRIOS DE AUTORIZAÇÃO
// ==============================================

export const hasPermission = (user: JWTPayload, permission: string): boolean => {
  return user.permissions.includes(permission) || user.role === 'ADMIN';
};

export const isSindico = (user: JWTPayload): boolean => {
  return user.role === 'SINDICO' || user.role === 'ADMIN';
};

export const isMorador = (user: JWTPayload): boolean => {
  return user.role === 'MORADOR';
};

export const isProfissional = (user: JWTPayload): boolean => {
  return user.role === 'PROFISSIONAL';
};

export const isAdmin = (user: JWTPayload): boolean => {
  return user.role === 'ADMIN';
};

// ==============================================
// MIDDLEWARE COMBINADOS (Shortcuts)
// ==============================================

// Apenas síndicos
export const sindicoOnly = [
  authMiddleware,
  requireRole(['SINDICO', 'ADMIN'])
];

// Síndicos e moradores
export const buildingMembers = [
  authMiddleware,
  requireRole(['SINDICO', 'MORADOR', 'ADMIN'])
];

// Todos os usuários autenticados
export const authenticated = [authMiddleware];

// Admin apenas
export const adminOnly = [
  authMiddleware,
  requireRole(['ADMIN'])
];

export { AuthenticatedRequest };