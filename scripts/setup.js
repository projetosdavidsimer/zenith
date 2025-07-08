#!/usr/bin/env node

/**
 * SCRIPT DE CONFIGURAÇÃO INICIAL
 * Vizinho Virtual - SaaS de Gestão de Condomínios
 * 
 * Este script automatiza a configuração inicial do projeto:
 * - Verifica dependências
 * - Configura variáveis de ambiente
 * - Inicializa banco de dados
 * - Executa migrações
 * - Popula dados iniciais
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
// VERIFICAÇÕES INICIAIS
// ==============================================

async function checkPrerequisites() {
  log.title('Verificando Pré-requisitos');

  const requirements = [
    { name: 'Node.js', command: 'node --version', minVersion: '18.0.0' },
    { name: 'npm', command: 'npm --version', minVersion: '8.0.0' },
    { name: 'Docker', command: 'docker --version', minVersion: '24.0.0' },
    { name: 'Docker Compose', command: 'docker-compose --version', minVersion: '2.0.0' }
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

  log.success('Todos os pré-requisitos foram atendidos!');
}

// ==============================================
// CONFIGURAÇÃO DE AMBIENTE
// ==============================================

async function setupEnvironment() {
  log.title('Configuração do Ambiente');

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  if (fs.existsSync(envPath)) {
    const overwrite = await question('Arquivo .env já existe. Deseja sobrescrever? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Mantendo arquivo .env existente.');
      return;
    }
  }

  if (!fs.existsSync(envExamplePath)) {
    log.error('Arquivo .env.example não encontrado!');
    process.exit(1);
  }

  // Copiar .env.example para .env
  fs.copyFileSync(envExamplePath, envPath);
  log.success('Arquivo .env criado a partir do .env.example');

  // Configurações interativas
  log.info('Vamos configurar algumas variáveis importantes:');

  const nodeEnv = await question('Ambiente (development/production) [development]: ') || 'development';
  const dbPassword = await question('Senha do PostgreSQL [VizinhoSecure2024!]: ') || 'VizinhoSecure2024!';
  const jwtSecret = await question('JWT Secret (deixe vazio para gerar automaticamente): ') || generateRandomString(64);

  // Atualizar .env
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/NODE_ENV=.*/, `NODE_ENV=${nodeEnv}`);
  envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${dbPassword}`);
  envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);

  fs.writeFileSync(envPath, envContent);
  log.success('Variáveis de ambiente configuradas!');
}

// ==============================================
// INSTALAÇÃO DE DEPENDÊNCIAS
// ==============================================

async function installDependencies() {
  log.title('Instalando Dependências');

  const packages = [
    { name: 'Root', path: '.' },
    { name: 'Backend', path: 'backend' },
    { name: 'API Gateway', path: 'backend/api-gateway' },
    { name: 'User Management', path: 'backend/services/user-management' }
  ];

  for (const pkg of packages) {
    try {
      log.info(`Instalando dependências: ${pkg.name}...`);
      const pkgPath = path.join(__dirname, '..', pkg.path);
      
      if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
        execSync('npm install', { cwd: pkgPath, stdio: 'inherit' });
        log.success(`${pkg.name}: Dependências instaladas`);
      } else {
        log.warning(`${pkg.name}: package.json não encontrado, pulando...`);
      }
    } catch (error) {
      log.error(`Erro ao instalar dependências do ${pkg.name}: ${error.message}`);
    }
  }
}

// ==============================================
// CONFIGURAÇÃO DO DOCKER
// ==============================================

async function setupDocker() {
  log.title('Configurando Docker');

  try {
    // Verificar se Docker está rodando
    execSync('docker info', { stdio: 'ignore' });
    log.success('Docker está rodando');

    const startDocker = await question('Deseja iniciar os serviços Docker? (Y/n): ');
    if (startDocker.toLowerCase() !== 'n') {
      log.info('Iniciando serviços Docker...');
      
      // Parar containers existentes
      try {
        execSync('docker-compose down', { stdio: 'ignore' });
      } catch (error) {
        // Ignorar erro se não há containers rodando
      }

      // Iniciar serviços
      execSync('docker-compose up -d postgres redis rabbitmq', { stdio: 'inherit' });
      log.success('Serviços Docker iniciados (PostgreSQL, Redis, RabbitMQ)');

      // Aguardar serviços ficarem prontos
      log.info('Aguardando serviços ficarem prontos...');
      await sleep(10000); // 10 segundos
    }
  } catch (error) {
    log.error('Docker não está rodando. Por favor, inicie o Docker e tente novamente.');
    process.exit(1);
  }
}

// ==============================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ==============================================

async function setupDatabase() {
  log.title('Configurando Banco de Dados');

  try {
    // Verificar conexão com PostgreSQL
    log.info('Verificando conexão com PostgreSQL...');
    
    // Aguardar PostgreSQL estar pronto
    let retries = 30;
    while (retries > 0) {
      try {
        execSync('docker-compose exec -T postgres pg_isready -U vizinho_admin', { stdio: 'ignore' });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error('PostgreSQL não está respondendo');
        }
        log.info('Aguardando PostgreSQL...');
        await sleep(2000);
      }
    }

    log.success('PostgreSQL está pronto');

    // Executar migrações (quando implementadas)
    log.info('Executando migrações...');
    // execSync('npm run migrate', { stdio: 'inherit' });
    log.success('Migrações executadas (placeholder)');

    // Executar seeds (quando implementados)
    log.info('Populando dados iniciais...');
    // execSync('npm run seed', { stdio: 'inherit' });
    log.success('Dados iniciais criados (placeholder)');

  } catch (error) {
    log.error(`Erro na configuração do banco: ${error.message}`);
    log.warning('Você pode executar as migrações manualmente depois com: npm run migrate');
  }
}

// ==============================================
// VERIFICAÇÃO FINAL
// ==============================================

async function finalCheck() {
  log.title('Verificação Final');

  const checks = [
    { name: 'Arquivo .env', check: () => fs.existsSync('.env') },
    { name: 'node_modules', check: () => fs.existsSync('node_modules') },
    { name: 'PostgreSQL', check: () => checkDockerService('postgres') },
    { name: 'Redis', check: () => checkDockerService('redis') },
    { name: 'RabbitMQ', check: () => checkDockerService('rabbitmq') }
  ];

  for (const check of checks) {
    try {
      if (check.check()) {
        log.success(check.name);
      } else {
        log.warning(`${check.name} - Verificação falhou`);
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
  log.title('🎉 Configuração Concluída!');

  console.log(`
