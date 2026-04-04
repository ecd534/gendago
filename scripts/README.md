# 🗄️ Scripts de Banco de Dados - GendaGO

## Descrição

Esta pasta contém os scripts necessários para **criar e inicializar** o banco de dados do GendaGO.

## 📂 Arquivos

| Arquivo | Propósito |
|---------|-----------|
| `run-migrations.js` | **Execute este arquivo** - Executa todos os scripts SQL na ordem correta |
| `init-db.sql` | Cria o schema `agendago` e todas as 12 tabelas |
| `insert-initial-data.sql` | Insere dados iniciais (empresa, categorias, serviços) |
| `insert-master-user.sql` | Cria o usuário master para login |

## 🚀 Como Usar

### Pré-requisitos
- PostgreSQL instalado e rodando na porta 5432
- Arquivo `.env` configurado com as credenciais do banco

### Execução

```bash
cd scripts
node run-migrations.js
```

### ✅ Resultado esperado
```
🚀 Iniciando migrações de banco de dados...

📂 Executando: init-db.sql
✅ init-db.sql concluído com sucesso

📂 Executando: insert-initial-data.sql
✅ insert-initial-data.sql concluído com sucesso

📂 Executando: insert-master-user.sql
✅ insert-master-user.sql concluído com sucesso

✨ Todas as migrações foram executadas com sucesso!

📋 Tabelas criadas no schema agendago (13 total):
   - agendamentos
   - audit_logs
   - bloqueios
   - categorias
   - clientes
   - empresas
   - escalas
   - pagamentos
   - profissionais
   - profissional_servico
   - servicos
   - usuarios
   - v_agendamentos_proximos
```

## 🔐 Usuários Criados

### Master User
- **Email:** `raasjakarta@gmail.com`
- **Senha:** `123456`
- **Nível:** master
- **Permissões:** admin total

### Admin User
- **Email:** `admin@espacoflaviaduarte.com`
- **Senha:** `admin123` (hash Argon2)
- **Nível:** master
- **Empresa:** Espaço Flavia Duarte

## 📊 Estrutura do Banco

### Schema
- **Nome:** `agendago`

### Tabelas (12)
1. **empresas** - Empresas/Salões
2. **usuarios** - Usuários admin
3. **categorias** - Categorias de serviços
4. **servicos** - Serviços oferecidos
5. **profissionais** - Profissionais/Prestadores
6. **clientes** - Clientes/Consumidores
7. **agendamentos** - Agendamentos/Appointments
8. **escalas** - Horários de trabalho
9. **bloqueios** - Indisponibilidades
10. **profissional_servico** - Relação profissional-serviço
11. **pagamentos** - Histórico de pagamentos
12. **audit_logs** - Logs de auditoria

### Views (1)
- **v_agendamentos_proximos** - Agendamentos futuros confirmados

## 🔄 Fazer Reset do Banco

Para deletar tudo e recomeçar:

```sql
DROP SCHEMA IF EXISTS agendago CASCADE;
```

Depois execute novamente:
```bash
node run-migrations.js
```

## 📝 Variáveis de Ambiente

Certifique-se que seu `.env` contém:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gendago
DB_USER=postgres
DB_PASSWORD=123456
```

## 🆘 Solução de Problemas

### Erro: "database does not exist"
```bash
# Criar database manualmente
psql -U postgres -c "CREATE DATABASE gendago;"
# Depois rodar as migrações
node run-migrations.js
```

### Erro: "permission denied"
- Verificar se PostgreSQL está rodando
- Verificar credenciais no `.env`
- Verificar permissões do usuário postgres

### Erro: "role 'postgres' does not exist"
```bash
# Criar role
psql -U postgres -c "CREATE ROLE postgres LOGIN CREATEDB;"
```

## 📞 Suporte

Para mais informações sobre a arquitetura do banco, veja:
- [`docs/README.md`](../docs/README.md)
- Comentários nos arquivos `.sql`
