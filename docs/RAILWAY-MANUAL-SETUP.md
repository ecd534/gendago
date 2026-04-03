# ⚡ Setup Railway Microservices - Step by Step

## 🎯 Objetivo
Transformar 1 serviço monolítico em 3 serviços independentes:
- **API** (3001) - `/api/*` `/swagger`
- **Backoffice** (3002) - `/admin/*`
- **Webapp** (3003) - `/app/*`

---

## 📋 Checklist

### PHASE 1: Deletar Serviço Antigo ❌➡️✅

```
[ ] 1. Abra https://railway.app/dashboard
[ ] 2. Clique no projeto "noble-friendship" (ou seu projeto)
[ ] 3. Clique no serviço "Node.js" (o único que existe)
[ ] 4. Vá em Settings → Danger Zone
[ ] 5. Clique "Delete Service"
[ ] 6. Confirme deletando
```

**Status**: Serviço antigo removido ✓

---

### PHASE 2: Criar 3 Novos Serviços 📦

#### 2.1: Service 1 - API 🔵

```
[ ] 1. Na página do projeto, clique "+ New"
[ ] 2. Escolha "Service" → "Deploy from GitHub repo"
[ ] 3. Escolha "gendago" repo
[ ] 4. Name: "api" (ou "gendago-api")
[ ] 5. Clique "Create Service"
```

**Aguarde**: Build completar (2-3 min)

#### 2.2: Service 2 - Backoffice 🟡

```
[ ] 1. Clique "+ New" novamente
[ ] 2. Escolha "Service" → "Deploy from GitHub repo"
[ ] 3. Escolha "gendago" repo
[ ] 4. Name: "backoffice" (ou "gendago-backoffice")
[ ] 5. Clique "Create Service"
```

**Aguarde**: Build completar

#### 2.3: Service 3 - Webapp 🟢

```
[ ] 1. Clique "+ New" novamente
[ ] 2. Escolha "Service" → "Deploy from GitHub repo"
[ ] 3. Escolha "gendago" repo
[ ] 4. Name: "webapp" (ou "gendago-webapp")
[ ] 5. Clique "Create Service"
```

**Status**: 3 serviços criados ✓

---

### PHASE 3: Configurar Environment Variables 🔧

**Para CADA serviço (API, Backoffice, Webapp):**

#### 3.1: API Service Config

```
[ ] 1. Clique no serviço "api"
[ ] 2. Vá em "Variables"
[ ] 3. Adicione estas variáveis:

PORT                   → 3000
NODE_ENV               → production
DATABASE_URL           → (copiar abaixo ↓)
SESSION_SECRET         → <seu-secret-aqui>
SECRET_KEY             → <seu-secret-aqui>
ALLOWED_ORIGIN         → https://seu-api-domain.railway.app
DB_QUERY_TIMEOUT       → 30000
DB_STATEMENT_TIMEOUT   → 30000

[ ] 4. Clique "Save"
```

#### 3.2: Backoffice Service Config

```
[ ] 1. Clique no serviço "backoffice"
[ ] 2. Vá em "Variables"
[ ] 3. Adicione (MESMAS que API):

PORT                   → 3000
NODE_ENV               → production
DATABASE_URL           → (COPIAR IGUAL AO API)
SESSION_SECRET         → (MESMO SECRET DO API)
SECRET_KEY             → (MESMO SECRET DO API)
ALLOWED_ORIGIN         → https://seu-backoffice-domain.railway.app

[ ] 4. Clique "Save"
```

#### 3.3: Webapp Service Config

```
[ ] 1. Clique no serviço "webapp"
[ ] 2. Vá em "Variables"
[ ] 3. Adicione:

PORT                   → 3000
NODE_ENV               → production
DATABASE_URL           → (COPIAR IGUAL AO API)
ALLOWED_ORIGIN         → https://seu-webapp-domain.railway.app

[ ] 4. Clique "Save"
```

**⚠️ IMPORTANTE**: DATABASE_URL deve ser **exatamente igual** nos 3 serviços!

Para conseguir DATABASE_URL:
1. Vá no serviço PostgreSQL
2. Clique "Connect"
3. Copie "Database URL"
4. Cole em todos os 3 serviços

---

### PHASE 4: Configurar Build & Start Commands 🚀

**Para API Service:**
```
[ ] 1. Clique em "api"
[ ] 2. Vá em "Deployments" → "Settings"
[ ] 3. Build Command: npm install
[ ] 4. Start Command: npm run start:api
[ ] 5. Save
```

