# ==============================================
# DOCKERFILE - API GATEWAY
# Vizinho Virtual - SaaS de Gestão de Condomínios
# ==============================================

# Estágio 1: Build
FROM node:18-alpine AS builder

# Metadados
LABEL maintainer="Vizinho Virtual Team"
LABEL version="1.0.0"
LABEL description="API Gateway para Vizinho Virtual SaaS"

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S vizinho -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY src/ ./src/

# Build da aplicação
RUN npm run build

# Remover dependências de desenvolvimento
RUN npm prune --production

# ==============================================
# Estágio 2: Runtime
FROM node:18-alpine AS runtime

# Instalar dependências de runtime
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S vizinho -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar aplicação buildada
COPY --from=builder --chown=vizinho:nodejs /app/dist ./dist
COPY --from=builder --chown=vizinho:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=vizinho:nodejs /app/package.json ./

# Criar diretórios necessários
RUN mkdir -p logs && chown vizinho:nodejs logs

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Mudar para usuário não-root
USER vizinho

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]