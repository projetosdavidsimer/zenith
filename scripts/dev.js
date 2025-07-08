#!/usr/bin/env node

/**
 * SCRIPT DE DESENVOLVIMENTO
 * Vizinho Virtual - SaaS de Gestão de Condomínios
 * 
 * Script para facilitar tarefas comuns de desenvolvimento:
 * - Iniciar/parar serviços
 * - Verificar status
 * - Executar testes
 * - Ver logs
 * - Limpar cache
 * 
 * @author DevOps Expert - Vizinho Virtual
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// ==============================================
// COMANDOS DISPONÍVEIS
// ==============================================

const commands = {
  start: {
    description: 'Iniciar todos os serviços de desenvolvimento',
    action: startDevelopment
  },
  stop: {
    description: 'Parar todos os serviços',
    action: stopServices
  },
  restart: {
    description: 'Reiniciar todos os serviços',
    action: restartServices
  },
  status: {
    description: 'Verificar status dos serviços',
    action: checkStatus
  },
  logs: {
    description: 'Ver logs dos serviços',
    action: showLogs
  },
  test: {
    description: 'Executar testes',
    action: runTests
  },
  lint: {
    description: 'Executar linting',
    action: runLinting
  },
  clean: {
    description: 'Limpar cache e arquivos temporários',
    action: cleanProject
  },
  db: {
    description: 'Comandos de banco de dados',
    subcommands: {
      migrate: 'Executar migrações',
      seed: 'Popular dados iniciais',
      reset: 'Resetar banco de dados'
    },
    action: handleDatabaseCommands
  },
  build: {
    description: 'Build do projeto',
    action: buildProject
  },
  help: {
    description: 'Mostrar esta ajuda',
    action: showHelp
  }
};

// ==============================================
// FUNÇÃO PRINCIPAL
// ==============================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const subcommand = args[1];

  if (!command || command === 'help') {
    showHelp();
    return;
  }

  if (!commands[command]) {
    log.error(`Comando '${command}' não encontrado.`);
    showHelp();
    process.exit(1);
  }

  try {
    commands[command].action(subcommand, args.slice(2));
  } catch (error) {
    log.error(`Erro ao executar comando '${command}': ${error.message}`);
    process.exit(1);
  }
}

// ==============================================
// IMPLEMENTAÇÃO DOS COMANDOS
// ==============================================

async function startDevelopment() {
  log.title('Iniciando Ambiente de Desenvolvimento');

  // Verificar se Docker está rodando
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch (error) {
    log.error('Docker não está rodando. Por favor, inicie o Docker primeiro.');
    process.exit(1);
  }

  // Iniciar serviços Docker
  log.info('Iniciando serviços Docker...');
  execSync('docker-compose up -d postgres redis rabbitmq', { stdio: 'inherit' });

  // Aguardar serviços ficarem prontos
  log.info('Aguardando serviços ficarem prontos...');
  await waitForServices();

  // Iniciar aplicação
  log.info('Iniciando aplicação...');
  
  // Usar concurrently para iniciar múltiplos processos
  const processes = [
    'npm run dev:backend',
    'npm run dev:frontend'
  ];

  processes.forEach(cmd => {
    log.info(`Executando: ${cmd}`);
    spawn('npm', cmd.split(' ').slice(1), {
      stdio: 'inherit',
      shell: true,
      detached: false
    });
  });

  log.success('Ambiente de desenvolvimento iniciado!');
  showAccessUrls();
}

async function stopServices() {
  log.title('Parando Serviços');

  try {
    // Parar containers Docker
    log.info('Parando containers Docker...');
    execSync('docker-compose down', { stdio: 'inherit' });

    // Matar processos Node.js (se necessário)
    try {
      if (process.platform === 'win32') {
        execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
      } else {
        execSync('pkill -f "node.*dev"', { stdio: 'ignore' });
      }
    } catch (error) {
      // Ignorar erro se não há processos para matar
    }

    log.success('Todos os serviços foram parados');
  } catch (error) {
    log.error(`Erro ao parar serviços: ${error.message}`);
  }
}

async function restartServices() {
  log.title('Reiniciando Serviços');
  await stopServices();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
  await startDevelopment();
}

async function checkStatus() {
  log.title('Status dos Serviços');

  const services = [
    { name: 'PostgreSQL', command: 'docker-compose ps postgres' },
    { name: 'Redis', command: 'docker-compose ps redis' },
    { name: 'RabbitMQ', command: 'docker-compose ps rabbitmq' }
  ];

  for (const service of services) {
    try {
      const output = execSync(service.command, { encoding: 'utf8' });
      const isRunning = output.includes('Up');
      
      if (isRunning) {
        log.success(`${service.name}: Rodando`);
      } else {
        log.warning(`${service.name}: Parado`);
      }
    } catch (error) {
      log.error(`${service.name}: Erro ao verificar status`);
    }
  }

  // Verificar portas da aplicação
  const ports = [3000, 3001, 3002, 3003, 3004, 3100];
  log.info('\nVerificando portas da aplicação:');
  
  for (const port of ports) {
    const isOpen = await checkPort(port);
    const serviceName = getServiceNameByPort(port);
    
    if (isOpen) {
      log.success(`${serviceName} (${port}): Ativo`);
    } else {
      log.warning(`${serviceName} (${port}): Inativo`);
    }
  }
}

async function showLogs(service) {
  log.title('Logs dos Serviços');

  if (service) {
    log.info(`Mostrando logs do serviço: ${service}`);
    execSync(`docker-compose logs -f ${service}`, { stdio: 'inherit' });
  } else {
    log.info('Mostrando logs de todos os serviços');
    execSync('docker-compose logs -f', { stdio: 'inherit' });
  }
}

async function runTests(type) {
  log.title('Executando Testes');

  const testCommands = {
    unit: 'npm run test:unit',
    integration: 'npm run test:integration',
    e2e: 'npm run test:e2e',
    coverage: 'npm run test:coverage',
    all: 'npm test'
  };

  const command = testCommands[type] || testCommands.all;
  
  log.info(`Executando: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

async function runLinting() {
  log.title('Executando Linting');

  try {
    log.info('Executando ESLint...');
    execSync('npm run lint', { stdio: 'inherit' });
    
    log.info('Executando Prettier...');
    execSync('npx prettier --check .', { stdio: 'inherit' });
    
    log.success('Linting concluído sem erros');
  } catch (error) {
    log.warning('Linting encontrou problemas. Execute "npm run lint:fix" para corrigir automaticamente.');
  }
}

async function cleanProject() {
  log.title('Limpando Projeto');

  const itemsToClean = [
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    '.nyc_output',
    'logs',
    '*.log'
  ];

  for (const item of itemsToClean) {
    try {
      if (fs.existsSync(item)) {
        log.info(`Removendo: ${item}`);
        execSync(`rm -rf ${item}`, { stdio: 'ignore' });
      }
    } catch (error) {
      log.warning(`Não foi possível remover: ${item}`);
    }
  }

  // Limpar cache do npm
  try {
    log.info('Limpando cache do npm...');
    execSync('npm cache clean --force', { stdio: 'ignore' });
  } catch (error) {
    log.warning('Não foi possível limpar cache do npm');
  }

  // Limpar containers Docker parados
  try {
    log.info('Limpando containers Docker parados...');
    execSync('docker container prune -f', { stdio: 'ignore' });
  } catch (error) {
    log.warning('Não foi possível limpar containers Docker');
  }

  log.success('Limpeza concluída');
}

async function handleDatabaseCommands(subcommand) {
  log.title('Comandos de Banco de Dados');

  switch (subcommand) {
    case 'migrate':
      log.info('Executando migrações...');
      execSync('npm run migrate', { stdio: 'inherit' });
      break;
    
    case 'seed':
      log.info('Populando dados iniciais...');
      execSync('npm run seed', { stdio: 'inherit' });
      break;
    
    case 'reset':
      log.warning('Resetando banco de dados...');
      execSync('docker-compose exec postgres psql -U vizinho_admin -d vizinho_virtual -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"', { stdio: 'inherit' });
      execSync('npm run migrate', { stdio: 'inherit' });
      execSync('npm run seed', { stdio: 'inherit' });
      break;
    
    default:
      log.error('Subcomando de banco não reconhecido. Use: migrate, seed, reset');
  }
}

async function buildProject() {
  log.title('Build do Projeto');

  try {
    log.info('Executando build do backend...');
    execSync('cd backend && npm run build', { stdio: 'inherit' });
    
    log.info('Executando build do frontend...');
    execSync('cd frontend && npm run build', { stdio: 'inherit' });
    
    log.success('Build concluído com sucesso');
  } catch (error) {
    log.error('Erro durante o build');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}🏢 Vizinho Virtual - Script de Desenvolvimento${colors.reset}

${colors.bright}Uso:${colors.reset}
  node scripts/dev.js <comando> [opções]

${colors.bright}Comandos disponíveis:${colors.reset}
`);

  Object.entries(commands).forEach(([cmd, config]) => {
    console.log(`  ${colors.green}${cmd.padEnd(12)}${colors.reset} ${config.description}`);
    
    if (config.subcommands) {
      Object.entries(config.subcommands).forEach(([sub, desc]) => {
        console.log(`    ${colors.yellow}${cmd} ${sub.padEnd(8)}${colors.reset} ${desc}`);
      });
    }
  });

  console.log(`
${colors.bright}Exemplos:${colors.reset}
  node scripts/dev.js start          # Iniciar desenvolvimento
  node scripts/dev.js status         # Verificar status
  node scripts/dev.js logs postgres  # Ver logs do PostgreSQL
  node scripts/dev.js test unit      # Executar testes unitários
  node scripts/dev.js db migrate     # Executar migrações
  node scripts/dev.js clean          # Limpar projeto

${colors.bright}URLs de Acesso:${colors.reset}
  Frontend:    http://localhost:3100
  API Gateway: http://localhost:3000
  API Docs:    http://localhost:3000/api-docs
  Grafana:     http://localhost:3200
`);
}

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

async function waitForServices() {
  const services = ['postgres', 'redis', 'rabbitmq'];
  
  for (const service of services) {
    let retries = 30;
    while (retries > 0) {
      try {
        const output = execSync(`docker-compose ps ${service}`, { encoding: 'utf8' });
        if (output.includes('Up')) {
          log.success(`${service} está pronto`);
          break;
        }
      } catch (error) {
        // Continuar tentando
      }
      
      retries--;
      if (retries === 0) {
        log.warning(`${service} pode não estar pronto`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

async function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, 'localhost');
  });
}

function getServiceNameByPort(port) {
  const portMap = {
    3000: 'API Gateway',
    3001: 'User Management',
    3002: 'Building Management',
    3003: 'Financial Service',
    3004: 'Communication',
    3100: 'Frontend'
  };
  
  return portMap[port] || `Serviço (${port})`;
}

function showAccessUrls() {
  console.log(`
${colors.bright}🌐 URLs de Acesso:${colors.reset}

${colors.green}Frontend:${colors.reset}     http://localhost:3100
${colors.green}API Gateway:${colors.reset}  http://localhost:3000
${colors.green}API Docs:${colors.reset}     http://localhost:3000/api-docs
${colors.green}Grafana:${colors.reset}      http://localhost:3200 (admin/VizinhoGrafana2024!)
${colors.green}Prometheus:${colors.reset}   http://localhost:9090

${colors.bright}💡 Dicas:${colors.reset}
• Use 'node scripts/dev.js status' para verificar o status dos serviços
• Use 'node scripts/dev.js logs' para ver os logs em tempo real
• Use Ctrl+C para parar os serviços
`);
}

// ==============================================
// EXECUÇÃO
// ==============================================

if (require.main === module) {
  main();
}

module.exports = {
  startDevelopment,
  stopServices,
  checkStatus,
  runTests,
  cleanProject
};