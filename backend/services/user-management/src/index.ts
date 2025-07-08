/**
 * VIZINHO VIRTUAL - USER MANAGEMENT SERVICE
 * 
 * Microsserviço responsável por:
 * - Autenticação e autorização
 * - Gestão de usuários (CRUD)
 * - Perfis e permissões
 * - Recuperação de senha
 * - 2FA (Two-Factor Authentication)
 * - Auditoria de acesso
 * 
 * @author Backend Expert - Vizinho Virtual
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { initDatabase } from './database/connection';
import { initRedis } from './utils/redis';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Rotas
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { profileRoutes } from './routes/profile';
import { adminRoutes } from './routes/admin';
import { healthRoutes } from './routes/health';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ==============================================
// MIDDLEWARE DE SEGURANÇA
// ==============================================

// Headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://app.vizinhovirtual.com']
    : ['http://localhost:3000', 'http://localhost:3100'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compressão
app.use(compression());

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==============================================
// RATE LIMITING
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

// Rate limiting para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
});

app.use(generalLimiter);

// ==============================================
// LOGGING
// ==============================================

// Logging HTTP
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Request logger customizado
app.use(requestLogger);

// ==============================================
// ROTAS
// ==============================================

// Health check
app.use('/health', healthRoutes);

// Autenticação (com rate limiting específico)
app.use('/api/auth', authLimiter, authRoutes);

// Usuários
app.use('/api/users', userRoutes);

// Perfil
app.use('/api/profile', profileRoutes);

// Administração
app.use('/api/admin', adminRoutes);

// ==============================================
// MIDDLEWARE DE ERRO
// ==============================================

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    service: 'user-management'
  });
});

// Error Handler Global
app.use(errorHandler);

// ==============================================
// INICIALIZAÇÃO DO SERVIDOR
// ==============================================

const startServer = async () => {
  try {
    // Inicializar banco de dados
    await initDatabase();
    logger.info('✅ Banco de dados conectado');

    // Inicializar Redis
    await initRedis();
    logger.info('✅ Redis conectado');

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      logger.info(`🚀 User Management Service rodando na porta ${PORT}`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      logger.info(`🔒 Segurança: Ativada`);
      logger.info(`📊 Logging: Ativo`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} recebido. Encerrando servidor...`);
      server.close(async () => {
        try {
          // Fechar conexões
          await closeConnections();
          logger.info('✅ Servidor encerrado com sucesso');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Erro ao encerrar servidor:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Função para fechar conexões
const closeConnections = async () => {
  // Implementar fechamento de conexões DB e Redis
  logger.info('Fechando conexões...');
};

// Iniciar servidor
startServer();

export default app;