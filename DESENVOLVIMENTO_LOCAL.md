# 🏠 Desenvolvimento Local - Vizinho Virtual

## 📋 Visão Geral

Esta é a versão **simplificada** do Vizinho Virtual para desenvolvimento local **sem Docker**. Ideal para começar o desenvolvimento enquanto você não tem infraestrutura configurada.

---

## 🚀 Setup Rápido

### 1. **Configuração Inicial**
```bash
# Execute o setup automático
node scripts/setup-local.js
```

### 2. **Iniciar Desenvolvimento**
```bash
# Iniciar serviços locais
npm run dev:local

# Ou usar o script direto
node scripts/dev-local.js start
```

### 3. **Acessar Aplicação**
- **API Gateway:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

---

## 🛠️ Comandos Disponíveis

### **Desenvolvimento**
```bash
npm run dev:local          # Iniciar desenvolvimento local
npm run status             # Verificar status dos serviços
npm run help               # Ver todos os comandos
```

### **Testes e Qualidade**
```bash
npm test                   # Executar testes
npm run lint               # Verificar código
npm run lint:fix           # Corrigir problemas automaticamente
```

### **Utilitários**
```bash
npm run clean              # Limpar arquivos temporários
npm run build              # Build do projeto
```

---

## 📁 Estrutura Local

```
vizinho-virtual/
├── 📄 .env.local          # Configurações locais
├── 📄 dev.db              # Banco SQLite
├── 📁 logs/               # Logs da aplicação
├── 📁 temp/               # Arquivos temporários
├── 📁 uploads/            # Uploads (desenvolvimento)
└── 📁 backend/
    └── 📁 api-gateway/    # Gateway principal
```

---

## ⚙️ Configurações Locais

### **Banco de Dados**
- **Tipo:** SQLite (arquivo: `dev.db`)
- **Localização:** Raiz do projeto
- **Configuração:** Automática

### **Cache**
- **Tipo:** Memória (sem Redis)
- **Configuração:** Automática

### **Serviços Mock**
- **Email:** Simulado (logs no console)
- **SMS:** Simulado (logs no console)
- **Pagamentos:** Simulado (desenvolvimento)

---

## 🔧 Desenvolvimento

### **Estrutura de Código**
```typescript
// Exemplo de código TypeScript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'SINDICO' | 'MORADOR' | 'PROFISSIONAL';
}

// Validação com Joi
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).required(),
  role: Joi.string().valid('SINDICO', 'MORADOR', 'PROFISSIONAL')
});
```

### **Logs**
```bash
# Ver logs em tempo real
tail -f logs/combined.log

# Logs de erro
tail -f logs/error.log

# Logs de auditoria
tail -f logs/audit.log
```

### **Debugging**
- Use VS Code com as configurações incluídas
- Breakpoints funcionam normalmente
- Debug console disponível

---

## 🧪 Testes

### **Executar Testes**
```bash
# Todos os testes
npm test

# Testes específicos
npm run test:unit
npm run test:integration
```

### **Cobertura**
```bash
npm run test:coverage
```

---

## 🔐 Segurança Local

### **Funcionalidades Ativas**
- ✅ Autenticação JWT
- ✅ Validação de entrada
- ✅ Rate limiting
- ✅ Logs de auditoria
- ✅ Sanitização de dados

### **Simplificações Locais**
- 🔶 HTTPS desabilitado (HTTP apenas)
- 🔶 Emails simulados
- 🔶 SMS simulados
- 🔶 Pagamentos simulados

---

## 📊 Monitoramento Local

### **Health Check**
```bash
curl http://localhost:3000/health
```

### **Status dos Serviços**
```bash
npm run status
```

### **Logs Estruturados**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User authenticated",
  "userId": "123",
  "ip": "127.0.0.1"
}
```

---

## 🚧 Limitações da Versão Local

### **O Que Funciona**
- ✅ API Gateway
- ✅ Autenticação JWT
- ✅ Validação de dados
- ✅ Logs estruturados
- ✅ Health checks
- ✅ Testes unitários

### **O Que Está Simplificado**
- 🔶 Banco SQLite (em vez de PostgreSQL)
- 🔶 Cache em memória (em vez de Redis)
- 🔶 Sem mensageria (RabbitMQ)
- 🔶 Serviços mock (email, SMS, pagamentos)
- 🔶 Sem monitoramento (Prometheus/Grafana)

---

## 🎯 Próximos Passos

### **Para Você (Desenvolvedor)**
1. **Frontend React**
   - Criar interface de usuário
   - Integrar com API
   - Implementar autenticação

2. **Completar Backend**
   - Implementar microsserviços restantes
   - Adicionar funcionalidades de negócio
   - Criar testes automatizados

### **Para DevOps Futuro**
1. **Infraestrutura**
   - Instalar Docker
   - Configurar PostgreSQL
   - Setup Redis + RabbitMQ

2. **Produção**
   - Configurar Kubernetes
   - Setup monitoramento
   - CI/CD pipeline

---

## 📞 Quando Contratar DevOps

### **Sinais de Que Precisa de Infraestrutura**
- ✅ Frontend React funcionando
- ✅ 3+ microsserviços implementados
- ✅ Testes automatizados
- ✅ Primeiros usuários testando

### **O Que o DevOps Vai Fazer**
1. **Docker Setup**
   ```bash
   # Eles vão configurar
   docker-compose up -d
   ```

2. **Banco de Produção**
   ```sql
   -- Migração de SQLite para PostgreSQL
   -- Backup e restore automático
   ```

3. **Monitoramento**
   - Prometheus + Grafana
   - Alertas automáticos
   - Dashboards de negócio

4. **Deploy**
   - AWS/Azure/GCP
   - CI/CD automático
   - Escalabilidade

---

## 🆘 Troubleshooting

### **Problemas Comuns**

#### **Porta 3000 ocupada**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou usar porta diferente
set PORT=3001 && npm run dev:local
```

#### **Erro de permissão SQLite**
```bash
# Verificar permissões
ls -la dev.db

# Recriar banco
rm dev.db
npm run dev:local
```

#### **Node modules corrompidos**
```bash
npm run clean
npm install
```

### **Logs de Debug**
```bash
# Ativar debug detalhado
set DEBUG=vizinho:* && npm run dev:local
```

---

## 📚 Recursos Úteis

### **Documentação**
- [README.md](README.md) - Documentação completa
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Status do projeto
- [API Docs](http://localhost:3000/api-docs) - Quando rodando

### **Ferramentas Recomendadas**
- **VS Code** - Editor configurado
- **Postman** - Testar APIs
- **SQLite Browser** - Ver banco de dados
- **Git** - Controle de versão

### **Extensões VS Code**
- TypeScript
- ESLint
- Prettier
- REST Client
- GitLens

---

## 🎉 Conclusão

Esta versão local permite que você:

1. **Desenvolva imediatamente** sem configurar infraestrutura
2. **Teste funcionalidades** com dados reais
3. **Prepare o código** para produção
4. **Contrate DevOps** quando necessário

**🚀 Comece a desenvolver agora e escale depois!**

---

## 📞 Suporte

### **Desenvolvimento**
- **Logs:** Verifique `logs/` para erros
- **Status:** `npm run status`
- **Limpeza:** `npm run clean`

### **Quando Contratar DevOps**
- **Código pronto:** ✅
- **Arquitetura definida:** ✅
- **Documentação completa:** ✅
- **Configurações preparadas:** ✅

**💡 Tudo está pronto para um DevOps configurar rapidamente!**