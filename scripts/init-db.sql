-- ============================================================================
-- GENDAGO - Schema PostgreSQL (agendago)
-- ============================================================================
-- Este script cria todas as tabelas necessárias para a aplicação.
-- Execute UMA VEZ no banco de dados.
-- ============================================================================

-- ============================================================================
-- Extensões necessárias
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CLEANUP: Remover schema agendago se existir (para reset)
-- ============================================================================
DROP SCHEMA IF EXISTS agendago CASCADE;

-- ============================================================================
-- Criar schema agendago para dados da aplicação
-- ============================================================================
CREATE SCHEMA agendago;
SET search_path TO agendago, public;

-- ============================================================================
-- 1. EMPRESAS (Publishers/Salões)
-- ============================================================================
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  site VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE empresas IS 'Empresas/Salões que usam a plataforma';
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);
CREATE INDEX IF NOT EXISTS idx_empresas_ativo ON empresas(ativo);

-- ============================================================================
-- 2. USUÁRIOS (Admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  nivel VARCHAR(50) NOT NULL DEFAULT 'agente' CHECK (nivel IN ('master', 'admin', 'agente')),
  permissoes JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE usuarios IS 'Usuários administradores';
COMMENT ON COLUMN usuarios.senha IS 'Argon2 hashed password - NUNCA armazenar em texto plano';
COMMENT ON COLUMN usuarios.nivel IS 'Nível de acesso: master (super admin), admin (admin da empresa), agente (operador)';
COMMENT ON COLUMN usuarios.permissoes IS 'JSON com permissões do usuário';
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_empresa ON usuarios(email, empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- ============================================================================
-- 3. CATEGORIAS DE SERVIÇOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  cor VARCHAR(7),
  ordem INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE categorias IS 'Categorias de serviços (Cabelo, Manicure, etc)';
CREATE INDEX IF NOT EXISTS idx_categorias_empresa ON categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON categorias(ativo);

-- ============================================================================
-- 4. SERVIÇOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  duracao_minutos INT NOT NULL DEFAULT 60,
  fotos JSONB DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE servicos IS 'Serviços oferecidos pela empresa';
COMMENT ON COLUMN servicos.preco IS 'Preço em formato decimal (ex: 99.90)';
COMMENT ON COLUMN servicos.duracao_minutos IS 'Duração típica do serviço';
CREATE INDEX IF NOT EXISTS idx_servicos_empresa ON servicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo);

-- ============================================================================
-- 5. PROFISSIONAIS
-- ============================================================================
CREATE TABLE IF NOT EXISTS profissionais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  especialidades JSONB DEFAULT '[]',
  horario_inicio TIME,
  horario_fim TIME,
  dias_trabalho JSONB DEFAULT '["seg", "ter", "qua", "qui", "sex", "sab"]',
  foto_url VARCHAR(255),
  bio TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE profissionais IS 'Profissionais/Prestadores da empresa';
COMMENT ON COLUMN profissionais.especialidades IS 'Array de UUIDs de serviços';
COMMENT ON COLUMN profissionais.dias_trabalho IS 'Dias da semana que trabalha';
CREATE INDEX IF NOT EXISTS idx_profissionais_empresa ON profissionais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_ativo ON profissionais(ativo);

-- ============================================================================
-- 6. CLIENTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  data_nascimento DATE,
  genero VARCHAR(10),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  preferencias JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE clientes IS 'Clientes/Consumidores';
COMMENT ON COLUMN clientes.senha IS 'Argon2 hashed password';
COMMENT ON COLUMN clientes.preferencias IS 'Preferências do cliente (profissional favorito, etc)';
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email_empresa ON clientes(email, empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);

-- ============================================================================
-- 7. AGENDAMENTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE SET NULL,
  data_hora TIMESTAMP NOT NULL,
  duracao_minutos INT NOT NULL DEFAULT 60,
  preco DECIMAL(10, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'agendado' 
    CHECK (status IN ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'no_show')),
  motivo_cancelamento VARCHAR(255),
  notas TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL
);

