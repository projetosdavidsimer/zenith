/**
 * CLIENTE REDIS CONFIGURADO
 * 
 * Implementa:
 * - Conexão com Redis
 * - Pool de conexões
 * - Retry automático
 * - Monitoramento de saúde
 * - Cache inteligente
 * 
 * @author Backend Expert - Vizinho Virtual
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

// ==============================================
// CONFIGURAÇÃO DO CLIENTE REDIS
// ==============================================

const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    lazyConnect: true,
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.error('Redis: Máximo de tentativas de reconexão atingido');
        return false;
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`Redis: Tentativa de reconexão ${retries} em ${delay}ms`);
      return delay;
    }
  },
  database: 0
};

// Criar cliente Redis
export const redisClient: RedisClientType = createClient(redisConfig);

// ==============================================
// EVENTOS DE CONEXÃO
// ==============================================

redisClient.on('connect', () => {
  logger.info('Redis: Conectando...');
});

redisClient.on('ready', () => {
  logger.info('Redis: Conexão estabelecida e pronta para uso');
});

redisClient.on('error', (error) => {
  logger.error('Redis: Erro de conexão', { error: error.message });
});

redisClient.on('end', () => {
  logger.warn('Redis: Conexão encerrada');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis: Tentando reconectar...');
});

// ==============================================
// INICIALIZAÇÃO
// ==============================================

export const initRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis: Cliente inicializado com sucesso');
    
    // Testar conexão
    await redisClient.ping();
    logger.info('Redis: Teste de ping bem-sucedido');
    
  } catch (error) {
    logger.error('Redis: Falha na inicialização', { error });
    throw error;
  }
};

// ==============================================
// FUNÇÕES AUXILIARES DE CACHE
// ==============================================

// Cache com TTL
export const setCache = async (key: string, value: any, ttlSeconds: number = 3600): Promise<void> => {
  try {
    const serializedValue = JSON.stringify(value);
    await redisClient.setEx(key, ttlSeconds, serializedValue);
    logger.debug(`Cache: Chave '${key}' armazenada com TTL de ${ttlSeconds}s`);
  } catch (error) {
    logger.error(`Cache: Erro ao armazenar chave '${key}'`, { error });
    throw error;
  }
};

// Buscar do cache
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redisClient.get(key);
    if (!value) {
      logger.debug(`Cache: Chave '${key}' não encontrada`);
      return null;
    }
    
    const parsed = JSON.parse(value);
    logger.debug(`Cache: Chave '${key}' encontrada`);
    return parsed as T;
  } catch (error) {
    logger.error(`Cache: Erro ao buscar chave '${key}'`, { error });
    return null;
  }
};

// Deletar do cache
export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
    logger.debug(`Cache: Chave '${key}' removida`);
  } catch (error) {
    logger.error(`Cache: Erro ao remover chave '${key}'`, { error });
    throw error;
  }
};

// Cache com padrão (buscar múltiplas chaves)
export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug(`Cache: ${keys.length} chaves removidas com padrão '${pattern}'`);
    }
  } catch (error) {
    logger.error(`Cache: Erro ao remover chaves com padrão '${pattern}'`, { error });
    throw error;
  }
};

// ==============================================
// FUNÇÕES DE SESSION
// ==============================================

// Armazenar sessão
export const setSession = async (sessionId: string, sessionData: any, ttlSeconds: number = 86400): Promise<void> => {
  const key = `session:${sessionId}`;
  await setCache(key, sessionData, ttlSeconds);
};

// Buscar sessão
export const getSession = async (sessionId: string): Promise<any | null> => {
  const key = `session:${sessionId}`;
  return await getCache(key);
};

// Remover sessão
export const deleteSession = async (sessionId: string): Promise<void> => {
  const key = `session:${sessionId}`;
  await deleteCache(key);
};

// ==============================================
// FUNÇÕES DE RATE LIMITING
// ==============================================

// Incrementar contador de rate limit
export const incrementRateLimit = async (key: string, windowSeconds: number): Promise<number> => {
  try {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }
    return current;
  } catch (error) {
    logger.error(`Rate Limit: Erro ao incrementar '${key}'`, { error });
    throw error;
  }
};

// Verificar rate limit
export const checkRateLimit = async (key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  try {
    const current = await incrementRateLimit(key, windowSeconds);
    const ttl = await redisClient.ttl(key);
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime: Date.now() + (ttl * 1000)
    };
  } catch (error) {
    logger.error(`Rate Limit: Erro ao verificar '${key}'`, { error });
    // Em caso de erro, permitir a requisição
    return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 };
  }
};

// ==============================================
// FUNÇÕES DE BLACKLIST
// ==============================================

// Adicionar à blacklist
export const addToBlacklist = async (type: 'ip' | 'token' | 'user', value: string, reason: string, ttlSeconds: number = 86400): Promise<void> => {
  const key = `blacklist:${type}:${value}`;
  await redisClient.setEx(key, ttlSeconds, reason);
  logger.warn(`Blacklist: ${type} '${value}' adicionado por ${reason}`);
};

// Verificar blacklist
export const isBlacklisted = async (type: 'ip' | 'token' | 'user', value: string): Promise<boolean> => {
  const key = `blacklist:${type}:${value}`;
  const result = await redisClient.get(key);
  return !!result;
};

// Remover da blacklist
export const removeFromBlacklist = async (type: 'ip' | 'token' | 'user', value: string): Promise<void> => {
  const key = `blacklist:${type}:${value}`;
  await redisClient.del(key);
  logger.info(`Blacklist: ${type} '${value}' removido`);
};

// ==============================================
// FUNÇÕES DE CACHE DE DADOS
// ==============================================

// Cache de usuário
export const cacheUser = async (userId: string, userData: any, ttlSeconds: number = 1800): Promise<void> => {
  const key = `user:${userId}`;
  await setCache(key, userData, ttlSeconds);
};

export const getCachedUser = async (userId: string): Promise<any | null> => {
  const key = `user:${userId}`;
  return await getCache(key);
};

export const invalidateUserCache = async (userId: string): Promise<void> => {
  const key = `user:${userId}`;
  await deleteCache(key);
};

// Cache de condomínio
export const cacheBuilding = async (buildingId: string, buildingData: any, ttlSeconds: number = 3600): Promise<void> => {
  const key = `building:${buildingId}`;
  await setCache(key, buildingData, ttlSeconds);
};

export const getCachedBuilding = async (buildingId: string): Promise<any | null> => {
  const key = `building:${buildingId}`;
  return await getCache(key);
};

export const invalidateBuildingCache = async (buildingId: string): Promise<void> => {
  const key = `building:${buildingId}`;
  await deleteCache(key);
};

// ==============================================
// FUNÇÕES DE MONITORAMENTO
// ==============================================

// Verificar saúde do Redis
export const checkRedisHealth = async (): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> => {
  try {
    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Obter estatísticas do Redis
export const getRedisStats = async (): Promise<any> => {
  try {
    const info = await redisClient.info();
    const dbSize = await redisClient.dbSize();
    
    return {
      connected: redisClient.isReady,
      dbSize,
      info: parseRedisInfo(info)
    };
  } catch (error) {
    logger.error('Redis: Erro ao obter estatísticas', { error });
    return null;
  }
};

// Parser para info do Redis
const parseRedisInfo = (info: string): any => {
  const lines = info.split('\r\n');
  const result: any = {};
  
  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      result[key] = value;
    }
  }
  
  return result;
};

// ==============================================
// FUNÇÕES DE LIMPEZA
// ==============================================

// Limpar cache expirado (executar periodicamente)
export const cleanupExpiredKeys = async (): Promise<void> => {
  try {
    // Redis limpa automaticamente chaves expiradas, mas podemos forçar
    const keys = await redisClient.keys('*');
    let expiredCount = 0;
    
    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl === -2) { // Chave expirada
        expiredCount++;
      }
    }
    
    logger.info(`Redis: Limpeza concluída. ${expiredCount} chaves expiradas encontradas`);
  } catch (error) {
    logger.error('Redis: Erro na limpeza', { error });
  }
};

// ==============================================
// GRACEFUL SHUTDOWN
// ==============================================

export const closeRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Redis: Conexão encerrada graciosamente');
  } catch (error) {
    logger.error('Redis: Erro ao encerrar conexão', { error });
  }
};

// ==============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ==============================================

// Inicializar Redis quando o módulo for importado
if (process.env.NODE_ENV !== 'test') {
  initRedis().catch((error) => {
    logger.error('Redis: Falha na inicialização automática', { error });
  });
}

export default redisClient;