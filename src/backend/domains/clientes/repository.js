const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

async function listClientsByCompany(companyId = null) {
	if (!companyId) {
		const sql = `
			SELECT id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, ultimo_login, auth_updated_at
			FROM venus.clientes
			ORDER BY nome ASC
		`;
		const result = await query(sql);
		return result.rows;
	}

	const sql = `
		SELECT id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, ultimo_login, auth_updated_at
		FROM venus.clientes
		WHERE empresa_id = $1
		ORDER BY nome ASC
	`;
	const result = await query(sql, [companyId]);
	return result.rows;
}

async function findClientById(clientId) {
	const sql = `
		SELECT id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, ultimo_login, auth_updated_at
		FROM venus.clientes
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [clientId]);
	return result.rows[0] || null;
}

async function findClientsByPhone(phone, companyId = null) {
	if (!companyId) {
		const result = await query(
			`SELECT id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, ultimo_login, auth_updated_at
			 FROM venus.clientes
			 WHERE telefone = $1
			 ORDER BY nome ASC`,
			[phone],
		);
		return result.rows;
	}

	const result = await query(
		`SELECT id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, ultimo_login, auth_updated_at
		 FROM venus.clientes
		 WHERE telefone = $1 AND empresa_id = $2
		 ORDER BY nome ASC`,
		[phone, companyId],
	);
	return result.rows;
}

async function findClientByEmailAndCompany(email, companyId) {
	const sql = `
		SELECT id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, senha_hash, ultimo_login, auth_updated_at
		FROM venus.clientes
		WHERE lower(email) = lower($1) AND empresa_id = $2
		LIMIT 1
	`;
	const result = await query(sql, [email, companyId]);
	return result.rows[0] || null;
}

async function findClientByPhoneDigitsAndCompany(phoneDigits, companyId) {
	const sql = `
		SELECT id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, senha_hash, ultimo_login, auth_updated_at
		FROM venus.clientes
		WHERE regexp_replace(coalesce(telefone, ''), '\\D', '', 'g') = $1
		  AND empresa_id = $2
		LIMIT 1
	`;
	const result = await query(sql, [phoneDigits, companyId]);
	return result.rows[0] || null;
}

async function createClient({ telefone, nome, empresaId, email, idade, status }) {
	const sql = `
		INSERT INTO venus.clientes (id, telefone, nome, empresa_id, email, idade, status, datacadastro, ultimo_contato)
		VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, NOW())
		RETURNING id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, ultimo_login, auth_updated_at
	`;
	const result = await query(sql, [randomUUID(), telefone, nome, empresaId, email, idade, status]);
	return result.rows[0] || null;
}

async function createPublicClient({ telefone, nome, empresaId, email, senhaHash }) {
	const sql = `
		INSERT INTO venus.clientes (
			id,
			telefone,
			nome,
			empresa_id,
			email,
			status,
			datacadastro,
			ultimo_contato,
			ultimo_login,
			auth_updated_at,
			senha_hash
		)
		VALUES ($1, $2, $3, $4, $5, 'Ativo', CURRENT_DATE, NOW(), NOW(), NOW(), $6)
		RETURNING id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, ultimo_login, auth_updated_at
	`;
	const result = await query(sql, [randomUUID(), telefone, nome, empresaId, email, senhaHash]);
	return result.rows[0] || null;
}

async function updateClient(clientId, { telefone, nome, empresaId, email, idade, status }) {
	const sql = `
		UPDATE venus.clientes
		SET telefone = $1,
			nome = $2,
			empresa_id = $3,
			email = $4,
			idade = $5,
			status = $6,
			ultimo_contato = NOW()
		WHERE id = $7
		RETURNING id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, ultimo_login, auth_updated_at
	`;
	const result = await query(sql, [telefone, nome, empresaId, email, idade, status, clientId]);
	return result.rows[0] || null;
}

async function updateClientLastLogin(clientId) {
	const sql = `
		UPDATE venus.clientes
		SET ultimo_login = NOW(),
			ultimo_contato = NOW()
		WHERE id = $1
		RETURNING id, nome, telefone, email, idade, status, empresa_id, datacadastro, ultimo_contato, ultimo_login, auth_updated_at
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