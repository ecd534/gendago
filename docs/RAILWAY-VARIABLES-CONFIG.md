# 🔧 Variáveis de Ambiente - Configuração por Serviço

Railway sugere essas variáveis baseado no código. Aqui está como configurar para cada um dos 3 serviços **em produção**:

---

## 🔵 Service 1: API (Port 3001)

```
NODE_ENV                 = production
PORT                     = 3000

DATABASE_URL             = postgresql://user:password@host:port/dbname
ALLOWED_ORIGIN           = https://api-xxxxx.railway.app

DB_QUERY_TIMEOUT         = 30000
DB_STATEMENT_TIMEOUT     = 30000
```

**Start Command:** `npm run start:api`

---

## 🟡 Service 2: Backoffice (Port 3002)

```
NODE_ENV                 = production
PORT                     = 3000

DATABASE_URL             = postgresql://user:password@host:port/dbname
ALLOWED_ORIGIN           = https://backoffice-xxxxx.railway.app

SESSION_SECRET           = <gerar-com-crypto>
SECRET_KEY               = <gerar-com-crypto>

DB_QUERY_TIMEOUT         = 30000
DB_STATEMENT_TIMEOUT     = 30000
```

**Start Command:** `npm run start:backoffice`

---

## 🟢 Service 3: Webapp (Port 3003)

```
NODE_ENV                 = production
PORT                     = 3000

DATABASE_URL             = postgresql://user:password@host:port/dbname
ALLOWED_ORIGIN           = https://webapp-xxxxx.railway.app

DB_QUERY_TIMEOUT         = 30000
DB_STATEMENT_TIMEOUT     = 30000
```

**Start Command:** `npm run start:webapp`

---

## ⚠️ IMPORTANTE

### O que é IGUAL em todos os 3:
- `NODE_ENV` = `production`
- `DATABASE_URL` = **EXATAMENTE IGUAL** (copiar do PostgreSQL)
- `PORT` = `3000` (railway mapeia para público)
- `DB_QUERY_TIMEOUT` = `30000`
- `DB_STATEMENT_TIMEOUT` = `30000`

### O que é DIFERENTE:
- `ALLOWED_ORIGIN` = URL pública de cada serviço
  - API: `https://api-xxxxx.railway.app`
  - Backoffice: `https://backoffice-xxxxx.railway.app`
  - Webapp: `https://webapp-xxxxx.railway.app`

### Para Backoffice SÓ:
- `SESSION_SECRET` = secrets gerados (igual em versões futuras)
- `SECRET_KEY` = secrets gerados (igual em versões futuras)

---

## 📝 Como Pegar DATABASE_URL

1. Vá em **PostgreSQL service**
2. Clique aba **"Connect"**
3. Copie tudo em **"Database URL"**
4. Deve parecer com:
   ```
   postgresql://postgres:senha123@pg-xxxxx.railway.internal:5432/railway
   ```
5. Cole em **TODOS OS 3 SERVIÇOS** exatamente igual

---

## 🔐 Como Gerar SESSION_SECRET e SECRET_KEY

No terminal local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Rode 2x e copie os valores:

```
Session Secret: abc123def456...
Secret Key:     xyz789uvw123...
```

Coloque os MESMOS valores em Backoffice (para consistency).

---

## 🎯 Exemplos Cheios

### API (exemplo completo):
```
DATABASE_URL = postgresql://postgres:minha_senha_segura@pg-abc123.railway.internal:5432/railway
NODE_ENV = production
PORT = 3000
ALLOWED_ORIGIN = https://gendago-api.railway.app
DB_QUERY_TIMEOUT = 30000
DB_STATEMENT_TIMEOUT = 30000
```

### Backoffice (exemplo completo):
```
DATABASE_URL = postgresql://postgres:minha_senha_segura@pg-abc123.railway.internal:5432/railway
NODE_ENV = production
PORT = 3000
ALLOWED_ORIGIN = https://gendago-backoffice.railway.app
SESSION_SECRET = 7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f
SECRET_KEY = a1b2c3d4e5f6789012345678901234567890abcd
DB_QUERY_TIMEOUT = 30000
DB_STATEMENT_TIMEOUT = 30000
```

### Webapp (exemplo completo):
```
DATABASE_URL = postgresql://postgres:minha_senha_segura@pg-abc123.railway.internal:5432/railway
NODE_ENV = production
PORT = 3000
ALLOWED_ORIGIN = https://gendago-webapp.railway.app
DB_QUERY_TIMEOUT = 30000
DB_STATEMENT_TIMEOUT = 30000
```

---

## ✅ Checklist de Configuração

```
[ ] API Service:
    [ ] DATABASE_URL (same as DB)
    [ ] NODE_ENV = production
    [ ] PORT = 3000
    [ ] ALLOWED_ORIGIN = seu-api-domain
    [ ] Build: npm install
    [ ] Start: npm run start:api

[ ] Backoffice Service:
    [ ] DATABASE_URL (same as DB)
    [ ] NODE_ENV = production
    [ ] PORT = 3000
    [ ] ALLOWED_ORIGIN = seu-backoffice-domain
    [ ] SESSION_SECRET = (gerado)
    [ ] SECRET_KEY = (gerado)
    [ ] Build: npm install
    [ ] Start: npm run start:backoffice

[ ] Webapp Service:
    [ ] DATABASE_URL (same as DB)
    [ ] NODE_ENV = production
    [ ] PORT = 3000
    [ ] ALLOWED_ORIGIN = seu-webapp-domain
    [ ] Build: npm install
    [ ] Start: npm run start:webapp
```

---

## 🚀 Próximo Passo

1. Vá no Railway
2. Para **cada serviço**, vá em **Variables**
3. Cole as variáveis de acordo com a tabela acima
4. Clique **Save**
5. Railway vai rebuild automaticamente

Pronto! 🎉

