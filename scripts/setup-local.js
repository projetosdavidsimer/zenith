#!/usr/bin/env node

/**
 * SETUP LOCAL (SEM DOCKER)
 * Vizinho Virtual - SaaS de Gestão de Condomínios
 * 
 * Setup simplificado para desenvolvimento local sem Docker
 * Preparado para futuras configurações de infraestrutura
 * 
 * @author DevOps Expert - Vizinho Virtual
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}🏢 ${msg}${colors.reset}\n`)
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// ==============================================
// VERIFICAÇÕES SIMPLIFICADAS
// ==============================================

async function checkPrerequisites() {
  log.title('Verificando Pré-requisitos (Versão Local)');

  const requirements = [
    { name: 'Node.js', command: 'node --version', minVersion: '18.0.0' },
    { name: 'npm', command: 'npm --version', minVersion: '8.0.0' }
  ];

  for (const req of requirements) {
    try {
      const output = execSync(req.command, { encoding: 'utf8' }).trim();
      log.success(`${req.name}: ${output}`);
    } catch (error) {
      log.error(`${req.name} não encontrado. Por favor, instale a versão ${req.minVersion} ou superior.`);
      process.exit(1);
    }
  }

  // Verificar se PostgreSQL está disponível (opcional)
  try {
    execSync('psql --version', { encoding: 'utf8', stdio: 'ignore' });
    log.success('PostgreSQL: Detectado (opcional)');
  } catch (error) {
    log.warning('PostgreSQL: Não detectado (usaremos SQLite para desenvolvimento)');
  }

  log.success('Pré-requisitos básicos atendidos!');
}

// ==============================================
// CONFIGURAÇÃO DE AMBIENTE LOCAL
// ==============================================

async function setupLocalEnvironment() {
  log.title('Configuração do Ambiente Local');

  const envPath = path.join(__dirname, '..', '.env.local');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  if (fs.existsSync(envPath)) {
    const overwrite = await question('Arquivo .env.local já existe. Deseja sobrescrever? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Mantendo arquivo .env.local existente.');
      return;
    }
  }

  // Criar configuração local simplificada
  const localEnvContent = `# ==============================================
# VIZINHO VIRTUAL - CONFIGURAÇÃO LOCAL
# Ambiente de desenvolvimento sem Docker
# ==============================================

# Ambiente
NODE_ENV=development
PORT=3000

# ==============================================
# DATABASE LOCAL (SQLite para desenvolvimento)
# ==============================================
DATABASE_URL=sqlite:./dev.db
DB_TYPE=sqlite
DB_PATH=./dev.db

# ==============================================
# CACHE LOCAL (Memória)
# ==============================================
CACHE_TYPE=memory
REDIS_URL=memory://localhost

# ==============================================
# SECURITY & AUTHENTICATION
# ==============================================
JWT_SECRET=${generateRandomString(64)}
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=${generateRandomString(32)}

# ==============================================
# DESENVOLVIMENTO LOCAL
# ==============================================
LOG_LEVEL=debug
DEBUG=vizinho:*

# ==============================================
# FEATURES (Habilitadas para desenvolvimento)
# ==============================================
FEATURE_MARKETPLACE=true
FEATURE_ASSEMBLIES=true
FEATURE_PROFESSIONALS=true
FEATURE_EMERGENCY=true
FEATURE_MOBILE_APP=false

# ==============================================
# MOCK SERVICES (Para desenvolvimento)
# ==============================================
MOCK_EMAIL_SERVICE=true
MOCK_SMS_SERVICE=true
MOCK_PAYMENT_SERVICE=true

# ==============================================
# CONFIGURAÇÕES FUTURAS (Para infraestrutura)
# ==============================================
# Quando contratar DevOps, configurar:
# DOCKER_ENABLED=false
# KUBERNETES_ENABLED=false
# PRODUCTION_DATABASE_URL=
# PRODUCTION_REDIS_URL=
# PRODUCTION_RABBITMQ_URL=

# ==============================================
# MONITORAMENTO (Desabilitado localmente)
# ==============================================
MONITORING_ENABLED=false
METRICS_ENABLED=false
LOGGING_LEVEL=development

# ==============================================
# COMPLIANCE (Configurado para desenvolvimento)
# ==============================================
GDPR_COMPLIANCE=true
DATA_RETENTION_DAYS=30
AUDIT_LOG_RETENTION_DAYS=90
`;

  fs.writeFileSync(envPath, localEnvContent);
  log.success('Arquivo .env.local criado para desenvolvimento local!');

  // Criar também .env padrão
  fs.writeFileSync(path.join(__dirname, '..', '.env'), localEnvContent);
  log.success('Arquivo .env criado!');
}

// ==============================================
// INSTALAÇÃO DE DEPENDÊNCIAS
// ==============================================

async function installDependencies() {
  log.title('Instalando Dependências');

  try {
    log.info('Instalando dependências do projeto principal...');
    execSync('npm install', { stdio: 'inherit' });
    log.success('Dependências principais instaladas!');

    // Instalar dependências do backend
    const backendPath = path.join(__dirname, '..', 'backend');
    if (fs.existsSync(path.join(backendPath, 'package.json'))) {
      log.info('Instalando dependências do backend...');
      execSync('npm install', { cwd: backendPath, stdio: 'inherit' });
      log.success('Dependências do backend instaladas!');
    }

    // Instalar dependências do API Gateway
    const gatewayPath = path.join(__dirname, '..', 'backend', 'api-gateway');
    if (fs.existsSync(path.join(gatewayPath, 'package.json'))) {
      log.info('Instalando dependências do API Gateway...');
      execSync('npm install', { cwd: gatewayPath, stdio: 'inherit' });
      log.success('Dependências do API Gateway instaladas!');
    }

    // Instalar dependências do User Management
    const userPath = path.join(__dirname, '..', 'backend', 'services', 'user-management');
    if (fs.existsSync(path.join(userPath, 'package.json'))) {
      log.info('Instalando dependências do User Management...');
      execSync('npm install', { cwd: userPath, stdio: 'inherit' });
      log.success('Dependências do User Management instaladas!');
    }

  } catch (error) {
    log.error(`Erro ao instalar dependências: ${error.message}`);
    log.warning('Você pode tentar instalar manualmente com: npm install');
  }
}

// ==============================================
// CONFIGURAÇÃO DE BANCO LOCAL
// ==============================================

async function setupLocalDatabase() {
  log.title('Configurando Banco de Dados Local');

  try {
    log.info('Configurando SQLite para desenvolvimento...');
    
    // Criar diretório de banco se não existir
    const dbDir = path.join(__dirname, '..', 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Criar arquivo de banco SQLite
    const dbPath = path.join(__dirname, '..', 'dev.db');
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, '');
      log.success('Banco SQLite criado: dev.db');
    }

    log.success('Banco de dados local configurado!');
    log.info('📝 Nota: Quando contratar DevOps, migraremos para PostgreSQL');

  } catch (error) {
    log.warning(`Aviso na configuração do banco: ${error.message}`);
    log.info('O banco será criado automaticamente quando necessário');
  }
}

// ==============================================
// CRIAR ESTRUTURA DE DESENVOLVIMENTO
// ==============================================

async function createDevStructure() {
  log.title('Criando Estrutura de Desenvolvimento');

  const directories = [
    'logs',
    'uploads',
    'temp',
    'database/backups',
    'docs/development',
    'tests/fixtures'
  ];

  for (const dir of directories) {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log.success(`Diretório criado: ${dir}`);
    }
  }

  // Criar arquivo de desenvolvimento
  const devReadme = `# 🚀 Desenvolvimento Local

## Status
- ✅ Configuração local sem Docker
- ✅ SQLite para desenvolvimento
- ✅ Cache em memória
- ✅ Serviços mock habilitados

## Próximos Passos
1. Implementar frontend React
2. Completar microsserviços
3. Configurar infraestrutura (quando contratar DevOps)

## Comandos Úteis
\`\`\`bash
# Iniciar desenvolvimento
npm run dev:local

# Testes
npm test

# Linting
npm run lint
\`\`\`

## Para DevOps Futuro
- Configurar Docker
- Setup PostgreSQL
- Configurar Redis
- Setup Kubernetes
- Monitoramento
`;

  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'development', 'README.md'), devReadme);
  log.success('Documentação de desenvolvimento criada!');
}

// ==============================================
// VERIFICAÇÃO FINAL
// ==============================================

async function finalCheck() {
  log.title('Verificação Final');

  const checks = [
    { name: 'Arquivo .env.local', check: () => fs.existsSync('.env.local') },
    { name: 'Arquivo .env', check: () => fs.existsSync('.env') },
    { name: 'node_modules', check: () => fs.existsSync('node_modules') },
    { name: 'Banco SQLite', check: () => fs.existsSync('dev.db') },
    { name: 'Diretório logs', check: () => fs.existsSync('logs') }
  ];

  for (const check of checks) {
    try {
      if (check.check()) {
        log.success(check.name);
      } else {
        log.warning(`${check.name} - Não encontrado`);
      }
    } catch (error) {
      log.warning(`${check.name} - Erro na verificação`);
    }
  }
}

// ==============================================
// INSTRUÇÕES FINAIS
// ==============================================

function showFinalInstructions() {
  log.title('🎉 Setup Local Concluído!');

  console.log(`
${colors.bright}✅ Configuração sem Docker finalizada!${colors.reset}

${colors.bright}Próximos passos:${colors.reset}

1. ${colors.green}Iniciar desenvolvimento:${colors.reset}
   npm run dev:local

2. ${colors.green}Testar API:${colors.reset}
   • API Gateway: http://localhost:3000
   • Health Check: http://localhost:3000/health

3. ${colors.green}Desenvolvimento:${colors.reset}
   • Código: Use VS Code com as extensões recomendadas
   • Banco: SQLite (dev.db) - sem configuração necessária
   • Cache: Em memória - automático

${colors.bright}📋 Para o DevOps futuro:${colors.reset}

${colors.yellow}Quando contratar alguém para infraestrutura:${colors.reset}
• ✅ Código está pronto para Docker
• ✅ Configurações de produção preparadas
• ✅ Microsserviços arquitetados
• ✅ Documentação completa disponível

${colors.yellow}Tarefas para DevOps:${colors.reset}
1. Instalar e configurar Docker
2. Setup PostgreSQL + Redis + RabbitMQ
3. Configurar Kubernetes (opcional)
4. Setup monitoramento (Prometheus + Grafana)
5. Configurar CI/CD
6. Deploy em cloud (AWS/Azure/GCP)

${colors.bright}📁 Arquivos importantes:${colors.reset}
• .env.local - Configuração local
• docker-compose.yml - Pronto para Docker
• PROJECT_STATUS.md - Status completo
• README.md - Documentação completa

${colors.bright}🔧 Comandos disponíveis:${colors.reset}
• npm run dev:local - Desenvolvimento local
• npm test - Executar testes
• npm run lint - Verificar código
• node scripts/dev-local.js - Helper local

${colors.green}🚀 Tudo pronto para desenvolvimento!${colors.reset}
${colors.yellow}💡 Quando precisar de infraestrutura, contrate um DevOps!${colors.reset}
`);
}

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==============================================
// EXECUÇÃO PRINCIPAL
// ==============================================

async function main() {
  try {
    console.log(`
${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  🏢 VIZINHO VIRTUAL - SETUP LOCAL                           ║
║                                                              ║
║  Configuração para desenvolvimento SEM Docker               ║
║  Preparado para futuras configurações de infraestrutura    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`);

    await checkPrerequisites();
    await setupLocalEnvironment();
    await installDependencies();
    await setupLocalDatabase();
    await createDevStructure();
    await finalCheck();
    showFinalInstructions();

  } catch (error) {
    log.error(`Erro durante a configuração: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  setupLocalEnvironment,
  installDependencies,
  setupLocalDatabase
};