/**
 * VIZINHO VIRTUAL - API GATEWAY
 * 
 * Gateway principal que gerencia:
 * - Roteamento para microsserviços
 * - Autenticação e autorização
 * - Rate limiting e segurança
 * - Logging e monitoramento
 * - CORS e headers de segurança
 * 
 * @author Vizinho Virtual Team
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/security';
import { auditMiddleware } from './middleware/audit';
import { healthCheck } from './routes/health';
import { metricsRouter } from './routes/metrics';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==============================================
// MIDDLEWARE DE SEGURANÇA (Cybersecurity Expert)
// ==============================================

// Headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configurado para produção
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://app.vizinhovirtual.com', 'https://www.vizinhovirtual.com']
    : ['http://localhost:3100', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compressão
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Parse JSON com limite de tamanho
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==============================================
// RATE LIMITING (Proteção contra DDoS)
// ==============================================

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
});

// Slow down para requests suspeitos
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 100, // permitir 100 requests por 15min sem delay
  delayMs: 500 // adicionar 500ms de delay para cada request adicional
});

app.use(generalLimiter);
app.use(speedLimiter);

// ==============================================
// MIDDLEWARE CUSTOMIZADO
// ==============================================

// Middleware de segurança customizado
app.use(securityMiddleware);

// Middleware de auditoria (compliance GDPR)
app.use(auditMiddleware);

// ==============================================
// ROTAS DE SISTEMA
// ==============================================

// Health check
app.use('/health', healthCheck);

// Métricas (protegido)
app.use('/metrics', authMiddleware, metricsRouter);

// ==============================================
// PROXY PARA MICROSSERVIÇOS
// ==============================================

// User Management Service
app.use('/api/auth', authLimiter, createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    logger.error('Proxy error - User Service:', err);
    res.status(503).json({ 
      error: 'Serviço temporariamente indisponível',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/users', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  }
}));

// Building Management Service
app.use('/api/buildings', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/buildings': '/api/buildings'
  }
}));

app.use('/api/apartments', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/apartments': '/api/apartments'
  }
}));

// Financial Service
app.use('/api/finances', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/finances': '/api/finances'
  }
}));

app.use('/api/payments', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/api/payments'
  }
}));

// Communication Service
app.use('/api/messages', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/messages': '/api/messages'
  }
}));

app.use('/api/notifications', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  }
}));

// Assembly Service
app.use('/api/assemblies', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/assemblies': '/api/assemblies'
  }
}));

// Marketplace Service
app.use('/api/marketplace', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: {
    '^/api/marketplace': '/api/marketplace'
  }
}));

// Professional Service
app.use('/api/professionals', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3007',
  changeOrigin: true,
  pathRewrite: {
    '^/api/professionals': '/api/professionals'
  }
}));

// Security Service
app.use('/api/security', authMiddleware, createProxyMiddleware({
  target: 'http://localhost:3008',
  changeOrigin: true,
  pathRewrite: {
    '^/api/security': '/api/security'
  }
}));

// ==============================================
// WEBSOCKET PROXY (Para chat em tempo real)
// ==============================================

app.use('/ws', createProxyMiddleware({
  target: 'http://localhost:3004',
  ws: true,
  changeOrigin: true,
  pathRewrite: {
    '^/ws': '/ws'
  }
}));

// ==============================================
// MIDDLEWARE DE ERRO
// ==============================================

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Error Handler Global
app.use(errorHandler);

// ==============================================
// INICIALIZAÇÃO DO SERVIDOR
// ==============================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 API Gateway rodando na porta ${PORT}`);
  logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  logger.info(`🔒 Segurança: Ativada`);
  logger.info(`📊 Monitoramento: Ativo`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado com sucesso.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido. Encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado com sucesso.');
    process.exit(0);
  });
});

export default app;