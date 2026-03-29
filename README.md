# Gendago

Aplicação Node.js (Express + EJS + PostgreSQL) para operação de agendamentos, com:
- Backoffice administrativo (`/admin`)
- Webapp público de agendamento (`/app/:slug`)
- API HTTP (`/usuarios`, `/empresas`, `/servicos`, etc.)
- Documentação Swagger (`/swagger`)

## Stack
- Node.js
- Express 5
- EJS
- PostgreSQL (`pg`)
- `express-session`
- `jsonwebtoken`
- `argon2`
- `swagger-ui-express`

## Estrutura principal

```text
src/
  app.js
  route/
    admin.js
    api.js
    webapp.js
    swagger.js
  backend/
    db/
    domains/
  service/
  views/
public/
docs/
  openapi-baseline.json
scripts/
  generate-openapi-from-route-api.js
```

## Pré-requisitos
- Node.js 18+
- PostgreSQL disponível

## Instalação

```bash
npm install
```

## Variáveis de ambiente
Copie o exemplo e preencha os valores locais:

```bash
cp .env.example .env
```

Variáveis da aplicação:

- `PORT` (default: `3000`)
- `SESSION_SECRET` (default de desenvolvimento em `src/app.js`)
- `NODE_ENV` (`development` ou `production`)

Banco de dados (`src/config/database.js`):
- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `5432`)
- `DB_NAME` (default: `postgres`)
- `DB_USER` (**obrigatória em produção**; fallback local: `postgres`)
- `DB_PASSWORD` (**obrigatória em produção**; fallback local: `1234`)
- `DB_SSLMODE` (`require` para SSL)

## Executando

Desenvolvimento (com reload):
```bash
npm run dev
```

Produção/local simples:
```bash
npm start
```

## Rotas principais
- Backoffice: `GET /admin`
- Login admin: `GET /admin/login`
- Webapp público: `GET /app/:slug`
- Swagger UI: `GET /swagger`
- OpenAPI JSON: `GET /swagger.json`

## API (visão geral)
As rotas da API principal estão em `src/route/api.js`.

Domínios disponíveis:
- Usuários
- Empresas
- Catálogo (categorias/serviços)
- Profissionais (escalas/bloqueios/disponibilidade)
- Clientes
- Agendamentos

## Contrato OpenAPI
O Swagger lê o contrato em:
- `docs/openapi-baseline.json`

Para regenerar o contrato automaticamente a partir de `src/route/api.js`:

```bash
node scripts/generate-openapi-from-route-api.js
```

## Notas
- O app usa sessão para o backoffice (`gendago.admin.sid`).
- O webapp público usa cookie `cliente_session`.
- Em produção, revise `SESSION_SECRET` e credenciais de banco antes de subir.
