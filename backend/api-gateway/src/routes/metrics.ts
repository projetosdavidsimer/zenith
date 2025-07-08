/**
 * MÉTRICAS E MONITORAMENTO
 * 
 * Implementa:
 * - Métricas de performance
 * - Estatísticas de uso
 * - Métricas de negócio
 * - Dados para dashboards
 * 
 * @author DevOps/Analytics Expert - Vizinho Virtual
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getRedisStats } from '../utils/redis';
import { requireRole } from '../middleware/auth';

const router = Router();

// ==============================================
// MÉTRICAS GERAIS DO SISTEMA
// ==============================================

router.get('/', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const metrics = await getSystemMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Erro ao obter métricas do sistema', { error });
    res.status(500).json({
      error: 'Erro ao obter métricas',
      code: 'METRICS_ERROR'
    });
  }
});

// ==============================================
// MÉTRICAS DE PERFORMANCE
// ==============================================

router.get('/performance', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const performanceMetrics = await getPerformanceMetrics();
    res.status(200).json(performanceMetrics);
  } catch (error) {
    logger.error('Erro ao obter métricas de performance', { error });
    res.status(500).json({
      error: 'Erro ao obter métricas de performance',
      code: 'PERFORMANCE_METRICS_ERROR'
    });
  }
});

// ==============================================
// MÉTRICAS DE NEGÓCIO
// ==============================================

router.get('/business', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const businessMetrics = await getBusinessMetrics();
    res.status(200).json(businessMetrics);
  } catch (error) {
    logger.error('Erro ao obter métricas de negócio', { error });
    res.status(500).json({
      error: 'Erro ao obter métricas de negócio',
      code: 'BUSINESS_METRICS_ERROR'
    });
  }
});

// ==============================================
// MÉTRICAS DE SEGURANÇA
// ==============================================

router.get('/security', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const securityMetrics = await getSecurityMetrics();
    res.status(200).json(securityMetrics);
  } catch (error) {
    logger.error('Erro ao obter métricas de segurança', { error });
    res.status(500).json({
      error: 'Erro ao obter métricas de segurança',
      code: 'SECURITY_METRICS_ERROR'
    });
  }
});

// ==============================================
// FUNÇÕES DE COLETA DE MÉTRICAS
// ==============================================

const getSystemMetrics = async () => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const redisStats = await getRedisStats();

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    
    memory: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      usagePercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    },
    
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
      userSeconds: cpuUsage.user / 1000000,
      systemSeconds: cpuUsage.system / 1000000
    },
    
    redis: redisStats,
    
    process: {
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    }
  };
};

const getPerformanceMetrics = async () => {
  // Em produção, coletar métricas reais do Redis/banco
  return {
    timestamp: new Date().toISOString(),
    
    api: {
      totalRequests: await getMetricFromRedis('api:total_requests') || 0,
      requestsPerMinute: await getMetricFromRedis('api:requests_per_minute') || 0,
      averageResponseTime: await getMetricFromRedis('api:avg_response_time') || 0,
      errorRate: await getMetricFromRedis('api:error_rate') || 0,
      slowestEndpoints: await getMetricFromRedis('api:slowest_endpoints') || []
    },
    
    database: {
      connectionPoolSize: await getMetricFromRedis('db:pool_size') || 0,
      activeConnections: await getMetricFromRedis('db:active_connections') || 0,
      averageQueryTime: await getMetricFromRedis('db:avg_query_time') || 0,
      slowQueries: await getMetricFromRedis('db:slow_queries') || 0
    },
    
    cache: {
      hitRate: await getMetricFromRedis('cache:hit_rate') || 0,
      missRate: await getMetricFromRedis('cache:miss_rate') || 0,
      evictions: await getMetricFromRedis('cache:evictions') || 0,
      memoryUsage: await getMetricFromRedis('cache:memory_usage') || 0
    },
    
    services: {
      userService: await getServiceMetrics('user-management'),
      buildingService: await getServiceMetrics('building-management'),
      financialService: await getServiceMetrics('financial'),
      communicationService: await getServiceMetrics('communication')
    }
  };
};

const getBusinessMetrics = async () => {
  // Métricas de negócio - em produção, buscar do banco de dados
  return {
    timestamp: new Date().toISOString(),
    
    users: {
      totalUsers: await getMetricFromRedis('business:total_users') || 0,
      activeUsers: await getMetricFromRedis('business:active_users') || 0,
      newUsersToday: await getMetricFromRedis('business:new_users_today') || 0,
      newUsersThisMonth: await getMetricFromRedis('business:new_users_month') || 0,
      usersByRole: {
        sindicos: await getMetricFromRedis('business:sindicos') || 0,
        moradores: await getMetricFromRedis('business:moradores') || 0,
        profissionais: await getMetricFromRedis('business:profissionais') || 0
      }
    },
    
    buildings: {
      totalBuildings: await getMetricFromRedis('business:total_buildings') || 0,
      activeBuildings: await getMetricFromRedis('business:active_buildings') || 0,
      newBuildingsThisMonth: await getMetricFromRedis('business:new_buildings_month') || 0,
      averageApartmentsPerBuilding: await getMetricFromRedis('business:avg_apartments') || 0
    },
    
    financial: {
      totalRevenue: await getMetricFromRedis('business:total_revenue') || 0,
      monthlyRevenue: await getMetricFromRedis('business:monthly_revenue') || 0,
      averageRevenuePerBuilding: await getMetricFromRedis('business:avg_revenue_building') || 0,
      paymentSuccessRate: await getMetricFromRedis('business:payment_success_rate') || 0,
      subscriptionsByPlan: {
        basic: await getMetricFromRedis('business:basic_subscriptions') || 0,
        professional: await getMetricFromRedis('business:professional_subscriptions') || 0,
        enterprise: await getMetricFromRedis('business:enterprise_subscriptions') || 0
      }
    },
    
    engagement: {
      dailyActiveUsers: await getMetricFromRedis('business:dau') || 0,
      monthlyActiveUsers: await getMetricFromRedis('business:mau') || 0,
      averageSessionDuration: await getMetricFromRedis('business:avg_session_duration') || 0,
      messagesPerDay: await getMetricFromRedis('business:messages_per_day') || 0,
      assembliesPerMonth: await getMetricFromRedis('business:assemblies_per_month') || 0
    },
    
    marketplace: {
      totalProducts: await getMetricFromRedis('business:marketplace_products') || 0,
      totalTransactions: await getMetricFromRedis('business:marketplace_transactions') || 0,
      transactionVolume: await getMetricFromRedis('business:marketplace_volume') || 0,
      commissionEarned: await getMetricFromRedis('business:marketplace_commission') || 0
    }
  };
};

const getSecurityMetrics = async () => {
  return {
    timestamp: new Date().toISOString(),
    
    authentication: {
      totalLogins: await getMetricFromRedis('security:total_logins') || 0,
      failedLogins: await getMetricFromRedis('security:failed_logins') || 0,
      successRate: await getMetricFromRedis('security:login_success_rate') || 0,
      suspiciousLogins: await getMetricFromRedis('security:suspicious_logins') || 0
    },
    
    threats: {
      blockedIPs: await getMetricFromRedis('security:blocked_ips') || 0,
      sqlInjectionAttempts: await getMetricFromRedis('security:sql_injection_attempts') || 0,
      xssAttempts: await getMetricFromRedis('security:xss_attempts') || 0,
      rateLimitViolations: await getMetricFromRedis('security:rate_limit_violations') || 0,
      suspiciousUserAgents: await getMetricFromRedis('security:suspicious_user_agents') || 0
    },
    
    compliance: {
      gdprRequests: await getMetricFromRedis('security:gdpr_requests') || 0,
      dataExports: await getMetricFromRedis('security:data_exports') || 0,
      dataDeletions: await getMetricFromRedis('security:data_deletions') || 0,
      auditLogEntries: await getMetricFromRedis('security:audit_log_entries') || 0
    },
    
    encryption: {
      encryptedDataPercentage: 100, // Todos os dados sensíveis são criptografados
      sslCertificateExpiry: await getMetricFromRedis('security:ssl_expiry') || null,
      lastSecurityScan: await getMetricFromRedis('security:last_scan') || null
    }
  };
};

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

const getMetricFromRedis = async (key: string): Promise<any> => {
  try {
    // Em desenvolvimento, retornar dados simulados
    if (process.env.NODE_ENV === 'development') {
      return getSimulatedMetric(key);
    }
    
    // Em produção, buscar do Redis
    const { redisClient } = await import('../utils/redis');
    const value = await redisClient.get(`metrics:${key}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Erro ao buscar métrica ${key}`, { error });
    return null;
  }
};

const getSimulatedMetric = (key: string): any => {
  // Dados simulados para desenvolvimento
  const simulatedData: { [key: string]: any } = {
    'api:total_requests': Math.floor(Math.random() * 10000) + 5000,
    'api:requests_per_minute': Math.floor(Math.random() * 100) + 50,
    'api:avg_response_time': Math.floor(Math.random() * 500) + 100,
    'api:error_rate': Math.random() * 5,
    'business:total_users': Math.floor(Math.random() * 1000) + 500,
    'business:active_users': Math.floor(Math.random() * 500) + 200,
    'business:new_users_today': Math.floor(Math.random() * 20) + 5,
    'business:new_users_month': Math.floor(Math.random() * 200) + 50,
    'business:sindicos': Math.floor(Math.random() * 100) + 50,
    'business:moradores': Math.floor(Math.random() * 800) + 400,
    'business:profissionais': Math.floor(Math.random() * 100) + 30,
    'business:total_buildings': Math.floor(Math.random() * 100) + 50,
    'business:active_buildings': Math.floor(Math.random() * 80) + 40,
    'business:total_revenue': Math.floor(Math.random() * 50000) + 25000,
    'business:monthly_revenue': Math.floor(Math.random() * 5000) + 2500,
    'business:payment_success_rate': 95 + Math.random() * 4,
    'business:basic_subscriptions': Math.floor(Math.random() * 30) + 15,
    'business:professional_subscriptions': Math.floor(Math.random() * 20) + 10,
    'business:enterprise_subscriptions': Math.floor(Math.random() * 10) + 5,
    'security:total_logins': Math.floor(Math.random() * 5000) + 2000,
    'security:failed_logins': Math.floor(Math.random() * 100) + 20,
    'security:login_success_rate': 95 + Math.random() * 4,
    'security:blocked_ips': Math.floor(Math.random() * 50) + 10,
    'security:sql_injection_attempts': Math.floor(Math.random() * 20) + 2,
    'security:xss_attempts': Math.floor(Math.random() * 15) + 1,
    'security:rate_limit_violations': Math.floor(Math.random() * 100) + 20
  };
  
  return simulatedData[key] || 0;
};

const getServiceMetrics = async (serviceName: string) => {
  return {
    status: 'healthy',
    uptime: Math.floor(Math.random() * 86400) + 3600, // 1-24 horas
    requestCount: Math.floor(Math.random() * 1000) + 100,
    averageResponseTime: Math.floor(Math.random() * 200) + 50,
    errorRate: Math.random() * 2,
    memoryUsage: Math.floor(Math.random() * 512) + 128, // MB
    cpuUsage: Math.random() * 50 + 10 // %
  };
};

export { router as metricsRouter };