#!/usr/bin/env node
// Script para criar usuário admin rápido
if (!process.env.DATABASE_URL) {
	require('dotenv').config();
}

const { Pool } = require('pg');
const argon2 = require('argon2');

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createAdmin() {
	try {
		const email = 'admin@gendago.com';
		const password = 'admin123';
		const hashedPassword = await argon2.hash(password);

		await pool.query(
			`INSERT INTO usuarios (email, senha, role, ativo, empresa_id) 
			 VALUES ($1, $2, $3, $4, 
			         (SELECT id FROM empresas LIMIT 1))
			 ON CONFLICT (email) DO UPDATE SET 
			 	senha = EXCLUDED.senha, ativo = true`,
			[email, hashedPassword, 'admin', true]
		);

		console.log('✅ Usuário criado/atualizado:');
		console.log(`   Email: ${email}`);
		console.log(`   Senha: ${password}`);
		process.exit(0);
	} catch (error) {
		console.error('❌ Erro:', error.message);
		process.exit(1);
	}
}

createAdmin();
