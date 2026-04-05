#!/usr/bin/env node
/**
 * GENDAGO - Database Migration Script
 *
 * Executa todas as migrations em ordem e cria o banco automaticamente se não existir.
 *
 * [Dev]  uso local:
 *   node scripts/run-migrations.js
 *   (lê credenciais de .env na raiz do projeto)
 *
 * [Prod] uso no Neon/Vercel (usar o direct connection string, não o pooled):
 *   DATABASE_URL="postgres://user:pass@ep-xxx-direct.neon.tech/gendago?sslmode=require" \
 *     node scripts/run-migrations.js
 *
 * Ordem das migrations:
 *   1. init-db.sql              — schema, tabelas, índices
 *   2. insert-initial-data.sql  — dados iniciais (empresa, categorias, serviços)
 *   3. insert-master-user.sql   — usuário master
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MIGRATIONS = [
	'init-db.sql',
	'insert-initial-data.sql',
	'insert-master-user.sql',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSslConfig() {
	const sslMode = String(process.env.DB_SSLMODE || '').trim().toLowerCase();
	const isProduction = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
	const requireSsl = ['require', 'verify-ca', 'verify-full'].includes(sslMode)
		|| (process.env.DATABASE_URL && isProduction);
	return requireSsl ? { rejectUnauthorized: false } : false;
}

function quoteIdentifier(name) {
	return '"' + String(name).replace(/"/g, '""') + '"';
}

function buildDatabaseConfigs() {
	const ssl = buildSslConfig();
	const targetDbName = (process.env.DB_NAME || 'gendago').trim() || 'gendago';

	if (process.env.DATABASE_URL) {
		// [Prod] — DATABASE_URL fornecida (Neon, Vercel, etc.)
		const appUrl   = new URL(process.env.DATABASE_URL);
		const adminUrl = new URL(process.env.DATABASE_URL);
		appUrl.pathname   = '/' + targetDbName;
		adminUrl.pathname = '/postgres';
		return {
			targetDbName,
			appConfig: {
				connectionString: appUrl.toString(),
				ssl,
				query_timeout:     60000,
				statement_timeout: 60000,
			},
			adminConfig: {
				connectionString: adminUrl.toString(),
				ssl,
				query_timeout:     60000,
				statement_timeout: 60000,
			},
		};
	}

	// [Dev] — variáveis discretas do .env
	const base = {
		host:              process.env.DB_HOST     || 'localhost',
		port:              Number(process.env.DB_PORT || 5432),
		user:              process.env.DB_USER     || 'postgres',
		password:          process.env.DB_PASSWORD || '123456',
		ssl,
		query_timeout:     60000,
		statement_timeout: 60000,
	};
	return {
		targetDbName,
		appConfig:   { ...base, database: targetDbName },
		adminConfig: { ...base, database: 'postgres' },
	};
}

// ---------------------------------------------------------------------------
// Cria o banco se não existir
// ---------------------------------------------------------------------------

async function ensureDatabaseExists(adminPool, targetDbName) {
	try {
		await adminPool.query('CREATE DATABASE ' + quoteIdentifier(targetDbName));
		console.log('[db] banco criado: ' + targetDbName);
	} catch (err) {
		if (err && err.code === '42P04') {
			console.log('[db] banco ja existe: ' + targetDbName);
			return;
		}
		if (err && err.code === '42501') {
			// [Prod] — usuário sem CREATEDB; o banco já deve existir (ex: Neon cria por padrão)
			console.warn('[db] sem privilegio para criar banco; continuando...');
			return;
		}
		throw err;
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const { targetDbName, appConfig, adminConfig } = buildDatabaseConfigs();

	// Passo 1 — garantir que o banco existe
	const adminPool = new Pool(adminConfig);
	try {
		await ensureDatabaseExists(adminPool, targetDbName);
	} finally {
		await adminPool.end();
	}

	// Passo 2 — executar migrations no banco alvo
	const appPool = new Pool(appConfig);
	try {
		for (const file of MIGRATIONS) {
			const filePath = path.join(__dirname, file);
			if (!fs.existsSync(filePath)) {
				throw new Error('Arquivo de migration nao encontrado: ' + filePath);
			}
			const sql = fs.readFileSync(filePath, 'utf8');
			console.log('[migrate] executando ' + file);
			await appPool.query(sql);
			console.log('[migrate] concluido  ' + file);
		}

		// Listar tabelas criadas
		const result = await appPool.query(
			`SELECT table_name
			 FROM information_schema.tables
			 WHERE table_schema = 'gendago'
			 ORDER BY table_name`
		);
		console.log('\n[migrate] tabelas no schema gendago (' + result.rows.length + '):');
		result.rows.forEach((r) => console.log('  - ' + r.table_name));
		console.log('\n[migrate] todas as migrations concluidas com sucesso.');
	} finally {
		await appPool.end();
	}
}

main().catch((err) => {
	console.error('[error]', err.code || 'UNKNOWN', err.message || err);
	process.exit(1);
});
