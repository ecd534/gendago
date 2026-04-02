-- =============================================================================
-- GENDAGO - Dados Iniciais para Produção
-- =============================================================================
-- Execute DEPOIS de init-db.sql
-- Substitua os hashes Argon2 pelos gerados realmente
-- =============================================================================

-- ============================================================================
-- 1. INSERIR EMPRESA
-- ============================================================================
INSERT INTO empresas (nome, slug, email, telefone, endereco, cidade, estado)
VALUES (
  'Espaço Duda Duarte',
  'espacodudaduarte',
  'contato@espacoduda.com',
  '(11) 99999-9999',
  'Rua das Flores, 123',
  'São Paulo',
  'SP'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. INSERIR ADMIN USER
-- ============================================================================
-- Hash Argon2 para senha "admin123" - MUDE EM PRODUÇÃO!
-- Para gerar: node -e "const argon2 = require('argon2'); argon2.hash('sua_senha').then(h => console.log(h))"

INSERT INTO usuarios (empresa_id, email, senha, nome, permissoes, ativo)
SELECT 
  id,
  'admin@espacoduda.com',
  '$argon2id$v=19$m=19456,t=2,p=1$n9XUxDUFWQJQr+HkfTgwLw$FIXnjFg8w0Lq9Ek7mKiZD5HKr0R2CfZ9cRh7j3kJFvE',
  'Admin Master',
  '{"admin": true, "gerenciar_agendamentos": true, "gerenciar_clientes": true}'::jsonb,
  true
FROM empresas
WHERE slug = 'espacodudaduarte'
ON CONFLICT (email, empresa_id) DO NOTHING;

-- ============================================================================
-- 3. INSERIR CATEGORIAS
-- ============================================================================
INSERT INTO categorias (empresa_id, nome, descricao, cor, ordem, ativo)
SELECT 
  id,
  'Cabelo',
  'Serviços de corte, coloração e penteado',
  '#FF6B6B',
  1,
  true
FROM empresas WHERE slug = 'espacodudaduarte'
ON CONFLICT DO NOTHING;

INSERT INTO categorias (empresa_id, nome, descricao, cor, ordem, ativo)
SELECT 
  id,
  'Manicure/Pedicure',
  'Unhas e pés',
  '#FF69B4',
  2,
  true
FROM empresas WHERE slug = 'espacodudaduarte'
ON CONFLICT DO NOTHING;

INSERT INTO categorias (empresa_id, nome, descricao, cor, ordem, ativo)
SELECT 
  id,
  'Estética',
  'Tratamentos de pele',
  '#87CEEB',
  3,
  true
FROM empresas WHERE slug = 'espacodudaduarte'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. INSERIR SERVIÇOS
-- ============================================================================
INSERT INTO servicos (empresa_id, categoria_id, nome, descricao, preco, duracao_minutos, ativo)
SELECT 
  e.id,
  c.id,
  'Corte de Cabelo',
  'Corte clássico com modelagem',
  79.90,
  45,
  true
FROM empresas e
JOIN categorias c ON e.id = c.empresa_id AND c.nome = 'Cabelo'
WHERE e.slug = 'espacodudaduarte'
ON CONFLICT DO NOTHING;

INSERT INTO servicos (empresa_id, categoria_id, nome, descricao, preco, duracao_minutos, ativo)
SELECT 
  e.id,
  c.id,
  'Coloração',
  'Tingimento profissional',
  159.90,
  90,
  true
FROM empresas e
JOIN categorias c ON e.id = c.empresa_id AND c.nome = 'Cabelo'
WHERE e.slug = 'espacodudaduarte'
ON CONFLICT DO NOTHING;

INSERT INTO servicos (empresa_id, categoria_id, nome, descricao, preco, duracao_minutos, ativo)
SELECT 
  e.id,
  c.id,
  'Manicure',
  'Unhas bem cuidadas',
  49.90,
  45,
  true
FROM empresas e
JOIN categorias c ON e.id = c.empresa_id AND c.nome = 'Manicure/Pedicure'
WHERE e.slug = 'espacodudaduarte'
ON CONFLICT DO NOTHING;

INSERT INTO servicos (empresa_id, categoria_id, nome, descricao, preco, duracao_minutos, ativo)
SELECT 
  e.id,
  c.id,
  'Limpeza de Pele',
  'Limpeza profunda',
  129.90,
  60,
  true
FROM empresas e
JOIN categorias c ON e.id = c.empresa_id AND c.nome = 'Estética'
WHERE e.slug = 'espacodudaduarte'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. INSERIR PROFISSIONAIS
-- ============================================================================
INSERT INTO profissionais (empresa_id, nome, email, telefone, horario_inicio, horario_fim, bio, ativo)
SELECT 
  id,
  'Duda Duarte',
  'duda@espacoduda.com',
  '(11) 99999-0001',
  '09:00'::time,
  '18:00'::time,
  'Especialista em cabelo com experiência de 10 anos',
  true
FROM empresas
WHERE slug = 'espacodudaduarte'
ON CONFLICT DO NOTHING;

INSERT INTO profissionais (empresa_id, nome, email, telefone, horario_inicio, horario_fim, bio, ativo)
SELECT 
  id,
  'Marina Silva',
  'marina@espacoduda.com',
  '(11) 99999-0002',
  '10:00'::time,
  '19:00'::time,
  'Mestre em manicure',
  true
FROM empresas
WHERE slug = 'espacodudaduarte'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIM
-- ============================================================================
