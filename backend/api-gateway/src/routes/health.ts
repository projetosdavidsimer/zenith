/**
 * HEALTH CHECK ENDPOINTS
 * 
 * Implementa:
 * - Verificação de saúde dos serviços
 * - Status de dependências externas
 * - Métricas básicas de sistema
 * - Endpoints para load balancer
 * 
 * @author DevOps Expert - Vizinho Virtual
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { checkRedisHealth, getRedisStats } from '../utils/redis';

const router = Router();

// ==============================================
// INTERFACES
// ==============================================

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
      lastCheck: string;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

// ==============================================
// HEALTH CHECK BÁSICO (Para Load Balancer)
// ==============================================

router.get('/', async (req: Request, res: Response) => {
  try {
    // Health check simples e rápido para load balancer
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway'
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check básico falhou', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// ==============================================
// HEALTH CHECK DETALHADO
// ==============================================

router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Verificar Redis
    const redisHealth = await checkRedisHealth();
    
    // Verificar microsserviços
    const servicesHealth = await checkMicroservicesHealth();
    
    // Obter métricas do sistema
    const systemMetrics = getSystemMetrics();
    
    // Determinar status geral
    const overallStatus = determineOverallStatus([
      redisHealth.status,
      ...Object.values(servicesHealth).map(s => s.status)
    ]);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        redis: {
          status: redisHealth.status,
          latency: redisHealth.latency,
          error: redisHealth.error,
          lastCheck: new Date().toISOString()
        },
        ...servicesHealth
      },
      system: systemMetrics
    };

    const responseTime = Date.now() - startTime;
    
    // Log health check
    logger.info('Health check detalhado executado', {
      status: overallStatus,
      responseTime,
      services: Object.keys(healthStatus.services).length
    });

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthStatus);

  } catch (error) {
    logger.error('Health check detalhado falhou', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==============================================
// READINESS CHECK (Kubernetes)
// ==============================================

router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Verificar se todos os serviços críticos estão prontos
    const redisHealth = await checkRedisHealth();
    
    if (redisHealth.status !== 'healthy') {
      res.status(503).json({
        ready: false,
        reason: 'Redis not available',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar serviços críticos
    const criticalServices = await checkCriticalServices();
    const criticalDown = Object.values(criticalServices).some(s => s.status !== 'healthy');

    if (criticalDown) {
      res.status(503).json({
        ready: false,
        reason: 'Critical services not available',
        services: criticalServices,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
      services: criticalServices
    });

  } catch (error) {
    logger.error('Readiness check falhou', { error });
    res.status(503).json({
      ready: false,
      reason: 'Readiness check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// ==============================================
// LIVENESS CHECK (Kubernetes)
// ==============================================

router.get('/live', async (req: Request, res: Response) => {
  try {
    // Verificação básica se o processo está vivo
    const memoryUsage = process.memoryUsage();
    const maxMemory = 512 * 1024 * 1024; // 512MB limite

    if (memoryUsage.heapUsed > maxMemory) {
      logger.warn('Uso de memória alto detectado', {
        heapUsed: memoryUsage.heapUsed,
        maxMemory,
        percentage: (memoryUsage.heapUsed / maxMemory) * 100
      });
    }

    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      }
    });

  } catch (error) {
    logger.error('Liveness check falhou', { error });
    res.status(503).json({
      alive: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// ==============================================
// STATUS DOS MICROSSERVIÇOS
// ==============================================

router.get('/services', async (req: Request, res: Response) => {
  try {
    const services = await checkMicroservicesHealth();
    
    res.status(200).json({
      timestamp: new Date().toISOString(),
      services
    });

  } catch (error) {
    logger.error('Verificação de serviços falhou', { error });
    res.status(500).json({
      error: 'Failed to check services',
      timestamp: new Date().toISOString()
    });
  }
});

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

const checkMicroservicesHealth = async () => {
  const services = {
    'user-management': 'http://localhost:3001/health',
    'building-management': 'http://localhost:3002/health',
    'financial': 'http://localhost:3003/health',
    'communication': 'http://localhost:3004/health',
    'assembly': 'http://localhost:3005/health',
    'marketplace': 'http://localhost:3006/health',
    'professional': 'http://localhost:3007/health',
    'security': 'http://localhost:3008/health'
  };

  const results: any = {};

  for (const [serviceName, url] of Object.entries(services)) {
    try {
      const startTime = Date.now();
      
      // Simular verificação de saúde (em produção, fazer HTTP request real)
      const isHealthy = await simulateServiceCheck(serviceName);
      const latency = Date.now() - startTime;

      results[serviceName] = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        latency,
        lastCheck: new Date().toISOString(),
        url
      };

    } catch (error) {
      results[serviceName] = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
        url
      };
    }
  }

  return results;
};

const checkCriticalServices = async () => {
  // Apenas serviços críticos para funcionamento básico
  const criticalServices = [
    'user-management',
    'building-management',
    'financial'
  ];

  const allServices = await checkMicroservicesHealth();
  const critical: any = {};

  for (const service of criticalServices) {
    if (allServices[service]) {
      critical[service] = allServices[service];
    }
  }

  return critical;
};

const simulateServiceCheck = async (serviceName: string): Promise<boolean> => {
  // Em desenvolvimento, simular que serviços estão saudáveis
  // Em produção, fazer HTTP request real para cada serviço
  
  if (process.env.NODE_ENV === 'development') {
    // Simular latência
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    return Math.random() > 0.1; // 90% de chance de estar saudável
  }

  // Em produção, implementar verificação real
  try {
    const response = await fetch(`http://localhost:${getServicePort(serviceName)}/health`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch {
    return false;
  }
};

const getServicePort = (serviceName: string): number => {
  const ports: { [key: string]: number } = {
    'user-management': 3001,
    'building-management': 3002,
    'financial': 3003,
    'communication': 3004,
    'assembly': 3005,
    'marketplace': 3006,
    'professional': 3007,
    'security': 3008
  };
  
  return ports[serviceName] || 3000;
};

const getSystemMetrics = () => {
  const memoryUsage = process.memoryUsage();
  
  return {
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    },
    cpu: {
      usage: process.cpuUsage().user / 1000000 // Converter para segundos
    },
    disk: {
      used: 0, // Implementar se necessário
      total: 0,
      percentage: 0
    }
  };
};

const determineOverallStatus = (statuses: string[]): 'healthy' | 'degraded' | 'unhealthy' => {
  const unhealthyCount = statuses.filter(s => s === 'unhealthy').length;
  const totalCount = statuses.length;
  
  if (unhealthyCount === 0) {
    return 'healthy';
  } else if (unhealthyCount < totalCount / 2) {
    return 'degraded';
  } else {
    return 'unhealthy';
  }
};

export { router as healthCheck };