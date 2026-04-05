# Deploy — Gendago em Produção (Vercel + Neon)

Guia completo para colocar o Gendago em produção na Vercel com banco PostgreSQL no Neon.
Cada passo está marcado com **[Dev]** (executado na máquina local) ou **[Prod]** (executado na nuvem/painel).

---

## 1. Mudanças de código aplicadas [Dev]

As alterações abaixo já estão no repositório e são necessárias para funcionar na Vercel.

### 1.1 — `scripts/run-migrations.js`
- **[Dev/Prod]** Cria o banco automaticamente (`CREATE DATABASE`) antes de aplicar as migrations
- **[Dev]** Lê credenciais do `.env` (variáveis `DB_*`)
- **[Prod]** Usa `DATABASE_URL` (Neon direct connection string)
- Trata `42P04` (banco já existe → continua) e `42501` (sem privilégio → avisa e continua)
- Ordem das migrations não muda: `init-db.sql → insert-initial-data.sql → insert-master-user.sql`

### 1.2 — `scripts/init-db.sql`
- **[Dev/Prod]** Tabela `session` adicionada ao final
- Requerida pelo `connect-pg-simple` para persistir sessões HTTP no PostgreSQL
- Fica dentro do schema `gendago` (herdado do `SET search_path` no topo do arquivo)

### 1.3 — `package.json`
- **[Dev/Prod]** Dependência `connect-pg-simple` adicionada

### 1.4 — `src/app.js`
- **[Prod]** `connect-pg-simple` injetado no `express-session` como store persistente
  - O store em memória padrão não sobrevive entre invocações serverless
  - **[Dev]** Funciona igualmente com o banco local (mesmo pool)
- **[Prod]** `app.listen` condicional + `module.exports = app`
  - Já estava aplicado; o `@vercel/node` faz `require('./src/app.js')` e usa o export como handler

### 1.5 — `vercel.json` (novo arquivo na raiz)
- **[Prod]** Instrui a Vercel a rotear todo tráfego pelo Express
- Arquivos estáticos servidos via `express.static` (já configurado no `app.js`)

### 1.6 — `.env.example`
- **[Dev/Prod]** Documentado com seções separadas Dev e Prod
- Inclui `DATABASE_URL`, `ALLOWED_ORIGIN`, `NODE_ENV=production`, `SESSION_SECRET`

---

## 2. Banco de dados — Neon.tech [Prod]

O banco de produção fica no Neon (parceiro oficial da Vercel, free tier, SSL incluso, pooling nativo).

### 2.1 — Criar projeto [Prod]
1. Acessar <https://neon.tech> → **New Project**
2. Nome: `gendago` | Region: mais próxima dos usuários (ex: `us-east-1`)
3. Neon entrega dois connection strings:
   - **Direct** (`ep-xxx.neon.tech`) — usar para rodar migrations
   - **Pooled** (`ep-xxx-pooler.neon.tech`) — usar no app em produção

### 2.2 — Rodar migrations contra o Neon [Dev]

Executar da máquina local usando o **direct connection string** (não o pooled — o PgBouncer do pooler não suporta DDL):

```bash
# [Dev] substitua pela string real do Neon (direct)
DATABASE_URL="postgres://user:pass@ep-xxx-direct.neon.tech/neondb?sslmode=require" \
  node scripts/run-migrations.js
```

O script cria o banco `gendago`, aplica o schema, insere dados iniciais e cria o usuário master.

### 2.3 — Verificar tabelas [Dev]

```bash
psql "postgres://user:pass@ep-xxx-direct.neon.tech/neondb?sslmode=require" \
  -c "\dt gendago.*"
```

Deve listar as 12 tabelas transacionais + a tabela `session`.

---

## 3. Projeto na Vercel — GitHub [Prod]

### 3.1 — Importar repositório [Prod]
1. Acessar <https://vercel.com/new>
2. **Import Git Repository** → selecionar `ecd534/gendago`
3. Configurações:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (padrão)
   - **Build Command**: *(deixar vazio)*
   - **Output Directory**: *(deixar vazio)*
   - **Install Command**: `npm install`

### 3.2 — Variáveis de ambiente [Prod]

Vercel → Project → **Settings → Environment Variables** → adicionar para **Production**:

| Variável         | Valor                                               |
|------------------|-----------------------------------------------------|
| `NODE_ENV`       | `production`                                        |
| `DATABASE_URL`   | connection string **pooled** do Neon                |
| `SESSION_SECRET` | string aleatória forte (mínimo 32 caracteres)       |
| `ALLOWED_ORIGIN` | `https://seu-projeto.vercel.app` (atualizar após primeiro deploy) |

> `PORT` não é necessário — a Vercel injeta automaticamente.

### 3.3 — Primeiro deploy [Prod]

Após configurar as variáveis, clicar **Deploy** no dashboard.
A partir deste momento, cada `git push origin master` dispara deploy automático.

---

## 4. Validação pós-deploy [Prod]

Confirmar cada item na URL da Vercel após o primeiro deploy:

| Teste                                      | Resultado esperado                                  |
|--------------------------------------------|-----------------------------------------------------|
| `GET /`                                    | Redireciona para `/admin`                           |
| `GET /admin/login`                         | Formulário de login renderiza sem erro              |
| Login com usuário master                   | Sessão persiste entre páginas (valida session store PG) |
| Logout + re-login                          | Sem bleeding de sessão                              |
| `GET /app/:slug` de empresa válida         | Webapp pública renderiza                            |
| `GET /pagina-inexistente`                  | Renderiza error page 404 (não crash)                |
| `GET /styles/admin.css`                    | HTTP 200 (estáticos servidos)                       |
| `GET /images/error.jpg`                    | HTTP 200                                            |
| `GET /api-docs`                            | Swagger UI carrega                                  |

---

## 5. Ordem de execução recomendada

```
[Dev]  npm install                          — instalar connect-pg-simple
[Dev]  npm run dev → fazer login            — confirmar que sessão funciona localmente
[Dev]  node scripts/run-migrations.js       — testar migration local primeiro (opcional)
[Prod] Criar projeto no Neon (passo 2.1)
[Dev]  Rodar migrations contra o Neon (passo 2.2)
[Dev]  Verificar tabelas no Neon (passo 2.3)
[Prod] Criar projeto na Vercel + env vars (passos 3.1 e 3.2)
[Prod] Primeiro deploy
[Prod] Validação completa (passo 4)
[Prod] Atualizar ALLOWED_ORIGIN na Vercel com a URL final gerada
```

---

## Referências rápidas

- **Neon console**: <https://console.neon.tech>
- **Vercel dashboard**: <https://vercel.com/dashboard>
- **Repositório**: `https://github.com/ecd534/gendago`
- **connect-pg-simple docs**: <https://github.com/voxpelli/node-connect-pg-simple>
