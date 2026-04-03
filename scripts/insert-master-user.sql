-- =============================================================================
-- GENDAGO - Inserir/Atualizar Master User
-- =============================================================================
-- Script para criar ou atualizar um usuário Master
-- Email: raasjakarta@gmail.com
-- Senha: 123456 (Argon2 hashed)
-- =============================================================================

-- Deletar se já existe (para atualizar)
DELETE FROM usuarios WHERE email = 'raasjakarta@gmail.com';

-- Inserir novo usuário Master
INSERT INTO usuarios (id, empresa_id, email, senha, nome, permissoes, ativo)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM empresas LIMIT 1),
  'raasjakarta@gmail.com',
  '$argon2id$v=19$m=19456,t=2,p=1$CJKWxvRf8qQ3G8k5nQ9Lqw$YZbk9D8dJ7xUaXqKpV5m8Q6sN3cL2bR9fX0mK8zZvEE',
  'Master Admin',
  '{"admin": true, "gerenciar_agendamentos": true, "gerenciar_clientes": true, "gerenciar_usuarios": true}'::jsonb,
  true
);

-- Verificar inserção
SELECT email, nome, ativo FROM usuarios WHERE email = 'raasjakarta@gmail.com';

-- =============================================================================
-- INSTRUÇÕES:
-- 1. Se a senha não funcionar, gere um novo hash:
--    node -e "const argon2 = require('argon2'); argon2.hash('123456').then(h => console.log(h))"
-- 
-- 2. Substitua o hash acima pelo novo hash gerado
-- 
-- 3. Execute este script novamente no DBeaver
-- =============================================================================

