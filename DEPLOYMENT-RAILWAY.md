# 🚀 Guia Completo: Deploy em Railway

## PRÉ-REQUISITOS

- [x] Conta Railway (https://railway.app)
- [x] Repositório GitHub conectado
- [x] Git push realizado (main branch)

---

## PASSO 1: Preparar Repositório

```bash
git status
git add -A
git commit -m "chore: add production deployment files"
git push origin main
```

---

## PASSO 2: Criar Projeto Railway

1. Acessar https://railway.app
2. Nova project → "Blank Project"
3. Nomear: "Gendago"

---

## PASSO 3: Adicionar PostgreSQL

1. No projeto Railway → "+Add"
2. Selecionar "PostgreSQL"
3. Aguardar inicializar
4. Copiar a `DATABASE_URL` da aba "Connect"

**Exemplo:**
```
postgresql://postgres:xxxxx@railway.railway.internal:5432/railway
```

---

## PASSO 4: Conectar GitHub (Node.js)

1. "+Add" → "GitHub Repo"
2. Selecionar seu repositório `gendago`
3. Branch: `main`

### Build Settings
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Environment Variables

Na seção "Variables" do Node.js Service, adicione EXATAMENTE:

```env
# Do PostgreSQL do Railway (extrair de DATABASE_URL)
DB_HOST=railway.railway.internal
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=xxxxx_copiar_da_DATABASE_URL
DB_SSLMODE=require

# Gerar novos secrets (NUNCA reutilizar dev!)
SESSION_SECRET=xxxxxxxxxxx_openssl_rand_base64_32
SECRET_KEY=xxxxxxxxxxx_openssl_rand_base64_32

# Seu domínio
ALLOWED_ORIGIN=https://seu-app.up.railway.app

# Modo produção
NODE_ENV=production
PORT=3000
```

**Como gerar SESSION_SECRET e SECRET_KEY:**
```bash
# Linux/Mac:
openssl rand -base64 32

# Windows PowerShell:
[System.Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}) -as [byte[]]) | Select-Object -First 1
```

---

## PASSO 5: Deploy Automático

1. Railway detecta o push no main
2. Inicia build automático
3. Observar logs → Deve dizer: `Servidor Node.js ativo na porta 3000` ✓

---

## PASSO 6: Executar Scripts SQL

### Opção 1: Via Railway Shell (Recomendado)

```bash
# Instalar railway CLI local:
npm install -g @railway/cli

# Login
railway login

# Link ao projeto
railway link

# Executar init-db.sql
railway run npm run seed:db
```

### Opção 2: Via psql Local

```bash
# Extrair credentials de DATABASE_URL do Railway
psql postgresql://postgres:xxxxx@railway.railway.internal:5432/railway < scripts/init-db.sql
psql postgresql://postgres:xxxxx@railway.railway.internal:5432/railway < scripts/insert-initial-data.sql
```

### Opção 3: Via Interface Web Railway

1. Railway → PostgreSQL Service → "Connect"
2. Copiar comando `psql`
3. Colar em terminal e executar:
   ```sql
   \i scripts/init-db.sql
   \i scripts/insert-initial-data.sql
   ```

**Verificar Dados:**
```sql
SELECT * FROM empresas;
SELECT * FROM usuarios;
SELECT * FROM servicos;
```

---

## PASSO 7: Testes PÓS-DEPLOYMENT

### 7.1 Health Check
```bash
curl https://seu-app.up.railway.app/
# Deve redirecionar para /admin
```

### 7.2 Testar Admin Login
```
1. Acessar: https://seu-app.up.railway.app/admin
2. Email: admin@espacoduda.com
3. Senha: admin123
4. Deve logar no backoffice ✓
```

### 7.3 Testar Webapp
```
1. Acessar: https://seu-app.up.railway.app/app/espacodudaduarte
2. Deve carregar a vitrine pública ✓
3. Testar cadastro de cliente
4. Testar agendamento
```

### 7.4 Verificar Headers de Segurança
```bash
curl -I https://seu-app.up.railway.app/admin | grep -E "X-Frame|Strict-Transport|Content-Security"
# Deve mostrar headers de segurança ✓
```

---

## PASSO 8: Domínio Customizado (Opcional)

1. Railway → Project Settings → Domains
2. Adicionar domínio customizado
3. CNAME apontar para: `seu-app.up.railway.app`
4. Atualizar no Railway Settings:
   ```env
   ALLOWED_ORIGIN=https://seu-dominio-real.com
   ```

---

## TROUBLESHOOTING

### ❌ App não inicia
```
Error: SESSION_SECRET environment variable is required in production
```
→ Adicionar SESSION_SECRET nas variáveis do Railway

### ❌ Erro de conexão banco
```
Error: ECONNREFUSED 127.0.0.1:5432
```
→ Verificar `DB_HOST=railway.railway.internal` (não localhost)

### ❌ Erro 401 na API
```
Unauthorized
```
→ JWT token expirado ou SECRET_KEY incorreto

### ❌ Tables não foram criadas
```
relation "usuarios" does not exist
```
→ Executar `npm run seed:db` novamente

---

## ✅ Checklist Final

- [ ] PostgreSQL criado em Railway
- [ ] Node.js conectado ao repositório main
- [ ] Environment variables configuradas
- [ ] App iniciando sem erros (logs dizem "Servidor ativo")
- [ ] Scripts SQL executados (seed:db rodou com sucesso)
- [ ] Admin login funciona
- [ ] Webapp carrega
- [ ] HTTPS funcionando (Railway fornece automático)

---

## PRÓXIMOS PASSOS

- [ ] Configurar backups automáticos PostgreSQL
- [ ] Monitoramento de erros (Sentry)
- [ ] Email notifications (SendGrid)
- [ ] Logs centralizados
- [ ] Rate limiting by Cloudflare

---

**Deploy Completo! 🎉**
