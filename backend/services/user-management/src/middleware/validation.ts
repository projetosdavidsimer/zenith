/**
 * MIDDLEWARE DE VALIDAÇÃO
 * 
 * Implementa validação de dados de entrada usando Joi
 * com tratamento de erros personalizado e sanitização
 * 
 * @author Backend Expert - Vizinho Virtual
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

// ==============================================
// INTERFACE DE ERRO DE VALIDAÇÃO
// ==============================================

interface ValidationError {
  field: string;
  message: string;
  value?: any;
  type: string;
}

// ==============================================
// MIDDLEWARE DE VALIDAÇÃO
// ==============================================

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validar dados da requisição
      const { error, value } = schema.validate({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers
      }, {
        abortEarly: false, // Retornar todos os erros
        allowUnknown: false, // Não permitir campos desconhecidos
        stripUnknown: true, // Remover campos desconhecidos
        convert: true // Converter tipos automaticamente
      });

      if (error) {
        // Processar erros de validação
        const validationErrors: ValidationError[] = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          type: detail.type
        }));

        // Log do erro de validação
        logger.warn('Erro de validação', {
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          errors: validationErrors
        });

        res.status(400).json({
          error: 'Dados de entrada inválidos',
          code: 'VALIDATION_ERROR',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Substituir dados validados e sanitizados
      if (value.body) req.body = value.body;
      if (value.query) req.query = value.query;
      if (value.params) req.params = value.params;

      next();
    } catch (validationError) {
      logger.error('Erro interno na validação:', validationError);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_VALIDATION_ERROR'
      });
    }
  };
};

// ==============================================
// VALIDAÇÃO CONDICIONAL
// ==============================================

export const validateConditional = (
  condition: (req: Request) => boolean,
  schema: Joi.ObjectSchema
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      validateRequest(schema)(req, res, next);
    } else {
      next();
    }
  };
};

// ==============================================
// SANITIZAÇÃO DE DADOS
// ==============================================

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Função recursiva para sanitizar objetos
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .trim() // Remover espaços em branco
          .replace(/[<>]/g, '') // Remover < e >
          .replace(/javascript:/gi, '') // Remover javascript:
          .replace(/vbscript:/gi, '') // Remover vbscript:
          .replace(/on\w+\s*=/gi, ''); // Remover event handlers
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          // Sanitizar chave também
          const sanitizedKey = key.replace(/[<>]/g, '').trim();
          if (sanitizedKey) {
            sanitized[sanitizedKey] = sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }
      
      return obj;
    };

    // Aplicar sanitização
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);

    next();
  } catch (error) {
    logger.error('Erro na sanitização:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'SANITIZATION_ERROR'
    });
  }
};

// ==============================================
// VALIDAÇÃO DE ARQUIVO
// ==============================================

export const validateFile = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const file = req.file;
      const {
        maxSize = 5 * 1024 * 1024, // 5MB padrão
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
        required = false
      } = options;

      // Verificar se arquivo é obrigatório
      if (required && !file) {
        res.status(400).json({
          error: 'Arquivo é obrigatório',
          code: 'FILE_REQUIRED'
        });
        return;
      }

      // Se não há arquivo e não é obrigatório, continuar
      if (!file) {
        next();
        return;
      }

      // Verificar tamanho
      if (file.size > maxSize) {
        res.status(400).json({
          error: `Arquivo muito grande. Máximo permitido: ${maxSize / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE'
        });
        return;
      }

      // Verificar tipo
      if (!allowedTypes.includes(file.mimetype)) {
        res.status(400).json({
          error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        });
        return;
      }

      // Verificar se é realmente uma imagem (magic numbers)
      if (file.mimetype.startsWith('image/')) {
        const isValidImage = validateImageFile(file.buffer);
        if (!isValidImage) {
          res.status(400).json({
            error: 'Arquivo não é uma imagem válida',
            code: 'INVALID_IMAGE_FILE'
          });
          return;
        }
      }

      next();
    } catch (error) {
      logger.error('Erro na validação de arquivo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'FILE_VALIDATION_ERROR'
      });
    }
  };
};

// ==============================================
// VALIDAÇÃO DE IMAGEM
// ==============================================

const validateImageFile = (buffer: Buffer): boolean => {
  try {
    // Magic numbers para diferentes tipos de imagem
    const magicNumbers = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46]
    };

    // Verificar JPEG
    if (buffer.length >= 3 && 
        buffer[0] === magicNumbers.jpeg[0] && 
        buffer[1] === magicNumbers.jpeg[1] && 
        buffer[2] === magicNumbers.jpeg[2]) {
      return true;
    }

    // Verificar PNG
    if (buffer.length >= 4 && 
        buffer[0] === magicNumbers.png[0] && 
        buffer[1] === magicNumbers.png[1] && 
        buffer[2] === magicNumbers.png[2] && 
        buffer[3] === magicNumbers.png[3]) {
      return true;
    }

    // Verificar GIF
    if (buffer.length >= 3 && 
        buffer[0] === magicNumbers.gif[0] && 
        buffer[1] === magicNumbers.gif[1] && 
        buffer[2] === magicNumbers.gif[2]) {
      return true;
    }

    // Verificar WebP
    if (buffer.length >= 12 && 
        buffer[0] === magicNumbers.webp[0] && 
        buffer[1] === magicNumbers.webp[1] && 
        buffer[2] === magicNumbers.webp[2] && 
        buffer[3] === magicNumbers.webp[3] &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && 
        buffer[10] === 0x42 && buffer[11] === 0x50) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

// ==============================================
// VALIDAÇÃO DE RATE LIMIT POR USUÁRIO
// ==============================================

export const validateUserRateLimit = (
  maxRequests: number,
  windowMs: number,
  keyGenerator?: (req: Request) => string
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const key = keyGenerator ? keyGenerator(req) : 
                  (req as any).user?.userId || req.ip;
      
      const now = Date.now();
      const userRequests = requests.get(key);

      if (!userRequests || now > userRequests.resetTime) {
        // Primeira requisição ou janela expirou
        requests.set(key, {
          count: 1,
          resetTime: now + windowMs
        });
        next();
        return;
      }

      if (userRequests.count >= maxRequests) {
        // Limite excedido
        const resetIn = Math.ceil((userRequests.resetTime - now) / 1000);
        
        res.status(429).json({
          error: 'Muitas tentativas. Tente novamente mais tarde.',
          code: 'USER_RATE_LIMIT_EXCEEDED',
          retryAfter: resetIn
        });
        return;
      }

      // Incrementar contador
      userRequests.count++;
      next();

    } catch (error) {
      logger.error('Erro no rate limit por usuário:', error);
      next(); // Em caso de erro, permitir a requisição
    }
  };
};

// ==============================================
// VALIDAÇÃO DE DADOS PESSOAIS (GDPR)
// ==============================================

export const validatePersonalData = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const sensitiveFields = ['email', 'phone', 'nif', 'address', 'birthDate'];
    const requestData = JSON.stringify({ ...req.body, ...req.query });
    
    // Verificar se contém dados pessoais
    const containsPersonalData = sensitiveFields.some(field => 
      requestData.toLowerCase().includes(field.toLowerCase())
    );

    if (containsPersonalData) {
      // Adicionar flag para auditoria GDPR
      (req as any).containsPersonalData = true;
      
      // Log para compliance
      logger.info('Requisição com dados pessoais', {
        endpoint: req.path,
        method: req.method,
        userId: (req as any).user?.userId,
        ip: req.ip,
        gdprRelevant: true
      });
    }

    next();
  } catch (error) {
    logger.error('Erro na validação de dados pessoais:', error);
    next();
  }
};

// ==============================================
// UTILITÁRIOS DE VALIDAÇÃO
// ==============================================

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const isValidNIF = (nif: string): boolean => {
  if (!/^\d{9}$/.test(nif)) return false;
  
  const digits = nif.split('').map(Number);
  const checkDigit = digits[8];
  
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (9 - i);
  }
  
  const remainder = sum % 11;
  const expectedCheckDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return checkDigit === expectedCheckDigit;
};