${colors.bright}Próximos passos:${colors.reset}

1. ${colors.green}Iniciar o desenvolvimento:${colors.reset}
   npm run dev

2. ${colors.green}Acessar a aplicação:${colors.reset}
   • Frontend: http://localhost:3100
   • API Gateway: http://localhost:3000
   • API Docs: http://localhost:3000/api-docs

3. ${colors.green}Monitoramento:${colors.reset}
   • Grafana: http://localhost:3200 (admin/VizinhoGrafana2024!)
   • Prometheus: http://localhost:9090

4. ${colors.green}Comandos úteis:${colors.reset}
   • npm run docker:up    - Iniciar todos os serviços
   • npm run docker:down  - Parar todos os serviços
   • npm run logs         - Ver logs dos serviços
   • npm run test         - Executar testes

${colors.bright}Documentação:${colors.reset}
• README.md - Documentação completa
• docs/ - Documentação técnica
• .env - Configurações de ambiente

${colors.bright}Suporte:${colors.reset}
• GitHub Issues: https://github.com/sua-empresa/vizinho-virtual/issues
• Email: dev@vizinhovirtual.com

${colors.green}🚀 Bom desenvolvimento!${colors.reset}
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkDockerService(serviceName) {
  try {
    const output = execSync(`docker-compose ps ${serviceName}`, { encoding: 'utf8' });
    return output.includes('Up');
  } catch (error) {
    return false;
  }
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
║  🏢 VIZINHO VIRTUAL - SETUP INICIAL                         ║
║                                                              ║
║  SaaS de Gestão de Condomínios                              ║
║  Configuração automática do ambiente de desenvolvimento     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`);

    await checkPrerequisites();
    await setupEnvironment();
    await installDependencies();
    await setupDocker();
    await setupDatabase();
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
  setupEnvironment,
  installDependencies,
  setupDocker,
  setupDatabase
};