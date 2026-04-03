-- =============================================================================
-- GENDAGO - Inserir Master User
-- =============================================================================
-- Script para criar um usuário Master sem empresa
-- Email: raasjakarta@gmail.com
-- Senha: 123456 (Argon2 hashed)
-- =============================================================================

-- OPÇÃO 1: Inserir sem empresa (sistema)
INSERT INTO usuarios (id, empresa_id, email, senha, nome, permissoes, ativo)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM empresas LIMIT 1), -- Usa primeira empresa, ou NULL se preferir
  'raasjakarta@gmail.com',
  '$argon2id$v=19$m=19456,t=2,p=1$CJKWxvRf8qQ3G8k5nQ9Lqw$YZbk9D8dJ7xUaXqKpV5m8Q6sN3cL2bR9fX0mK8zZvEE',
  'Master Admin',
  '{"admin": true, "gerenciar_agendamentos": true, "gerenciar_clientes": true, "gerenciar_usuarios": true}'::jsonb,
  true
)
ON CONFLICT (email, empresa_id) DO NOTHING;

-- Verificar inserção
SELECT email, nome, ativo FROM usuarios WHERE email = 'raasjakarta@gmail.com';

-- =============================================================================
-- FIM
-- =============================================================================
