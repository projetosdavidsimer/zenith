/**
 * MIDDLEWARE DE AUDITORIA E COMPLIANCE
 * 
 * Implementa:
 * - Logs de auditoria para GDPR/LGPD
 * - Rastreamento de acesso a dados pessoais
 * - Logs de transações financeiras
 * - Compliance com regulamentações
 * - Retenção de dados conforme lei
 * 
 * @author Legal/Compliance Expert - Vizinho Virtual
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';

// Interfaces para auditoria
interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent: string;
  action: string;
  resource: string;
  method: string;
  endpoint: string;
  statusCode?: number;
  dataAccessed?: string[];
  personalDataAccessed?: boolean;
  financialDataAccessed?: boolean;
  gdprRelevant: boolean;
  legalBasis?: string;
  duration?: number;
  errorMessage?: string;
}

// ==============================================
// DADOS PESSOAIS SENSÍVEIS (GDPR/LGPD)
// ==============================================

const PERSONAL_DATA_FIELDS = [
  'email',
  'phone',
  'cpf',
  'nif',
  'address',
  'name',
  'birthDate',
  'document',
  'bankAccount',
  'creditCard'
];

const FINANCIAL_DATA_ENDPOINTS = [
  '/api/payments',
  '/api/finances',
  '/api/invoices',
  '/api/transactions'
];

const GDPR_RELEVANT_ENDPOINTS = [
  '/api/users',
  '/api/residents',
  '/api/professionals',
  '/api/payments',
  '/api/communications',
  '/api/assemblies/votes'
];

// ==============================================
// MIDDLEWARE DE AUDITORIA
// ==============================================

export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const auditId = uuidv4();
  
  // Adicionar ID de auditoria à request
  (req as any).auditId = auditId;

  // Capturar dados da request
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const sessionId = req.get('X-Session-ID') || 'unknown';

  // Verificar se é endpoint relevante para GDPR
  const isGDPRRelevant = GDPR_RELEVANT_ENDPOINTS.some(endpoint => 
    req.path.startsWith(endpoint)
  );

  // Verificar se acessa dados financeiros
  const isFinancialData = FINANCIAL_DATA_ENDPOINTS.some(endpoint => 
    req.path.startsWith(endpoint)
  );

  // Verificar se acessa dados pessoais
  const requestData = JSON.stringify({ ...req.body, ...req.query, ...req.params });
  const accessesPersonalData = PERSONAL_DATA_FIELDS.some(field => 
    requestData.toLowerCase().includes(field.toLowerCase())
  );

  // Interceptar response para capturar dados de saída
  const originalSend = res.send;
  let responseData = '';

  res.send = function(data: any) {
    responseData = typeof data === 'string' ? data : JSON.stringify(data);
    return originalSend.call(this, data);
  };

  // Quando a response terminar, criar log de auditoria
  res.on('finish', async () => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verificar se response contém dados pessoais
    const responseContainsPersonalData = PERSONAL_DATA_FIELDS.some(field => 
      responseData.toLowerCase().includes(field.toLowerCase())
    );

    const auditLog: AuditLog = {
      id: auditId,
      timestamp: new Date(),
      userId: (req as any).user?.userId,
      sessionId,
      ip: clientIP,
      userAgent,
      action: getActionFromEndpoint(req.path, req.method),
      resource: getResourceFromEndpoint(req.path),
      method: req.method,
      endpoint: req.path,
      statusCode: res.statusCode,
      dataAccessed: extractDataAccessed(req.path, req.method),
      personalDataAccessed: accessesPersonalData || responseContainsPersonalData,
      financialDataAccessed: isFinancialData,
      gdprRelevant: isGDPRRelevant,
      legalBasis: getLegalBasis(req.path, (req as any).user?.role),
      duration,
      errorMessage: res.statusCode >= 400 ? getErrorFromResponse(responseData) : undefined
    };

    // Salvar log de auditoria
    await saveAuditLog(auditLog);

    // Log específico para dados pessoais (GDPR)
    if (auditLog.personalDataAccessed && auditLog.gdprRelevant) {
      await logGDPRAccess(auditLog);
    }

    // Log específico para dados financeiros
    if (auditLog.financialDataAccessed) {
      await logFinancialAccess(auditLog);
    }

    // Log para ações administrativas
    if (isAdministrativeAction(req.path, req.method)) {
      await logAdministrativeAction(auditLog);
    }
  });

  next();
};

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

const getActionFromEndpoint = (path: string, method: string): string => {
  const actions: { [key: string]: string } = {
    'GET': 'READ',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  };

  const specificActions: { [key: string]: string } = {
    '/api/auth/login': 'login',
    '/api/auth/logout': 'logout',
    '/api/auth/register': 'register',
    '/api/payments': 'payment',
    '/api/assemblies/vote': 'vote',
    '/api/communications/send': 'send_message'
  };

  return specificActions[path] || actions[method] || 'unknown';
};

const getResourceFromEndpoint = (path: string): string => {
  if (path.startsWith('/api/users')) return 'user';
  if (path.startsWith('/api/buildings')) return 'building';
  if (path.startsWith('/api/apartments')) return 'apartment';
  if (path.startsWith('/api/payments')) return 'payment';
  if (path.startsWith('/api/finances')) return 'finance';
  if (path.startsWith('/api/assemblies')) return 'assembly';
  if (path.startsWith('/api/communications')) return 'communication';
  if (path.startsWith('/api/marketplace')) return 'marketplace';
  if (path.startsWith('/api/professionals')) return 'professional';
  if (path.startsWith('/api/security')) return 'security';
  
  return 'unknown';
};

const extractDataAccessed = (path: string, method: string): string[] => {
  const dataTypes: string[] = [];
  
  if (path.includes('users') || path.includes('residents')) {
    dataTypes.push('personal_data');
  }
  
  if (path.includes('payments') || path.includes('finances')) {
    dataTypes.push('financial_data');
  }
  
  if (path.includes('communications') || path.includes('messages')) {
    dataTypes.push('communication_data');
  }
  
  if (path.includes('assemblies') && path.includes('vote')) {
    dataTypes.push('voting_data');
  }
  
  return dataTypes;
};

const getLegalBasis = (path: string, userRole?: string): string => {
  // Base legal conforme GDPR
  if (path.startsWith('/api/auth')) {
    return 'contract'; // Execução de contrato
  }
  
  if (path.startsWith('/api/payments') || path.startsWith('/api/finances')) {
    return 'contract'; // Execução de contrato
  }
  
  if (path.startsWith('/api/communications')) {
    return 'legitimate_interest'; // Interesse legítimo
  }
  
  if (path.startsWith('/api/assemblies')) {
    return 'legal_obligation'; // Obrigação legal
  }
  
  if (userRole === 'ADMIN') {
    return 'legitimate_interest'; // Interesse legítimo para administração
  }
  
  return 'consent'; // Consentimento (padrão)
};

const getErrorFromResponse = (responseData: string): string | undefined => {
  try {
    const parsed = JSON.parse(responseData);
    return parsed.error || parsed.message;
  } catch {
    return undefined;
  }
};

const isAdministrativeAction = (path: string, method: string): boolean => {
  const adminPaths = [
    '/api/admin',
    '/api/users/admin',
    '/api/buildings/admin',
    '/api/system'
  ];
  
  return adminPaths.some(adminPath => path.startsWith(adminPath)) ||
         (method === 'DELETE' && !path.includes('logout'));
};

// ==============================================
// FUNÇÕES DE SALVAMENTO DE LOGS
// ==============================================

const saveAuditLog = async (auditLog: AuditLog): Promise<void> => {
  try {
    // Salvar no Redis para acesso rápido (últimos 30 dias)
    const redisKey = `audit:${auditLog.timestamp.toISOString().split('T')[0]}`;
    await redisClient.lpush(redisKey, JSON.stringify(auditLog));
    await redisClient.expire(redisKey, 30 * 24 * 60 * 60); // 30 dias

    // Log estruturado para sistema de logging
    logger.info('Audit Log', {
      auditId: auditLog.id,
      userId: auditLog.userId,
      action: auditLog.action,
      resource: auditLog.resource,
      endpoint: auditLog.endpoint,
      method: auditLog.method,
      statusCode: auditLog.statusCode,
      ip: auditLog.ip,
      duration: auditLog.duration,
      personalDataAccessed: auditLog.personalDataAccessed,
      financialDataAccessed: auditLog.financialDataAccessed,
      gdprRelevant: auditLog.gdprRelevant,
      legalBasis: auditLog.legalBasis
    });

  } catch (error) {
    logger.error('Erro ao salvar log de auditoria:', error);
  }
};

const logGDPRAccess = async (auditLog: AuditLog): Promise<void> => {
  try {
    // Log específico para GDPR
    const gdprLog = {
      auditId: auditLog.id,
      timestamp: auditLog.timestamp,
      userId: auditLog.userId,
      dataSubject: auditLog.userId, // Titular dos dados
      action: auditLog.action,
      legalBasis: auditLog.legalBasis,
      dataCategories: auditLog.dataAccessed,
      purpose: getPurposeFromAction(auditLog.action),
      retention: getRetentionPeriod(auditLog.resource),
      ip: auditLog.ip
    };

    // Salvar log GDPR separadamente
    const gdprKey = `gdpr:${auditLog.timestamp.toISOString().split('T')[0]}`;
    await redisClient.lpush(gdprKey, JSON.stringify(gdprLog));
    await redisClient.expire(gdprKey, 7 * 365 * 24 * 60 * 60); // 7 anos (conforme lei)

    logger.info('GDPR Access Log', gdprLog);

  } catch (error) {
    logger.error('Erro ao salvar log GDPR:', error);
  }
};

const logFinancialAccess = async (auditLog: AuditLog): Promise<void> => {
  try {
    // Log específico para dados financeiros
    const financialLog = {
      auditId: auditLog.id,
      timestamp: auditLog.timestamp,
      userId: auditLog.userId,
      action: auditLog.action,
      amount: extractAmountFromEndpoint(auditLog.endpoint),
      transactionType: getTransactionType(auditLog.endpoint),
      ip: auditLog.ip,
      statusCode: auditLog.statusCode
    };

    // Salvar log financeiro separadamente
    const finKey = `financial:${auditLog.timestamp.toISOString().split('T')[0]}`;
    await redisClient.lpush(finKey, JSON.stringify(financialLog));
    await redisClient.expire(finKey, 10 * 365 * 24 * 60 * 60); // 10 anos (conforme lei)

    logger.info('Financial Access Log', financialLog);

  } catch (error) {
    logger.error('Erro ao salvar log financeiro:', error);
  }
};

const logAdministrativeAction = async (auditLog: AuditLog): Promise<void> => {
  try {
    // Log específico para ações administrativas
    const adminLog = {
      auditId: auditLog.id,
      timestamp: auditLog.timestamp,
      adminUserId: auditLog.userId,
      action: auditLog.action,
      resource: auditLog.resource,
      targetUserId: extractTargetUserId(auditLog.endpoint),
      ip: auditLog.ip,
      statusCode: auditLog.statusCode,
      severity: getActionSeverity(auditLog.action)
    };

    // Salvar log administrativo separadamente
    const adminKey = `admin:${auditLog.timestamp.toISOString().split('T')[0]}`;
    await redisClient.lpush(adminKey, JSON.stringify(adminLog));
    await redisClient.expire(adminKey, 10 * 365 * 24 * 60 * 60); // 10 anos

    logger.warn('Administrative Action Log', adminLog);

  } catch (error) {
    logger.error('Erro ao salvar log administrativo:', error);
  }
};

// ==============================================
// FUNÇÕES AUXILIARES ESPECÍFICAS
// ==============================================

const getPurposeFromAction = (action: string): string => {
  const purposes: { [key: string]: string } = {
    'login': 'authentication',
    'register': 'account_creation',
    'payment': 'financial_transaction',
    'vote': 'democratic_participation',
    'send_message': 'communication',
    'read': 'service_provision',
    'update': 'data_maintenance',
    'delete': 'data_removal'
  };
  
  return purposes[action] || 'service_provision';
};

const getRetentionPeriod = (resource: string): string => {
  const retentions: { [key: string]: string } = {
    'user': '7_years', // GDPR + lei portuguesa
    'payment': '10_years', // Lei fiscal
    'communication': '2_years', // Comunicações
    'assembly': '10_years', // Documentos legais
    'security': '5_years' // Logs de segurança
  };
  
  return retentions[resource] || '7_years';
};

const extractAmountFromEndpoint = (endpoint: string): number | undefined => {
  // Extrair valor de transação do endpoint se possível
  const match = endpoint.match(/amount=(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : undefined;
};

const getTransactionType = (endpoint: string): string => {
  if (endpoint.includes('payment')) return 'payment';
  if (endpoint.includes('refund')) return 'refund';
  if (endpoint.includes('invoice')) return 'invoice';
  return 'unknown';
};

const extractTargetUserId = (endpoint: string): string | undefined => {
  // Extrair ID do usuário alvo do endpoint
  const match = endpoint.match(/\/users\/([a-f0-9-]+)/);
  return match ? match[1] : undefined;
};

const getActionSeverity = (action: string): 'low' | 'medium' | 'high' | 'critical' => {
  const severities: { [key: string]: 'low' | 'medium' | 'high' | 'critical' } = {
    'read': 'low',
    'create': 'medium',
    'update': 'medium',
    'delete': 'high',
    'login': 'low',
    'register': 'medium',
    'payment': 'high'
  };
  
  return severities[action] || 'medium';
};

// ==============================================
// UTILITÁRIOS PARA CONSULTA DE LOGS
// ==============================================

export const getAuditLogs = async (date: string, limit: number = 100): Promise<AuditLog[]> => {
  try {
    const redisKey = `audit:${date}`;
    const logs = await redisClient.lrange(redisKey, 0, limit - 1);
    return logs.map(log => JSON.parse(log));
  } catch (error) {
    logger.error('Erro ao buscar logs de auditoria:', error);
    return [];
  }
};

export const getGDPRLogs = async (userId: string, limit: number = 50): Promise<any[]> => {
  try {
    // Buscar logs GDPR para um usuário específico
    const today = new Date().toISOString().split('T')[0];
    const keys = [];
    
    // Buscar últimos 30 dias
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      keys.push(`gdpr:${date.toISOString().split('T')[0]}`);
    }
    
    const allLogs: any[] = [];
    for (const key of keys) {
      const logs = await redisClient.lrange(key, 0, -1);
      const parsedLogs = logs
        .map(log => JSON.parse(log))
        .filter(log => log.userId === userId);
      allLogs.push(...parsedLogs);
    }
    
    return allLogs.slice(0, limit);
  } catch (error) {
    logger.error('Erro ao buscar logs GDPR:', error);
    return [];
  }
};