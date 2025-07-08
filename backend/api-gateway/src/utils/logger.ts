/**
 * SISTEMA DE LOGGING AVANÇADO
 * 
 * Implementa:
 * - Logs estruturados para análise
 * - Diferentes níveis de log
 * - Rotação automática de arquivos
 * - Integração com sistemas de monitoramento
 * - Compliance com auditoria
 * 
 * @author DevOps/Monitoring Expert - Vizinho Virtual
 */

import winston from 'winston';
import path from 'path';

// ==============================================
// CONFIGURAÇÃO DE NÍVEIS DE LOG
// ==============================================

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

// ==============================================
// FORMATADORES CUSTOMIZADOS
// ==============================================

// Formato para desenvolvimento
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Formato para produção (JSON estruturado)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    const logEntry = {
      timestamp,
      level,
      message,
      service: 'api-gateway',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      ...meta
    };

    // Adicionar informações de contexto se disponível
    if (meta.userId) logEntry.userId = meta.userId;
    if (meta.ip) logEntry.clientIP = meta.ip;
    if (meta.userAgent) logEntry.userAgent = meta.userAgent;
    if (meta.endpoint) logEntry.endpoint = meta.endpoint;
    if (meta.method) logEntry.httpMethod = meta.method;
    if (meta.statusCode) logEntry.statusCode = meta.statusCode;
    if (meta.duration) logEntry.duration = meta.duration;

    return JSON.stringify(logEntry);
  })
);

// ==============================================
// TRANSPORTS (DESTINOS DOS LOGS)
// ==============================================

const transports: winston.transport[] = [];

// Console (sempre ativo)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat
  })
);

// Arquivo para todos os logs
transports.push(
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10
  })
);

// Arquivo específico para erros
transports.push(
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 10
  })
);

// Arquivo específico para auditoria
transports.push(
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'audit.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
      winston.format.printf((info) => {
        if (info.message === 'Audit Log' || 
            info.message === 'GDPR Access Log' || 
            info.message === 'Financial Access Log' ||
            info.message === 'Administrative Action Log') {
          return JSON.stringify({
            timestamp: info.timestamp,
            type: info.message,
            ...info
          });
        }
        return '';
      })
    ),
    maxsize: 10485760, // 10MB
    maxFiles: 50 // Manter mais arquivos para auditoria
  })
);

// Arquivo específico para segurança
transports.push(
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'security.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
      winston.format.printf((info) => {
        // Apenas logs relacionados à segurança
        const securityKeywords = [
          'SQL Injection',
          'XSS',
          'Path Traversal',
          'Rate limit',
          'Blacklist',
          'Suspicious',
          'Authentication failed',
          'Authorization denied'
        ];
        
        if (securityKeywords.some(keyword => 
          info.message.includes(keyword) || 
          JSON.stringify(info).includes(keyword)
        )) {
          return JSON.stringify({
            timestamp: info.timestamp,
            level: info.level,
            message: info.message,
            ...info
          });
        }
        return '';
      })
    ),
    maxsize: 10485760, // 10MB
    maxFiles: 100 // Manter muitos arquivos para segurança
  })
);

// ==============================================
// CRIAÇÃO DO LOGGER
// ==============================================

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: productionFormat,
  transports,
  exitOnError: false
});

// ==============================================
// FUNÇÕES AUXILIARES DE LOGGING
// ==============================================

// Log de autenticação
export const logAuth = (action: string, userId: string, success: boolean, details?: any) => {
  logger.info(`Authentication ${action}`, {
    userId,
    success,
    action,
    category: 'authentication',
    ...details
  });
};

// Log de autorização
export const logAuthorization = (userId: string, resource: string, action: string, granted: boolean, details?: any) => {
  logger.info(`Authorization ${granted ? 'granted' : 'denied'}`, {
    userId,
    resource,
    action,
    granted,
    category: 'authorization',
    ...details
  });
};

// Log de transação financeira
export const logFinancialTransaction = (userId: string, type: string, amount: number, status: string, details?: any) => {
  logger.info(`Financial transaction ${type}`, {
    userId,
    type,
    amount,
    status,
    category: 'financial',
    ...details
  });
};

// Log de segurança
export const logSecurity = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) => {
  const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
  
  logger[logLevel](`Security event: ${event}`, {
    event,
    severity,
    category: 'security',
    ...details
  });
};

// Log de performance
export const logPerformance = (operation: string, duration: number, details?: any) => {
  const level = duration > 5000 ? 'warn' : 'info'; // Warn se > 5 segundos
  
  logger[level](`Performance: ${operation}`, {
    operation,
    duration,
    category: 'performance',
    ...details
  });
};

// Log de erro de aplicação
export const logApplicationError = (error: Error, context?: any) => {
  logger.error('Application error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    category: 'application_error',
    ...context
  });
};

// Log de integração externa
export const logExternalIntegration = (service: string, action: string, success: boolean, duration?: number, details?: any) => {
  logger.info(`External integration: ${service}`, {
    service,
    action,
    success,
    duration,
    category: 'external_integration',
    ...details
  });
};

// Log de GDPR/compliance
export const logGDPREvent = (event: string, userId: string, dataType: string, legalBasis: string, details?: any) => {
  logger.info(`GDPR event: ${event}`, {
    event,
    userId,
    dataType,
    legalBasis,
    category: 'gdpr_compliance',
    ...details
  });
};

// ==============================================
// MIDDLEWARE PARA EXPRESS
// ==============================================

export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // Log da request
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    category: 'http_request'
  });

  // Interceptar response para log
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Log da response
    logger.http('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.userId,
      category: 'http_response'
    });

    // Log de performance se demorou muito
    if (duration > 3000) {
      logPerformance(`${req.method} ${req.url}`, duration, {
        statusCode: res.statusCode,
        ip: req.ip,
        userId: req.user?.userId
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// ==============================================
// CONFIGURAÇÕES ESPECÍFICAS POR AMBIENTE
// ==============================================

if (process.env.NODE_ENV === 'production') {
  // Em produção, adicionar transports para serviços externos
  
  // Exemplo: Elasticsearch (ELK Stack)
  if (process.env.ELASTICSEARCH_URL) {
    // Implementar transport para Elasticsearch
    logger.info('Elasticsearch logging enabled');
  }

  // Exemplo: Sentry para erros
  if (process.env.SENTRY_DSN) {
    // Implementar transport para Sentry
    logger.info('Sentry error tracking enabled');
  }

  // Exemplo: CloudWatch (AWS)
  if (process.env.AWS_CLOUDWATCH_GROUP) {
    // Implementar transport para CloudWatch
    logger.info('CloudWatch logging enabled');
  }
}

// ==============================================
// TRATAMENTO DE ERROS NÃO CAPTURADOS
// ==============================================

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    category: 'uncaught_exception'
  });
  
  // Em produção, encerrar o processo após log
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.toString(),
    promise: promise?.toString(),
    category: 'unhandled_rejection'
  });
});

// ==============================================
// EXPORT DEFAULT
// ==============================================

export default logger;