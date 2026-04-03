#!/usr/bin/env node
// =============================================================================
// GENDAGO - Database Seeding Script
// =============================================================================
// Executa: npm run seed:db
// Cria schema e insere dados iniciais no PostgreSQL
// SEGURO: Só executa se for primeira vez (verifica se tabelas existem)
// =============================================================================

// Only load .env if DATABASE_URL is not already set (for Railway environment)
if (!process.env.DATABASE_URL) {
	require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
}

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
};

// Validar environment variables
function validateEnv() {
  // Se DATABASE_URL existe, não precisa das outras
  if (process.env.DATABASE_URL) {
    log.success('DATABASE_URL disponível');
    return;
  }

  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    log.error(`Variáveis de ambiente faltando: ${missing.join(', ')}`);
    process.exit(1);
  }

  log.success('Variáveis de ambiente validadas');
}

// Criar pool de conexão
function createPool() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  return new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  });
}

// Verificar se banco já foi inicializado
async function isDatabaseInitialized(pool) {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    return result.rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

// Ler arquivo SQL
function readSqlFile(filename) {
  const filePath = path.join(__dirname, filename);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    log.error(`Erro ao ler arquivo ${filename}: ${error.message}`);
    throw error;
  }
}

// Executar script SQL
async function executeSql(pool, sqlContent, scriptName) {
  try {
    log.info(`Executando ${scriptName}...`);

    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    let executedCount = 0;

    for (const statement of statements) {
      try {
        await pool.query(statement);
        executedCount++;
      } catch (error) {
        if (
          !error.message.includes('already exists') &&
          !error.message.includes('duplicate') &&
          !error.message.includes('Uniqueness violation')
        ) {
          // Ignorar erros de CONFLICT esperados
        }
      }
    }

    log.success(`${scriptName}: ${executedCount} statements executados`);
  } catch (error) {
    log.error(`Erro ao executar ${scriptName}: ${error.message}`);
    throw error;
  }
}

// Main
async function main() {
  console.log(`\n${colors.bright}🌱 GENDAGO Database Seeding${colors.reset}\n`);

  const pool = createPool();

  try {
    log.info('Conectando ao banco de dados...');
    await pool.query('SELECT 1');
    log.success('Conectado ao PostgreSQL');

    log.info('Verificando schema...');
    const isInitialized = await isDatabaseInitialized(pool);

    if (isInitialized) {
      log.warning('Banco de dados já foi inicializado!');
      console.log();
      process.exit(0);
    }

    log.info(`Lendo init-db.sql...`);
    const initSQL = readSqlFile('init-db.sql');
    await executeSql(pool, initSQL, 'init-db.sql');

    log.info(`Lendo insert-initial-data.sql...`);
    const insertSQL = readSqlFile('insert-initial-data.sql');
    await executeSql(pool, insertSQL, 'insert-initial-data.sql');

    log.info('Verificando dados inseridos...');
    const empresas = await pool.query('SELECT COUNT(*) as count FROM empresas');
    const usuarios = await pool.query('SELECT COUNT(*) as count FROM usuarios');
    const servicos = await pool.query('SELECT COUNT(*) as count FROM servicos');

    console.log(`\n${colors.bright}📊 Resumo:${colors.reset}`);
    log.success(`Empresas: ${empresas.rows[0].count}`);
    log.success(`Usuários: ${usuarios.rows[0].count}`);
    log.success(`Serviços: ${servicos.rows[0].count}`);

    console.log(`\n${colors.green}${colors.bright}✓ Banco de dados inicializado com sucesso!${colors.reset}\n`);

    log.info('Próximos passos:');
    log.info('1. Acessar admin: https://seu-app.up.railway.app/admin');
    log.info('2. Email: admin@espacoduda.com');
    log.info('3. Senha: admin123');
    console.log();

  } catch (error) {
    console.log(`\n${colors.red}${colors.bright}✗ Erro durante seeding:${colors.reset}`);
    console.error(error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Validar variáveis antes de começar
validateEnv();

// Executar
main();