COMMENT ON TABLE agendamentos IS 'Agendamentos/Appointments';
COMMENT ON COLUMN agendamentos.status IS 'Status do agendamento';
COMMENT ON COLUMN agendamentos.criado_por IS 'Usuario admin que criou (NULL se cliente criou via webapp)';
CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa ON agendamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional ON agendamentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);

-- ============================================================================
-- 8. PAGAMENTOS (Optional - Para futuro)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  valor DECIMAL(10, 2) NOT NULL,
  forma_pagamento VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'reembolsado')),
  referencia_externa VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE pagamentos IS 'Histórico de pagamentos';
CREATE INDEX IF NOT EXISTS idx_pagamentos_agendamento ON pagamentos(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa ON pagamentos(empresa_id);

-- ============================================================================
-- 9. ESCALAS (Horários de trabalho dos profissionais)
-- ============================================================================
CREATE TABLE IF NOT EXISTS escalas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  dia_semana VARCHAR(10) NOT NULL CHECK (dia_semana IN ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom')),
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  intervalo_minutos INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE escalas IS 'Escalas de trabalho dos profissionais por dia da semana';
CREATE INDEX IF NOT EXISTS idx_escalas_profissional ON escalas(profissional_id);
CREATE INDEX IF NOT EXISTS idx_escalas_empresa ON escalas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_escalas_dia ON escalas(dia_semana);

-- ============================================================================
-- 10. BLOQUEIOS (Indisponibilidades dos profissionais)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bloqueios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  motivo VARCHAR(255),
  data_hora_inicio TIMESTAMP NOT NULL,
  data_hora_fim TIMESTAMP NOT NULL,
  recurren_cia VARCHAR(50) DEFAULT 'nenhuma' CHECK (recurren_cia IN ('nenhuma', 'diaria', 'semanal', 'mensal')),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE bloqueios IS 'Períodos em que profissionais não estão disponíveis (férias, atestado, etc)';
CREATE INDEX IF NOT EXISTS idx_bloqueios_profissional ON bloqueios(profissional_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_empresa ON bloqueios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_data ON bloqueios(data_hora_inicio, data_hora_fim);

-- ============================================================================
-- 11. PROFISSIONAL_SERVICO (Relação muitos-para-muitos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profissional_servico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  preco_customizado DECIMAL(10, 2),
  duracao_customizada INT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE profissional_servico IS 'Relacionamento entre profissionais e serviços que oferecem';
COMMENT ON COLUMN profissional_servico.preco_customizado IS 'Preço específico (NULL = usar preço padrão do serviço)';
COMMENT ON COLUMN profissional_servico.duracao_customizada IS 'Duração específica (NULL = usar duração padrão)';
CREATE UNIQUE INDEX IF NOT EXISTS idx_profissional_servico_unique ON profissional_servico(profissional_id, servico_id);
CREATE INDEX IF NOT EXISTS idx_profissional_servico_empresa ON profissional_servico(empresa_id);

-- ============================================================================
-- 12. LOGS DE AUDITORIA (Segurança)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  acao VARCHAR(100) NOT NULL,
  tabela_afetada VARCHAR(100),
  registro_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  detalhes JSONB,
  status VARCHAR(20) DEFAULT 'sucesso' CHECK (status IN ('sucesso', 'erro')),
  criado_em TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Log de auditoria para segurança e compliance';
CREATE INDEX IF NOT EXISTS idx_audit_empresa ON audit_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_audit_acao ON audit_logs(acao);
CREATE INDEX IF NOT EXISTS idx_audit_data ON audit_logs(criado_em);

-- ============================================================================
-- VIEWS ÚTEIS PARA CONSULTAS
-- ============================================================================

CREATE OR REPLACE VIEW v_agendamentos_proximos AS
SELECT 
  a.id,
  a.data_hora,
  c.nome as cliente,
  c.telefone,
  s.nome as servico,
  p.nome as profissional,
  a.status
FROM agendamentos a
JOIN clientes c ON a.cliente_id = c.id
JOIN servicos s ON a.servico_id = s.id
LEFT JOIN profissionais p ON a.profissional_id = p.id
WHERE a.data_hora >= NOW()
  AND a.status IN ('agendado', 'confirmado')
ORDER BY a.data_hora ASC;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
