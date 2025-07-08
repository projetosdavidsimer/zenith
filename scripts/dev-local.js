#!/usr/bin/env node

/**
 * SCRIPT DE DESENVOLVIMENTO LOCAL
 * Vizinho Virtual - SaaS de Gestão de Condomínios
 * 
 * Script para desenvolvimento sem Docker
 * Versão simplificada para Windows local
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
    description: 'Iniciar desenvolvimento local (sem Docker)',
    action: startLocalDevelopment
  },
  stop: {
    description: 'Parar serviços locais',
    action: stopLocalServices
  },
  status: {
    description: 'Verificar status dos serviços locais',
    action: checkLocalStatus
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
    description: 'Limpar arquivos temporários',
    action: cleanProject
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
    commands[command].action(args.slice(1));
  } catch (error) {
    log.error(`Erro ao executar comando '${command}': ${error.message}`);
    process.exit(1);
  }
}

// ==============================================
// IMPLEMENTAÇÃO DOS COMANDOS
// ==============================================

async function startLocalDevelopment() {
  log.title('Iniciando Desenvolvimento Local (Sem Docker)');

  // Verificar se .env.local existe
  if (!fs.existsSync('.env.local')) {
    log.warning('Arquivo .env.local não encontrado. Execute: node scripts/setup-local.js');
    return;
  }

  // Verificar se node_modules existe
  if (!fs.existsSync('node_modules')) {
    log.info('Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
  }

  log.info('Iniciando serviços locais...');

  // Iniciar API Gateway
  log.info('🚀 Iniciando API Gateway (porta 3000)...');
  const gatewayPath = path.join(__dirname, '..', 'backend', 'api-gateway');
  
  if (fs.existsSync(path.join(gatewayPath, 'src', 'index.ts'))) {
    const gatewayProcess = spawn('npm', ['run', 'dev'], {
      cwd: gatewayPath,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: 'development' }
    });

    gatewayProcess.on('error', (error) => {
      log.error(`Erro no API Gateway: ${error.message}`);
    });
  } else {
    log.warning('API Gateway não encontrado. Criando estrutura básica...');
    await createBasicGateway();
  }

  // Aguardar um pouco e mostrar status
  setTimeout(() => {
    showLocalAccessUrls();
  }, 3000);
}

async function stopLocalServices() {
  log.title('Parando Serviços Locais');

  try {
    // Matar processos Node.js relacionados ao projeto
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
        log.success('Processos Node.js finalizados');
      } catch (error) {
        log.info('Nenhum processo Node.js encontrado');
      }
    } else {
      try {
        execSync('pkill -f "vizinho-virtual"', { stdio: 'ignore' });
        log.success('Processos finalizados');
      } catch (error) {
        log.info('Nenhum processo encontrado');
      }
    }
  } catch (error) {
    log.warning('Alguns processos podem ainda estar rodando');
  }
}

async function checkLocalStatus() {
  log.title('Status dos Serviços Locais');

  // Verificar arquivos essenciais
  const essentialFiles = [
    { name: '.env.local', path: '.env.local' },
    { name: 'node_modules', path: 'node_modules' },
    { name: 'Banco SQLite', path: 'dev.db' },
    { name: 'API Gateway', path: 'backend/api-gateway/src/index.ts' }
  ];

  for (const file of essentialFiles) {
    if (fs.existsSync(file.path)) {
      log.success(`${file.name}: ✅ OK`);
    } else {
      log.warning(`${file.name}: ❌ Não encontrado`);
    }
  }

  // Verificar portas
  log.info('\nVerificando portas:');
  const ports = [3000, 3001, 3002, 3003];
  
  for (const port of ports) {
    const isOpen = await checkPort(port);
    const serviceName = getServiceNameByPort(port);
    
    if (isOpen) {
      log.success(`${serviceName} (${port}): 🟢 Ativo`);
    } else {
      log.info(`${serviceName} (${port}): ⚪ Inativo`);
    }
  }
}

async function runTests() {
  log.title('Executando Testes');

  try {
    log.info('Executando testes...');
    execSync('npm test', { stdio: 'inherit' });
    log.success('Testes concluídos!');
  } catch (error) {
    log.warning('Alguns testes falharam ou não foram encontrados');
    log.info('Configure os testes com Jest quando necessário');
  }
}

async function runLinting() {
  log.title('Executando Linting');

  try {
    log.info('Executando ESLint...');
    execSync('npm run lint', { stdio: 'inherit' });
    log.success('Linting concluído sem erros');
  } catch (error) {
    log.warning('Problemas de linting encontrados');
    log.info('Execute "npm run lint:fix" para corrigir automaticamente');
  }
}

async function cleanProject() {
  log.title('Limpando Projeto');

  const itemsToClean = [
    'node_modules',
    'dist',
    'build',
    'coverage',
    'logs/*.log',
    'temp/*'
  ];

  for (const item of itemsToClean) {
    try {
      if (fs.existsSync(item)) {
        log.info(`Removendo: ${item}`);
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q "${item}"`, { stdio: 'ignore' });
        } else {
          execSync(`rm -rf ${item}`, { stdio: 'ignore' });
        }
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

  log.success('Limpeza concluída');
}

async function buildProject() {
  log.title('Build do Projeto');

  try {
    log.info('Executando build...');
    
    // Build do backend se existir
    const backendPath = path.join(__dirname, '..', 'backend');
    if (fs.existsSync(path.join(backendPath, 'package.json'))) {
      log.info('Build do backend...');
      execSync('npm run build', { cwd: backendPath, stdio: 'inherit' });
    }

    log.success('Build concluído com sucesso');
  } catch (error) {
    log.error('Erro durante o build');
    log.info('Verifique se todos os arquivos TypeScript estão corretos');
  }
}

async function createBasicGateway() {
  log.info('Criando estrutura básica do API Gateway...');
  
  const gatewayPath = path.join(__dirname, '..', 'backend', 'api-gateway', 'src');
  
  if (!fs.existsSync(gatewayPath)) {
    fs.mkdirSync(gatewayPath, { recursive: true });
  }

  // Criar um index.js básico se não existir
  const basicIndex = `
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    mode: 'local-development'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Vizinho Virtual API Gateway',
    version: '1.0.0',
    mode: 'local-development',
    endpoints: {
      health: '/health',
      docs: '/api-docs (em desenvolvimento)'
    }
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 API Gateway rodando na porta \${PORT}\`);
  console.log(\`🌍 Acesse: http://localhost:\${PORT}\`);
  console.log(\`❤️ Health Check: http://localhost:\${PORT}/health\`);
});
`;

  const indexPath = path.join(gatewayPath, 'index.js');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, basicIndex);
    log.success('API Gateway básico criado!');
  }
}

function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}🏢 Vizinho Virtual - Desenvolvimento Local${colors.reset}

${colors.bright}Uso:${colors.reset}
  node scripts/dev-local.js <comando>

${colors.bright}Comandos disponíveis:${colors.reset}
`);

  Object.entries(commands).forEach(([cmd, config]) => {
    console.log(`  ${colors.green}${cmd.padEnd(12)}${colors.reset} ${config.description}`);
  });

  console.log(`
${colors.bright}Exemplos:${colors.reset}
  node scripts/dev-local.js start    # Iniciar desenvolvimento
  node scripts/dev-local.js status   # Verificar status
  node scripts/dev-local.js test     # Executar testes
  node scripts/dev-local.js clean    # Limpar projeto

${colors.bright}URLs de Acesso (quando rodando):${colors.reset}
  API Gateway: http://localhost:3000
  Health Check: http://localhost:3000/health

${colors.bright}Nota:${colors.reset}
  Esta é a versão LOCAL sem Docker.
  Para infraestrutura completa, contrate um DevOps!
`);
}

// ==============================================
// FUNÇÕES AUXILIARES
// ==============================================

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
    3003: 'Financial Service'
  };
  
  return portMap[port] || `Serviço (${port})`;
}

function showLocalAccessUrls() {
  console.log(`
${colors.bright}🌐 URLs de Acesso Local:${colors.reset}

${colors.green}API Gateway:${colors.reset}     http://localhost:3000
${colors.green}Health Check:${colors.reset}    http://localhost:3000/health

${colors.bright}💡 Dicas para Desenvolvimento Local:${colors.reset}
• Use 'node scripts/dev-local.js status' para verificar serviços
• Banco SQLite está em: dev.db
• Logs estão em: logs/
• Para parar: Ctrl+C ou 'node scripts/dev-local.js stop'

${colors.yellow}📋 Para o futuro (quando contratar DevOps):${colors.reset}
• Docker será configurado automaticamente
• PostgreSQL substituirá SQLite
• Redis será adicionado para cache
• Monitoramento será habilitado
`);
}

// ==============================================
// EXECUÇÃO
// ==============================================

if (require.main === module) {
  main();
}

module.exports = {
  startLocalDevelopment,
  stopLocalServices,
  checkLocalStatus,
  runTests,
  cleanProject
};