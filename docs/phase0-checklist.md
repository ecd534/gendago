# Phase 0 / 1 Checklist (Execution)

## 0) Baseline e Inventário
- [x] Capturar OpenAPI baseline (`migration/openapi-baseline.json`)
- [x] Gerar matriz de endpoints (`migration/endpoint-matrix.md`)
- [x] Importar/ligar código-fonte FastAPI no workspace para leitura de regras
- [x] Mapear módulos FastAPI -> domínios Node (auth, admin, agendamento, pagamento)
- [ ] Identificar regras críticas não explícitas na OpenAPI (validações, conflitos, permissões)

## 1) Dados e Infra
- [ ] Documentar schema PostgreSQL atual (tabelas, índices, constraints)
- [ ] Definir ORM local (Prisma/TypeORM) e padrão de migrations
- [ ] Criar camada de conexão local no Express
- [ ] Definir estratégia de transação para agendamento e pagamento
- [ ] Definir modelo final de autenticação/sessão local

## 2) Migração por domínio (ordem)
1. Auth + RBAC
2. Usuários/Empresas
3. Catálogo (categorias/serviços)
4. Profissionais + disponibilidade
5. Clientes
6. Agendamentos
7. Pagamentos

## Smoke técnico mínimo por lote
- [ ] Login válido/inválido
- [ ] Escopo por empresa (`master/admin/agente`)
- [ ] CRUD principal do domínio
- [ ] Erros 422 e mensagens de validação
- [ ] Regressão na vitrine pública (`/app/:slug`)

## Critério para avançar ao UAT
- [ ] Endpoints do domínio marcados como `migrado` na matriz
- [ ] Smoke técnico do domínio aprovado
- [ ] Sem quebra de payload consumido pelas views Node

## Progresso atual (implementação iniciada)
- [x] Repositório FastAPI clonado em `migration/venus-fastapi`
- [x] Primeiro lote local implementado (`/usuarios/login`, `/usuarios` GET/POST/PUT)
- [x] Smoke local do lote 1 aprovado (login com token + listagem de usuários)
- [x] RBAC local aplicado nos endpoints `/*` (JWT + nível)
- [x] Lote 2 parcial implementado (`/empresas` GET/POST/GET:id/PATCH:status)
- [x] Lote 3 parcial implementado (`/categorias` GET/POST/PATCH e `/servicos` GET/POST/GET detalhe)
- [x] Adapters admin de catálogo (`adminCategories`/`adminServices`) preferem backend local
- [x] Lote 4 parcial implementado (`/profissionais`, `/escalas`, `/bloqueios`, `/disponibilidade`)
- [x] Adapter admin de profissionais e disponibilidade pública preferem backend local
- [x] Lote 5 parcial implementado (`/clientes` GET/POST/GET:id/PATCH e busca por telefone)
- [x] Adapter admin de clientes prefere backend local
- [x] Lote 6 parcial implementado (`/agendamentos` GET/POST/PATCH:status/GET detalhado)
