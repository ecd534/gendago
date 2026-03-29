# Endpoint Migration Matrix

- Generated at: 2026-03-28T15:51:19.891Z
- Source: migration/openapi-baseline.json
- Total endpoints: 49

| Domain | Method | Path | Summary | OperationId | Auth | Status | Node Handler | Tags |
|---|---|---|---|---|---|---|---|---|
| agendamentos | GET | /agendamentos/ | Listar Agendamentos | listar_agendamentos_agendamentos__get | sim | parcial | src/route/api.js -> GET /agendamentos | Agendamentos |
| agendamentos | POST | /agendamentos/ | Criar Agendamento | criar_agendamento_agendamentos__post | sim | parcial | src/route/api.js -> POST /agendamentos | Agendamentos |
| agendamentos | PATCH | /agendamentos/{agendamento_id}/status | Atualizar Status Agendamento | atualizar_status_agendamento_agendamentos__agendamento_id__status_patch | sim | parcial | src/route/api.js -> PATCH /agendamentos/:agendamento_id/status | Agendamentos |
| agendamentos | GET | /agendamentos/detalhado/{empresa_id} | Listar Agendamentos Detalhado | listar_agendamentos_detalhado_agendamentos_detalhado__empresa_id__get | sim | parcial | src/route/api.js -> GET /agendamentos/detalhado/:empresa_id | Agendamentos |
| catalogo | POST | /categorias/ | Criar Categoria | criar_categoria_categorias__post | sim | parcial | src/route/api.js -> POST /categorias | Configurações |
| catalogo | PATCH | /categorias/{categoria_id} | Atualizar Categoria | atualizar_categoria_categorias__categoria_id__patch | sim | parcial | src/route/api.js -> PATCH /categorias/:categoria_id | Configurações |
| catalogo | GET | /categorias/{empresa_id} | Listar Categorias | listar_categorias_categorias__empresa_id__get | sim | parcial | src/route/api.js -> GET /categorias/:empresa_id | Configurações |
| catalogo | POST | /servicos/ | Criar Servico | criar_servico_servicos__post | sim | parcial | src/route/api.js -> POST /servicos | Configurações |
| catalogo | GET | /servicos/{empresa_id} | Listar Servicos | listar_servicos_servicos__empresa_id__get | sim | parcial | src/route/api.js -> GET /servicos/:empresa_id | Configurações |
| catalogo | GET | /servicos/categoria/{categoria_id} | Listar Servicos Por Categoria | listar_servicos_por_categoria_servicos_categoria__categoria_id__get | sim | parcial | src/route/api.js -> GET /servicos/categoria/:categoria_id | Configurações |
| catalogo | GET | /servicos/detalhe/{servico_id} | Obter Servico | obter_servico_servicos_detalhe__servico_id__get | sim | parcial | src/route/api.js -> GET /servicos/detalhe/:servico_id | Configurações |
| catalogo | GET | /servicos/empresa/{empresa_id} | Listar Servicos Por Empresa | listar_servicos_por_empresa_servicos_empresa__empresa_id__get | sim | parcial | src/route/api.js -> GET /servicos/empresa/:empresa_id | Configurações |
| clientes | GET | /clientes/ | Listar Clientes | listar_clientes_clientes__get | sim | parcial | src/route/api.js -> GET /clientes | Clientes |
| clientes | GET | /clientes/{cliente_id} | Listar Cliente | listar_cliente_clientes__cliente_id__get | sim | parcial | src/route/api.js -> GET /clientes/:cliente_id | Clientes |
| clientes | POST | /clientes/clientes/ | Criar Cliente | criar_cliente_clientes_clientes__post | sim | parcial | src/route/api.js -> POST /clientes | Clientes |
| clientes | PATCH | /clientes/clientes/{cliente_id} | Atualizar Cliente | atualizar_cliente_clientes_clientes__cliente_id__patch | sim | parcial | src/route/api.js -> PATCH /clientes/:cliente_id | Clientes |
| clientes | GET | /clientes/telefone/{telefone} | Listar Clientes Por Telefone | listar_clientes_por_telefone_clientes_telefone__telefone__get | sim | parcial | src/route/api.js -> GET /clientes/telefone/:telefone | Clientes |
| empresas | GET | /empresas/ | Listar Empresas | listar_empresas_empresas__get | nao | parcial | src/route/api.js -> GET /empresas | Empresas |
| empresas | POST | /empresas/ | Criar Empresa | criar_empresa_empresas__post | nao | parcial | src/route/api.js -> POST /empresas | Empresas |
| empresas | GET | /empresas/{empresa_id} | Listar Empresa | listar_empresa_empresas__empresa_id__get | nao | parcial | src/route/api.js -> GET /empresas/:empresa_id | Empresas |
| empresas | PATCH | /empresas/{empresa_id} | Atualizar Status Empresa | atualizar_status_empresa_empresas__empresa_id__patch | nao | parcial | src/route/api.js -> PATCH /empresas/:empresa_id | Empresas |
| outros | GET | /health | Health Check | health_check_health_get | nao | pendente |  |  |
| pagamentos | POST | /pagamentos/ | Criar Pagamento | criar_pagamento_pagamentos__post | sim | pendente |  | Pagamentos |
| pagamentos | GET | /pagamentos/{agendamento_id} | Get Pagamento | get_pagamento_pagamentos__agendamento_id__get | sim | pendente |  | Pagamentos |
| pagamentos | PATCH | /pagamentos/{pagamento_id}/status | Atualizar Status Pagamento | atualizar_status_pagamento_pagamentos__pagamento_id__status_patch | sim | pendente |  | Pagamentos |
| pagamentos | GET | /pagamentos/empresa/{empresa_id} | Listar Pagamentos Empresa | listar_pagamentos_empresa_pagamentos_empresa__empresa_id__get | sim | pendente |  | Pagamentos |
| pagamentos | GET | /pagamentos/formas/ | Listar Formas Pagamento | listar_formas_pagamento_pagamentos_formas__get | nao | pendente |  | Pagamentos |
| profissionais | POST | /bloqueios/ | Criar Bloqueio | criar_bloqueio_bloqueios__post | sim | parcial | src/route/api.js -> POST /bloqueios | Profissionais e Configurações |
| profissionais | GET | /bloqueios/{profissional_id} | Listar Bloqueios | listar_bloqueios_bloqueios__profissional_id__get | sim | parcial | src/route/api.js -> GET /bloqueios/:profissional_id | Profissionais e Configurações |
| profissionais | GET | /disponibilidade/ | Consultar Disponibilidade | consultar_disponibilidade_disponibilidade__get | sim | parcial | src/route/api.js -> GET /disponibilidade | Profissionais e Configurações |
| profissionais | POST | /escalas/ | Criar Escala | criar_escala_escalas__post | sim | parcial | src/route/api.js -> POST /escalas | Profissionais e Configurações |
| profissionais | GET | /escalas/{profissional_id} | Listar Escalas Profissional | listar_escalas_profissional_escalas__profissional_id__get | sim | parcial | src/route/api.js -> GET /escalas/:profissional_id | Profissionais e Configurações |
| profissionais | POST | /profissionais/ | Criar Profissional | criar_profissional_profissionais__post | sim | parcial | src/route/api.js -> POST /profissionais | Profissionais e Configurações |
| profissionais | GET | /profissionais/{empresa_id} | Listar Profissionais Por Empresa | listar_profissionais_por_empresa_profissionais__empresa_id__get | sim | parcial | src/route/api.js -> GET /profissionais/:empresa_id | Profissionais e Configurações |
| public-store | POST | /api/v1/public/agendamentos/confirmar | Confirmar Agendamento Publico | confirmar_agendamento_publico_api_v1_public_agendamentos_confirmar_post | nao | pendente |  | Agendamentos, Public |
| public-store | GET | /api/v1/public/agendamentos/meus | Listar Meus Agendamentos Publico | listar_meus_agendamentos_publico_api_v1_public_agendamentos_meus_get | nao | pendente |  | Agendamentos, Public |
| public-store | POST | /api/v1/public/clientes/cadastro | Cadastro Cliente Publico | cadastro_cliente_publico_api_v1_public_clientes_cadastro_post | nao | pendente |  | Public |
| public-store | GET | /api/v1/public/clientes/health | Healthcheck Cliente Publico | healthcheck_cliente_publico_api_v1_public_clientes_health_get | nao | pendente |  | Public |
| public-store | POST | /api/v1/public/clientes/login | Login Cliente Publico | login_cliente_publico_api_v1_public_clientes_login_post | nao | pendente |  | Public |
| public-store | POST | /api/v1/public/clientes/logout | Logout Cliente Publico | logout_cliente_publico_api_v1_public_clientes_logout_post | nao | pendente |  | Public |
| public-store | GET | /api/v1/public/empresas/busca | Buscar Empresas | buscar_empresas_api_v1_public_empresas_busca_get | nao | pendente |  | Public |
| public-store | GET | /api/v1/public/profissional/{profissional_id}/disponibilidade | Get Disponibilidade Profissional | get_disponibilidade_profissional_api_v1_public_profissional__profissional_id__disponibilidade_get | nao | pendente |  | Public |
| public-store | GET | /api/v1/public/servico/{servico_id}/profissionais | Get Profissionais Servico | get_profissionais_servico_api_v1_public_servico__servico_id__profissionais_get | nao | pendente |  | Public |
| public-store | GET | /api/v1/public/vitrine/{empresa_id} | Get Vitrine | get_vitrine_api_v1_public_vitrine__empresa_id__get | nao | pendente |  | Public |
| public-store | GET | /store/{empresa_slug} | Landing Page | landing_page_store__empresa_slug__get | nao | pendente |  | Public |
| usuarios | GET | /usuarios/ | Listar Usuarios | listar_usuarios_usuarios__get | nao | parcial | src/route/api.js -> GET /usuarios | Usuários |
| usuarios | POST | /usuarios/ | Criar Usuario | criar_usuario_usuarios__post | nao | parcial | src/route/api.js -> POST /usuarios | Usuários |
| usuarios | PUT | /usuarios/{user_id} | Atualizar Usuario | atualizar_usuario_usuarios__user_id__put | nao | parcial | src/route/api.js -> PUT /usuarios/:user_id | Usuários |
| usuarios | POST | /usuarios/login | Login | login_usuarios_login_post | nao | parcial | src/route/api.js -> POST /usuarios/login | Usuários |
