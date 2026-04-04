-- =============================================================================
-- GENDAGO - Inserir/Atualizar Master User
-- =============================================================================
-- Script para criar ou atualizar um usuário Master
-- Email: raasjakarta@gmail.com
-- Senha: 123456 (Argon2 hashed)
-- =============================================================================

SET search_path TO gendago, public;

-- Deletar se já existe (para atualizar)
DELETE FROM usuarios WHERE email = 'raasjakarta@gmail.com';

-- Inserir novo usuário Master
INSERT INTO usuarios (id, empresa_id, email, senha, nome, nivel, permissoes, ativo)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM empresas LIMIT 1),
  'raasjakarta@gmail.com',
  '$argon2id$v=19$m=65536,t=3,p=4$Nh0Ftu/ivXC/Z9ciAYWqfw$d5VWGWIPzx0M81FhIubBeQxcUa5fUZsV688tOudoQkU',
  'Master',
  'master',
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