**Para Backoffice Service:**
```
[ ] 1. Clique em "backoffice"
[ ] 2. Vá em "Deployments" → "Settings"
[ ] 3. Build Command: npm install
[ ] 4. Start Command: npm run start:backoffice
[ ] 5. Save
```

**Para Webapp Service:**
```
[ ] 1. Clique em "webapp"
[ ] 2. Vá em "Deployments" → "Settings"
[ ] 3. Build Command: npm install
[ ] 4. Start Command: npm run start:webapp
[ ] 5. Save
```

**Status**: Build commands configurados ✓

---

### PHASE 5: Esperar Builds 🕐

Os 3 serviços vão fazer rebuild e deploy com os novos comandos.

```
Monitorar logs em cada serviço:
- API → Deployments → View Logs
- Backoffice → Deployments → View Logs
- Webapp → Deployments → View Logs

Procure por: "✓ Server ativo na porta 3000"
```

**Tempo estimado**: 5-10 minutos

---

### PHASE 6: Testar Health Endpoints ✅

Cada serviço recebe um domínio público automático. Para achar:

```
1. Clique em cada serviço
2. Vá em "Networking" (aba no topo)
3. Veja "Public Networking" URLs
```

**Testar em browser:**

🔵 API:
```
https://<seu-api-domain>.railway.app/health
```
Esperado: `{"status":"ok","service":"API","empresas_count":1}`

🟡 Backoffice:
```
https://<seu-backoffice-domain>.railway.app/health
```
Esperado: `{"status":"ok","service":"Backoffice","empresas_count":1}`

🟢 Webapp:
```
https://<seu-webapp-domain>.railway.app/health
```
Esperado: `{"status":"ok","service":"Webapp","empresas_count":1}`

**Status**: Todos 3 health checks retornam 200 ✓

---

### PHASE 7: Teste as Aplicações 🧪

🔵 **API em produção:**
```
https://<seu-api-domain>.railway.app/swagger
```

🟡 **Admin em produção:**
```
https://<seu-backoffice-domain>.railway.app/admin/login
Email: raasjakarta@gmail.com
Senha: 123456
```

🟢 **Webapp em produção:**
```
https://<seu-webapp-domain>.railway.app/app/espacoflaviaduarte
```

---

## 🔐 Secrets Management

### DATABASE_URL - Onde pegar?

1. Vá em PostgreSQL service
2. Clique "Connect"
3. Copie: `Database URL`
4. FormAT: `postgresql://user:password@host:port/database`

### SESSION_SECRET e SECRET_KEY - Gerar?

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Rode 2x (uma para SESSION_SECRET, outra para SECRET_KEY)

---

## 🚨 Troubleshooting

### Problema: Serviço não sobe
```
❌ Logs mostram: "Cannot find module"
✅ Solução: Verificar que Build Command é "npm install"
```

### Problema: Database connection error
```
❌ Logs mostram: "getaddrinfo ENOTFOUND"
✅ Solução: DATABASE_URL está correto e igual em todos os 3?
```

### Problema: /app/espacoflaviaduarte retorna 500
```
❌ Logs mostram: erro na query
✅ Solução: 
  - DATABASE_URL correto?
  - Banco foi seeded (8-9 tabelas)?
  - Schema é 'public' (não 'venus')?
```

### Problema: Admin login não funciona
```
❌ Logs mostram: CSRF error ou usuário não encontrado
✅ Solução:
  - SESSION_SECRET e SECRET_KEY iguais?
  - Master user existe (raasjakarta@gmail.com)?
  - Verificar seed rodou: SELECT COUNT(*) FROM usuarios;
```

---

## ✅ Checklist Final

```
[ ] Serviço antigo deletado
[ ] 3 novos serviços criados (API, Backoffice, Webapp)
[ ] DATABASE_URL configurada em todos
[ ] SESSION_SECRET e SECRET_KEY configuradas
[ ] Build commands: "npm install"
[ ] Start commands corretos:
    [ ] npm run start:api
    [ ] npm run start:backoffice
    [ ] npm run start:webapp
[ ] Todos os 3 serviços em status "running"
[ ] /health retorna 200 em todos os 3
[ ] Acesso ao admin funciona
[ ] Webapp carrega (ou retorna erro específico para debugar)
[ ] API Swagger acessível
```

---

## 📞 Suporte

Se algo não funcionar:
1. Verificar logs do serviço (Deployments → View Logs)
2. Copiar erro completo
3. Referir a seção "Troubleshooting" acima
4. Se ainda não resolver → criar issue

**Tempo total estimado**: 20-30 minutos

---

**Status**: 🟢 Pronto para deploy multiservices!

