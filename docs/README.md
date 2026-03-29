# FastAPI -> Express Migration Workspace

Este diretório centraliza os artefatos operacionais da migração do backend FastAPI para o backend Express local.

## Arquivos principais
- `openapi-baseline.json`: snapshot da OpenAPI atual (fonte de verdade de contrato).
- `endpoint-matrix.md`: matriz endpoint -> domínio -> status de migração.
- `phase0-checklist.md`: checklist de execução da fase inicial e smoke técnico.

## Como atualizar a matriz de endpoints
1. Atualize o baseline:
   - `Invoke-WebRequest -Uri http://127.0.0.1:8000/openapi.json -OutFile migration/openapi-baseline.json`
2. Regere a matriz:
   - `node migration/scripts/generate-endpoint-matrix.js`

## Regras operacionais
- Não migrar por tela; migrar por domínio de negócio.
- Cada endpoint migrado deve manter status HTTP e payload compatíveis com o baseline.
- Cada lote de endpoints precisa de smoke técnico antes de avançar para o próximo domínio.
