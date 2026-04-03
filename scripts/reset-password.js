#!/usr/bin/env node
// Script para resetar senha de um usuário
if (!process.env.DATABASE_URL) {
	require('dotenv').config();
}

const { Pool } = require('pg');
const argon2 = require('argon2');

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function resetPassword() {
	try {
		const email = 'raasjakarta@gmail.com';
		const newPassword = 'admin123';
		const hashedPassword = await argon2.hash(newPassword);

		// First, check user's empresa_id
		const userCheck = await pool.query(
			`SELECT id, email, role FROM usuarios WHERE email = $1`,
			[email]
		);

		if (userCheck.rows.length === 0) {
			// Se não existe, criar com empresa_id
			const empresaResult = await pool.query(`SELECT id FROM empresas LIMIT 1`);
			const empresaId = empresaResult.rows[0]?.id;

			const result = await pool.query(
				`INSERT INTO usuarios (email, senha, role, ativo, empresa_id) 
				 VALUES ($1, $2, $3, $4, $5)
				 RETURNING id, email, role`,
				[email, hashedPassword, 'admin', true, empresaId]
			);

			console.log('✅ Usuário criado com sucesso!');
			console.log(`   Email: ${email}`);
			console.log(`   Senha: ${newPassword}`);
			console.log(`   Role: ${result.rows[0].role}`);
		} else {
			// Se existe, atualizar apenas a senha
			const result = await pool.query(
				`UPDATE usuarios SET senha = $1, ativo = true WHERE email = $2 RETURNING id, email, role`,
				[hashedPassword, email]
			);

			console.log('✅ Senha resetada com sucesso!');
			console.log(`   Email: ${email}`);
			console.log(`   Senha: ${newPassword}`);
			console.log(`   Role: ${result.rows[0].role}`);
		}

		process.exit(0);
	} catch (error) {
		console.error('❌ Erro:', error.message);
		console.error(error);
		process.exit(1);
	}
}

resetPassword();
