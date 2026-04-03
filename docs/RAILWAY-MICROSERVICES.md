# Railway: Separação em 3 Serviços

Este documento explica como separar a aplicação GendaGO em 3 serviços independentes no Railway.

## Estrutura

- **API Service** (Port 3001)
  - Rotas: `/api/*`, `/swagger`
  - Arquivo: `src/api-server.js`
  - Start: `npm run start:api`

- **Backoffice Service** (Port 3002)
  - Rotas: `/admin/*`
  - Arquivo: `src/backoffice-server.js`
  - Start: `npm run start:backoffice`
  - Includes: Admin login, CSRF protection, session management

- **Webapp Service** (Port 3003)
  - Rotas: `/app/*`, `/`, `/categorias/*`
  - Arquivo: `src/webapp-server.js`
  - Start: `npm run start:webapp`
  - Public storefront for customers

## Setup no Railway

### 1. Criar 3 Serviços

No projeto Railway:

```
1. Criando novo serviço (Node.js) para API
2. Criando novo serviço (Node.js) para Backoffice
3. Criando novo serviço (Node.js) para Webapp
```

### 2. Configurar Cada Serviço

**API Service:**
- Root Directory: `./`
- Build Command: `npm install`
- Start Command: `npm run start:api`
- Variables: `NODE_ENV=production`, `PORT=3001`, database vars

**Backoffice Service:**
- Root Directory: `./`
- Build Command: `npm install`
- Start Command: `npm run start:backoffice`
- Variables: `NODE_ENV=production`, `PORT=3002`, database vars

**Webapp Service:**
- Root Directory: `./`
- Build Command: `npm install`
- Start Command: `npm run start:webapp`
- Variables: `NODE_ENV=production`, `PORT=3003`, database vars

### 3. Compartilhar DATABASE_URL

Todos os 3 serviços precisam da mesma `DATABASE_URL`. No Railway:

1. Configure `DATABASE_URL` em cada serviço (copie do PostgreSQL)
2. Ou use um arquivo `.env` compartilhado (não recomendado)

### 4. Domínios Públicos

Cada serviço receberá um domínio:
- API: `api-xxx.up.railway.app`
- Backoffice: `backoffice-xxx.up.railway.app`
- Webapp: `webapp-xxx.up.railway.app`

Ou use custom domains:
- `api.meudomain.com`
- `admin.meudomain.com`
- `app.meudomain.com`

## Health Checks

Cada serviço tem endpoint `/health` que retorna:

```json
{
  "status": "ok",
  "service": "API|Backoffice|Webapp",
  "empresas_count": 1,
  "empresas": [...]
}
```

## Benefícios da Separação

✅ **Escalamento Independente** - Aumentar replicas só do API se preciso  
✅ **Builds Independentes** - Cada serviço deploy sozinho  
✅ **Isolamento de Falhas** - Se API cai, backoffice continua  
✅ **Monitoramento Específico** - Logs por serviço  
✅ **Segurança** - Reduzir surface de ataque em cada serviço  

## Teste Local

```bash
# Terminal 1: API
npm run dev:api

# Terminal 2: Backoffice  
npm run dev:backoffice

# Terminal 3: Webapp
npm run dev:webapp

# Testar
curl http://localhost:3001/health    # API
curl http://localhost:3002/health    # Backoffice
curl http://localhost:3003/health    # Webapp
```

## Fallback: Servidor Monolítico

Se precisar voltar para 1 serviço único:

```bash
npm start
```

Isso roda `src/app.js` que tem todas as rotas juntas.

## Notas Importantes

1. **DATABASE_URL deve ser igual** em todos os 3 serviços
2. **SESSION_SECRET deve ser igual** (apenas para backoffice)
3. **ALLOWED_ORIGIN precisa incluir domínios de cada serviço**
4. **Webapp não precisa de session/CSRF** (público)
5. **API não precisa de EJS/views** (JSON only)

## Troubleshooting

**API retorna 500 em /health**
- Verificar DATABASE_URL
- Verificar conexão PostgreSQL

**Backoffice não renderiza templates**
- Verificar pasta `src/views` existe
- Verificar paths de EJS no `backoffice-server.js`

**Webapp não carrega empresas**
- Verificar se banco tem dados (seed-db.js rodou)
- Verificar conexão de ambos serviços com mesmo DATABASE_URL

---

**Criado**: Abril 2026  
**Status**: Production Ready
