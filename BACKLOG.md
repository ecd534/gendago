# Backlog

## Prioridade alta

- Mapear todos os endpoints da FastAPI ainda usados pelo admin e documentar contratos, permissões e payloads.
- Adicionar suporte real a ativo/inativo no backend de usuarios e bloquear login de usuarios inativos.
- Reproduzir no Express as regras de autenticacao, RBAC e modulos criticos antes do desligamento da API Python.
- Criar no backend um endpoint de atualizacao completa da empresa para liberar edicao real de nome, slug, telefone, e-mail e endereco.
- Ligar o modulo de usuarios a lista real de empresas, substituindo o campo manual de empresa_id por selecao no formulario.

## Migracao FastAPI -> Express

- Portar modulo de usuarios para Express com paridade funcional e validacoes equivalentes.
- Portar modulo de empresas para Express com criacao, consulta, edicao completa e troca de status.
- Portar os demais modulos administrativos seguindo a ordem de impacto no negocio.
- Desligar a API Python e ligar o Express somente depois da validacao de paridade entre modulos e regras.

## Admin e backoffice

- Implementar Servicos e Categorias no menu administrativo.
- Implementar Profissionais + Config no menu administrativo.
- Implementar Financeiro no menu administrativo.
- Implementar Gerenciar Agendamentos no menu administrativo.
- Implementar Relatorios no menu administrativo.

## UX e integracoes

- Substituir campos tecnicos por seletores e relacoes reais sempre que houver dados mestres disponiveis na API.
- Validar responsividade dos novos modulos seguindo o padrao mobile aplicado em usuarios e empresas.
- Adicionar mensagens de erro e sucesso consistentes para todas as integracoes com a API externa.