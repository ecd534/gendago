# Backend Local (Express)

Estrutura base para substituir gradualmente o backend FastAPI por domínio.

## Objetivo
Migrar regras de negócio e acesso a dados para execução local no projeto Node, mantendo compatibilidade de contrato com a OpenAPI baseline durante o cutover.

## Domínios previstos
- `auth`
- `usuarios`
- `empresas`
- `catalogo`
- `profissionais`
- `clientes`
- `agendamentos`
- `pagamentos`

## Estratégia
Cada domínio terá:
1. camada de repositório (dados)
2. camada de serviço (regras)
3. camada de handler/route (contrato HTTP)

Até a migração completa, os adapters atuais em `src/service/admin*.js` e `src/service/publicStore.js` continuam funcionando como fachada da UI.
