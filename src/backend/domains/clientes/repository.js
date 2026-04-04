const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

async function listClientsByCompany(companyId = null) {
	if (!companyId) {
		const sql = `
			SELECT 
				id, 
				nome, 
				telefone, 
				email, 
				cpf,
				data_nascimento, 
				genero, 
				endereco,
				cidade, 
				estado,
				cep,
				empresa_id, 
				ativo,
				ultimo_login, 
				criado_em, 
				atualizado_em
			FROM agendago.clientes
			ORDER BY nome ASC
		`;
		const result = await query(sql);
		return result.rows;
	}

	const sql = `
		SELECT 
			id, 
			nome, 
			telefone, 
			email, 
			cpf,
			data_nascimento, 
			genero, 
			endereco,
			cidade, 
			estado,
			cep,
			empresa_id, 
			ativo,
			ultimo_login, 
			criado_em, 
			atualizado_em
		FROM agendago.clientes
		WHERE empresa_id = $1
		ORDER BY nome ASC
	`;
	const result = await query(sql, [companyId]);
	return result.rows;
}

async function findClientById(clientId) {
	const sql = `
		SELECT 
			id, 
			nome, 
			telefone, 
			email, 
			cpf,
			data_nascimento, 
			genero, 
			endereco,
			cidade, 
			estado,
			cep,
			empresa_id, 
			ativo,
			ultimo_login, 
			criado_em, 
			atualizado_em
		FROM agendago.clientes
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [clientId]);
	return result.rows[0] || null;
}

async function findClientsByPhone(phone, companyId = null) {
	if (!companyId) {
		const result = await query(
			`SELECT 
				id, 
				nome, 
				telefone, 
				email, 
				cpf,
				data_nascimento, 
				genero, 
				endereco,
				cidade, 
				estado,
				cep,
				empresa_id, 
				ativo,
				ultimo_login, 
				criado_em, 
				atualizado_em
			 FROM agendago.clientes
			 WHERE telefone = $1
			 ORDER BY nome ASC`,
			[phone],
		);
		return result.rows;
	}

	const result = await query(
		`SELECT 
			id, 
			nome, 
			telefone, 
			email, 
			cpf,
			data_nascimento, 
			genero, 
			endereco,
			cidade, 
			estado,
			cep,
			empresa_id, 
			ativo,
			ultimo_login, 
			criado_em, 
			atualizado_em
		 FROM agendago.clientes
		 WHERE telefone = $1 AND empresa_id = $2
		 ORDER BY nome ASC`,
		[phone, companyId],
	);
	return result.rows;
}

async function findClientByEmailAndCompany(email, companyId) {
	const sql = `
		SELECT 
			id, 
			nome, 
			telefone, 
			email, 
			cpf,
			data_nascimento, 
			genero, 
			endereco,
			cidade, 
			estado,
			cep,
			empresa_id, 
			ativo,
			senha,
			ultimo_login, 
			criado_em, 
			atualizado_em
		FROM agendago.clientes
		WHERE lower(email) = lower($1) AND empresa_id = $2
		LIMIT 1
	`;
	const result = await query(sql, [email, companyId]);
	return result.rows[0] || null;
}

async function findClientByPhoneDigitsAndCompany(phoneDigits, companyId) {
	const sql = `
		SELECT 
			id, 
			nome, 
			telefone, 
			email, 
			cpf,
			data_nascimento, 
			genero, 
			endereco,
			cidade, 
			estado,
			cep,
			empresa_id, 
			ativo,
			senha,
			ultimo_login, 
			criado_em, 
			atualizado_em
		FROM agendago.clientes
		WHERE regexp_replace(coalesce(telefone, ''), '\\D', '', 'g') = $1
		  AND empresa_id = $2
		LIMIT 1
	`;
	const result = await query(sql, [phoneDigits, companyId]);
	return result.rows[0] || null;
}

async function createClient({ telefone, nome, empresaId, email, cpf, data_nascimento, genero }) {
	const sql = `
		INSERT INTO agendago.clientes (id, telefone, nome, empresa_id, email, cpf, data_nascimento, genero, ativo, senha)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, '')
		RETURNING 
			id, 
			nome, 
			telefone, 
			email, 
			cpf,
			data_nascimento, 
			genero, 
			endereco,
			cidade, 
			estado,
			cep,
			empresa_id, 
			ativo,
			ultimo_login, 
			criado_em, 
			atualizado_em
	`;
	const result = await query(sql, [randomUUID(), telefone, nome, empresaId, email, cpf, data_nascimento, genero]);
	return result.rows[0] || null;
}

async function createPublicClient({ telefone, nome, empresaId, email, senhaHash }) {
	const sql = `
		INSERT INTO agendago.clientes (
			id,
			telefone,
			nome,
			empresa_id,
			email,
			ativo,
			senha,
			ultimo_login
		)
		VALUES ($1, $2, $3, $4, $5, true, $6, NOW())
		RETURNING 
			id, 
			nome, 
			telefone, 
			email, 
			cpf,
			data_nascimento, 
			genero, 
			endereco,
			cidade, 
			estado,
			cep,
			empresa_id, 
			ativo,
			ultimo_login, 
			criado_em, 
			atualizado_em
	`;
	const result = await query(sql, [randomUUID(), telefone, nome, empresaId, email, senhaHash]);
	return result.rows[0] || null;
}

async function updateClient(clientId, { telefone, nome, empresaId, email, cpf, data_nascimento, genero }) {
	const sql = `
		UPDATE agendago.clientes
		SET telefone = $1,
			nome = $2,
			empresa_id = $3,
			email = $4,
			cpf = $5,
			data_nascimento = $6,
			genero = $7,
			atualizado_em = NOW()
		WHERE id = $8
		RETURNING 
			id, 
			nome, 
			telefone, 
			email, 
			cpf,
			data_nascimento, 
			genero, 
			endereco,
			cidade, 
			estado,
			cep,
			empresa_id, 
			ativo,
			ultimo_login, 
			criado_em, 
			atualizado_em
	`;
	const result = await query(sql, [telefone, nome, empresaId, email, cpf, data_nascimento, genero, clientId]);
	return result.rows[0] || null;
}

async function updateClientLastLogin(clientId) {
	const sql = `
		UPDATE agendago.clientes
		SET ultimo_login = NOW(),
			atualizado_em = NOW()
		WHERE id = $1
		RETURNING 
			id, 
			nome, 
			telefone, 
			email, 
			cpf,
			data_nascimento, 
			genero, 
			endereco,
			cidade, 
			estado,
			cep,
			empresa_id, 
			ativo,
			ultimo_login, 
			criado_em, 
			atualizado_em
	`;
	const result = await query(sql, [clientId]);
	return result.rows[0] || null;
}

module.exports = {
	listClientsByCompany,
	findClientById,
	findClientsByPhone,
	findClientByEmailAndCompany,
	findClientByPhoneDigitsAndCompany,
	createClient,
	createPublicClient,
	updateClient,
	updateClientLastLogin,
};