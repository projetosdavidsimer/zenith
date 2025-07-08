/**
 * MIDDLEWARE DE SEGURANÇA AVANÇADA
 * 
 * Implementa proteções contra:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - CSRF (Cross-Site Request Forgery)
 * - Path Traversal
 * - Ataques de força bruta
 * - Fingerprinting
 * 
 * @author Cybersecurity Expert - Vizinho Virtual
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/redis';

// ==============================================
// DETECÇÃO DE ATAQUES SQL INJECTION
// ==============================================

const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec(\s|\+)+(s|x)p\w+/i,
  /union([^a-z]|[\s])+select/i,
  /select.*from.*where/i,
  /insert.*into.*values/i,
  /delete.*from.*where/i,
  /update.*set.*where/i,
  /drop.*table/i,
  /create.*table/i,
  /alter.*table/i
];

const detectSQLInjection = (input: string): boolean => {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

// ==============================================
// DETECÇÃO DE ATAQUES XSS
// ==============================================

const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /<img[^>]*src[^>]*>/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi
];

const detectXSS = (input: string): boolean => {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

// ==============================================
// DETECÇÃO DE PATH TRAVERSAL
// ==============================================

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /%2e%2e\//gi,
  /%2e%2e\\/gi
];

const detectPathTraversal = (input: string): boolean => {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
};

// ==============================================
// MIDDLEWARE PRINCIPAL DE SEGURANÇA
// ==============================================

export const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const requestData = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });

    // ==============================================
    // 1. VERIFICAR BLACKLIST DE IPs
    // ==============================================
    
    const isBlacklisted = await redisClient.get(`blacklist:ip:${clientIP}`);
    if (isBlacklisted) {
      logger.warn('Tentativa de acesso de IP bloqueado', {
        ip: clientIP,
        userAgent,
        endpoint: req.path
      });

      res.status(403).json({
        error: 'Acesso negado',
        code: 'IP_BLACKLISTED'
      });
      return;
    }

    // ==============================================
    // 2. DETECÇÃO DE SQL INJECTION
    // ==============================================
    
    if (detectSQLInjection(requestData)) {
      logger.error('Tentativa de SQL Injection detectada', {
        ip: clientIP,
        userAgent,
        endpoint: req.path,
        method: req.method,
        data: requestData
      });

      // Incrementar contador de tentativas suspeitas
      const suspiciousKey = `suspicious:${clientIP}`;
      const attempts = await redisClient.incr(suspiciousKey);
      await redisClient.expire(suspiciousKey, 3600); // 1 hora

      // Bloquear IP após 5 tentativas suspeitas
      if (attempts >= 5) {
        await redisClient.setex(`blacklist:ip:${clientIP}`, 86400, 'sql_injection'); // 24 horas
        logger.error('IP bloqueado por múltiplas tentativas de SQL Injection', {
          ip: clientIP,
          attempts
        });
      }

      res.status(400).json({
        error: 'Requisição inválida',
        code: 'INVALID_REQUEST'
      });
      return;
    }

    // ==============================================
    // 3. DETECÇÃO DE XSS
    // ==============================================
    
    if (detectXSS(requestData)) {
      logger.error('Tentativa de XSS detectada', {
        ip: clientIP,
        userAgent,
        endpoint: req.path,
        method: req.method,
        data: requestData
      });

      res.status(400).json({
        error: 'Conteúdo não permitido',
        code: 'INVALID_CONTENT'
      });
      return;
    }

    // ==============================================
    // 4. DETECÇÃO DE PATH TRAVERSAL
    // ==============================================
    
    if (detectPathTraversal(req.path) || detectPathTraversal(requestData)) {
      logger.error('Tentativa de Path Traversal detectada', {
        ip: clientIP,
        userAgent,
        endpoint: req.path,
        method: req.method
      });

      res.status(400).json({
        error: 'Caminho inválido',
        code: 'INVALID_PATH'
      });
      return;
    }

    // ==============================================
    // 5. VERIFICAÇÃO DE USER AGENT SUSPEITO
    // ==============================================
    
    const suspiciousUserAgents = [
      'sqlmap',
      'nikto',
      'nmap',
      'masscan',
      'nessus',
      'openvas',
      'burpsuite',
      'owasp',
      'havij',
      'pangolin'
    ];

    if (suspiciousUserAgents.some(agent => 
      userAgent.toLowerCase().includes(agent.toLowerCase())
    )) {
      logger.warn('User Agent suspeito detectado', {
        ip: clientIP,
        userAgent,
        endpoint: req.path
      });

      res.status(403).json({
        error: 'Acesso negado',
        code: 'SUSPICIOUS_USER_AGENT'
      });
      return;
    }

    // ==============================================
    // 6. VERIFICAÇÃO DE TAMANHO DE PAYLOAD
    // ==============================================
    
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxPayloadSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxPayloadSize) {
      logger.warn('Payload muito grande detectado', {
        ip: clientIP,
        contentLength,
        maxAllowed: maxPayloadSize,
        endpoint: req.path
      });

      res.status(413).json({
        error: 'Payload muito grande',
        code: 'PAYLOAD_TOO_LARGE'
      });
      return;
    }

    // ==============================================
    // 7. VERIFICAÇÃO DE HEADERS SUSPEITOS
    // ==============================================
    
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
      'x-remote-ip',
      'x-cluster-client-ip'
    ];

    let hasMultipleIpHeaders = 0;
    suspiciousHeaders.forEach(header => {
      if (req.get(header)) {
        hasMultipleIpHeaders++;
      }
    });

    if (hasMultipleIpHeaders > 2) {
      logger.warn('Múltiplos headers de IP detectados (possível spoofing)', {
        ip: clientIP,
        headers: suspiciousHeaders.filter(h => req.get(h)),
        endpoint: req.path
      });
    }

    // ==============================================
    // 8. RATE LIMITING POR ENDPOINT SENSÍVEL
    // ==============================================
    
    const sensitiveEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/payments',
      '/api/assemblies/vote'
    ];

    if (sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
      const rateLimitKey = `rate_limit:${clientIP}:${req.path}`;
      const requests = await redisClient.incr(rateLimitKey);
      await redisClient.expire(rateLimitKey, 300); // 5 minutos

      if (requests > 10) { // máximo 10 requests por 5 minutos
        logger.warn('Rate limit excedido para endpoint sensível', {
          ip: clientIP,
          endpoint: req.path,
          requests
        });

        res.status(429).json({
          error: 'Muitas tentativas. Tente novamente em alguns minutos.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
        return;
      }
    }

    // ==============================================
    // 9. SANITIZAÇÃO DE DADOS
    // ==============================================
    
    // Sanitizar recursivamente todos os strings nos dados
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/[<>]/g, '') // Remove < e >
          .replace(/javascript:/gi, '') // Remove javascript:
          .replace(/vbscript:/gi, '') // Remove vbscript:
          .trim();
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }
      
      return obj;
    };

    // Aplicar sanitização
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);

    // ==============================================
    // 10. HEADERS DE SEGURANÇA ADICIONAIS
    // ==============================================
    
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Remover headers que revelam informações do servidor
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
  } catch (error) {
    logger.error('Erro no middleware de segurança:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// ==============================================
// MIDDLEWARE DE PROTEÇÃO CSRF
// ==============================================

export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Verificar se é uma requisição que modifica dados
  const modifyingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!modifyingMethods.includes(req.method)) {
    next();
    return;
  }

  // Verificar origin/referer
  const origin = req.get('Origin') || req.get('Referer');
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://app.vizinhovirtual.com']
    : ['http://localhost:3100', 'http://localhost:3000'];

  if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    logger.warn('Possível ataque CSRF detectado', {
      ip: req.ip,
      origin,
      endpoint: req.path,
      method: req.method
    });

    res.status(403).json({
      error: 'Origem não permitida',
      code: 'INVALID_ORIGIN'
    });
    return;
  }

  next();
};

// ==============================================
// UTILITÁRIOS DE SEGURANÇA
// ==============================================

export const blockIP = async (ip: string, reason: string, duration: number = 86400): Promise<void> => {
  await redisClient.setex(`blacklist:ip:${ip}`, duration, reason);
  logger.info(`IP ${ip} bloqueado por ${reason} por ${duration} segundos`);
};

export const unblockIP = async (ip: string): Promise<void> => {
  await redisClient.del(`blacklist:ip:${ip}`);
  logger.info(`IP ${ip} desbloqueado`);
};

export const isIPBlocked = async (ip: string): Promise<boolean> => {
  const blocked = await redisClient.get(`blacklist:ip:${ip}`);
  return !!blocked;
};