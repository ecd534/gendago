#!/usr/bin/env node
/**
 * 🚀 GENDAGO - Database Migration Script
 * =============================================
 * 
 * Este script cria o banco de dados do GendaGO do zero.
 * 
 * ✅ O que faz:
 *   1. Cria o schema 'agendago'
 *   2. Cria todas as 12 tabelas necessárias
 *   3. Insere dados iniciais (empresa, categorias, serviços)
 *   4. Cria o usuário master (raasjakarta@gmail.com)
 * 
 * 📋 Para executar:
 *   cd scripts
 *   node run-migrations.js
 * 
 * 🔐 Usuários criados:
 *   - raasjakarta@gmail.com / 123456
 *   - admin@espacoflaviaduarte.com / admin123
 * 
 * 📊 Banco de dados:
 *   Host: localhost
 *   Port: 5432
 *   Database: gendago
 *   Variables from: ../.env
 * 
 * =============================================
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const pool = new Pool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 5432),
	database: process.env.DB_NAME || 'gendago',
	user: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD || '123456',
	query_timeout: 60000,
	statement_timeout: 60000,
});

// Migration files to execute in order
const migrations = [
	'init-db.sql',
	'insert-initial-data.sql',
	'insert-master-user.sql',
];

async function runMigrations() {
	try {
		console.log('🚀 Iniciando migrações de banco de dados...\n');

		for (const migrationFile of migrations) {
			const filePath = path.join(__dirname, migrationFile);

			if (!fs.existsSync(filePath)) {
				console.error(`❌ Arquivo não encontrado: ${filePath}`);
				process.exit(1);
			}

			const sql = fs.readFileSync(filePath, 'utf8');

			console.log(`📂 Executando: ${migrationFile}`);
			try {
				await pool.query(sql);
				console.log(`✅ ${migrationFile} concluído com sucesso\n`);
			} catch (err) {
				console.error(`❌ Erro ao executar ${migrationFile}:`);
				console.error(err.message);
				process.exit(1);
			}
		}

		console.log('✨ Todas as migrações foram executadas com sucesso!');

		// Verify tables were created
		const result = await pool.query(`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'agendago'
			ORDER BY table_name
		`);

		console.log(`\n📋 Tabelas criadas no schema agendago (${result.rows.length} total):`);
		result.rows.forEach((row) => {
			console.log(`   - ${row.table_name}`);
		});

		process.exit(0);
	} catch (err) {
		console.error('❌ Erro crítico:', err.message);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

runMigrations();
