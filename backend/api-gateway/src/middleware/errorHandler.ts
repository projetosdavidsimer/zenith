/**
 * MIDDLEWARE DE TRATAMENTO DE ERROS
 * 
 * Implementa:
 * - Tratamento centralizado de erros
 * - Logs estruturados de erros
 * - Respostas padronizadas
 * - Ocultação de detalhes em produção
 * - Notificações para erros críticos
 * 
 * @author Backend Expert - Vizinho Virtual
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ==============================================
// INTERFACES DE ERRO
// ==============================================

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  details?: any;
}

interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  details?: any;
}

// ==============================================
// CLASSES DE ERRO CUSTOMIZADAS
// ==============================================

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  isOperational = true;

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  isOperational = true;

  constructor(message: string = 'Não autenticado') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  isOperational = true;

  constructor(message: string = 'Acesso negado') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';
  isOperational = true;

  constructor(message: string = 'Recurso não encontrado') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';
  isOperational = true;

  constructor(message: string = 'Conflito de dados') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  isOperational = true;

  constructor(message: string = 'Muitas tentativas. Tente novamente mais tarde.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends Error {
  statusCode = 503;
  code = 'SERVICE_UNAVAILABLE';
  isOperational = true;

  constructor(message: string = 'Serviço temporariamente indisponível') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

export class DatabaseError extends Error {
  statusCode = 500;
  code = 'DATABASE_ERROR';
  isOperational = true;

  constructor(message: string = 'Erro de banco de dados') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error {
  statusCode = 502;
  code = 'EXTERNAL_SERVICE_ERROR';
  isOperational = true;

  constructor(message: string = 'Erro em serviço externo', public service?: string) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

// ==============================================
// MIDDLEWARE PRINCIPAL DE TRATAMENTO DE ERROS
// ==============================================

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Gerar ID único para o erro
  const errorId = generateErrorId();
  
  // Adicionar ID do erro à request para rastreamento
  (req as any).errorId = errorId;

  // Determinar status code
  const statusCode = error.statusCode || 500;
  
  // Determinar se é erro operacional ou de programação
  const isOperational = error.isOperational || false;

  // Preparar dados do erro para log
  const errorData = {
    errorId,
    name: error.name,
    message: error.message,
    statusCode,
    isOperational,
    stack: error.stack,
    code: error.code,
    details: error.details,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    timestamp: new Date().toISOString()
  };

  // Log do erro
  if (statusCode >= 500) {
    logger.error('Erro interno do servidor', errorData);
    
    // Notificar erros críticos (implementar integração com Slack/email)
    if (!isOperational) {
      notifyCriticalError(errorData);
    }
  } else if (statusCode >= 400) {
    logger.warn('Erro de cliente', errorData);
  } else {
    logger.info('Erro informativo', errorData);
  }

  // Preparar resposta para o cliente
  const errorResponse: ErrorResponse = {
    error: getClientErrorMessage(error, statusCode),
    code: error.code || getDefaultErrorCode(statusCode),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    requestId: errorId
  };

  // Adicionar detalhes apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development' && error.details) {
    errorResponse.details = error.details;
  }

  // Adicionar stack trace apenas em desenvolvimento para erros 500
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    (errorResponse as any).stack = error.stack;
  }

  // Headers de segurança para erros
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Enviar resposta
  res.status(statusCode).json(errorResponse);
};

// ==============================================
// MIDDLEWARE PARA ERROS ASSÍNCRONOS
// ==============================================

export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getClientErrorMessage = (error: AppError, statusCode: number): string => {
  // Em produção, não expor detalhes internos
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  }

  // Mensagens específicas por tipo de erro
  const errorMessages: { [key: string]: string } = {
    'ValidationError': 'Dados inválidos fornecidos',
    'AuthenticationError': 'Credenciais inválidas ou token expirado',
    'AuthorizationError': 'Você não tem permissão para acessar este recurso',
    'NotFoundError': 'Recurso solicitado não foi encontrado',
    'ConflictError': 'Conflito com dados existentes',
    'RateLimitError': 'Muitas tentativas. Aguarde antes de tentar novamente',
    'ServiceUnavailableError': 'Serviço temporariamente indisponível',
    'DatabaseError': 'Erro de banco de dados',
    'ExternalServiceError': 'Erro em serviço externo'
  };

  return errorMessages[error.name] || error.message || 'Erro desconhecido';
};

const getDefaultErrorCode = (statusCode: number): string => {
  const codes: { [key: number]: string } = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };

  return codes[statusCode] || 'UNKNOWN_ERROR';
};

const notifyCriticalError = async (errorData: any): Promise<void> => {
  try {
    // Implementar notificação para erros críticos
    // Exemplos: Slack, email, PagerDuty, etc.
    
    logger.error('ERRO CRÍTICO DETECTADO', {
      ...errorData,
      severity: 'CRITICAL',
      requiresAttention: true
    });

    // Em produção, implementar notificações reais
    if (process.env.NODE_ENV === 'production') {
      // await sendSlackNotification(errorData);
      // await sendEmailAlert(errorData);
      // await triggerPagerDuty(errorData);
    }

  } catch (notificationError) {
    logger.error('Falha ao enviar notificação de erro crítico', {
      originalError: errorData,
      notificationError
    });
  }
};

// ==============================================
// MIDDLEWARE PARA CAPTURAR ERROS NÃO TRATADOS
// ==============================================

export const unhandledErrorHandler = (): void => {
  // Capturar exceções não tratadas
  process.on('uncaughtException', (error: Error) => {
    logger.error('Exceção não capturada', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      severity: 'CRITICAL'
    });

    // Em produção, encerrar o processo graciosamente
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // Capturar promises rejeitadas não tratadas
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Promise rejeitada não tratada', {
      reason: reason?.toString(),
      promise: promise?.toString(),
      severity: 'CRITICAL'
    });

    // Em produção, encerrar o processo graciosamente
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
};

// ==============================================
// MIDDLEWARE PARA VALIDAÇÃO DE DADOS
// ==============================================

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate({
        body: req.body,
        query: req.query,
        params: req.params
      }, { abortEarly: false });

      if (error) {
        const details = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        throw new ValidationError('Dados de entrada inválidos', details);
      }

      // Substituir dados validados
      req.body = value.body || req.body;
      req.query = value.query || req.query;
      req.params = value.params || req.params;

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ==============================================
// UTILITÁRIOS PARA LANÇAR ERROS
// ==============================================

export const throwValidationError = (message: string, details?: any): never => {
  throw new ValidationError(message, details);
};

export const throwAuthenticationError = (message?: string): never => {
  throw new AuthenticationError(message);
};

export const throwAuthorizationError = (message?: string): never => {
  throw new AuthorizationError(message);
};

export const throwNotFoundError = (message?: string): never => {
  throw new NotFoundError(message);
};

export const throwConflictError = (message?: string): never => {
  throw new ConflictError(message);
};

export const throwRateLimitError = (message?: string): never => {
  throw new RateLimitError(message);
};

export const throwServiceUnavailableError = (message?: string): never => {
  throw new ServiceUnavailableError(message);
};

export const throwDatabaseError = (message?: string): never => {
  throw new DatabaseError(message);
};

export const throwExternalServiceError = (message?: string, service?: string): never => {
  throw new ExternalServiceError(message, service);
};

// Inicializar handler de erros não tratados
unhandledErrorHandler();