const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

async function findByEmail(email) {
	const sql = `
		SELECT id, nome, email, senha, permissoes, empresa_id, ativo
		FROM public.usuarios
		WHERE email = $1 AND ativo = true
		LIMIT 1
	`;
	const result = await query(sql, [email]);
	// Normalize the response to match expected structure
	const user = result.rows[0];
	if (user) {
		// Map 'senha' to 'senha_hash' for compatibility with service code
		user.senha_hash = user.senha;
		// Extract admin role from permissoes JSON
		user.nivel = (user.permissoes?.admin || user.permissoes?.superadmin) ? 'admin' : 'user';
	}
	return user || null;
}

async function listByCompany(empresaId) {
	if (!empresaId) {
		const result = await query('SELECT id, nome, email, nivel, empresa_id, ativo FROM venus.usuarios ORDER BY nome ASC');
		return result.rows;
	}

	const result = await query(
		'SELECT id, nome, email, nivel, empresa_id, ativo FROM venus.usuarios WHERE empresa_id = $1 ORDER BY nome ASC',
		[empresaId],
	);
	return result.rows;
}

async function createUser({ nome, email, senhaHash, nivel, empresaId, ativo }) {
	const sql = `
		INSERT INTO venus.usuarios (id, nome, email, senha_hash, nivel, empresa_id, ativo)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, nome, email, nivel, empresa_id, ativo
	`;
	const result = await query(sql, [randomUUID(), nome, email, senhaHash, nivel, empresaId, ativo]);
	return result.rows[0];
}

async function findById(userId) {
	const result = await query(
		'SELECT id, nome, email, senha_hash, nivel, empresa_id, ativo FROM venus.usuarios WHERE id = $1 LIMIT 1',
		[userId],
	);
	return result.rows[0] || null;
}

async function updateUser(userId, fields) {
	const sets = [];
	const values = [];
	let index = 1;

	for (const [key, value] of Object.entries(fields)) {
		sets.push(`${key} = $${index}`);
		values.push(value);
		index += 1;
	}

	if (!sets.length) {
		return findById(userId);
	}

	values.push(userId);
	const sql = `
		UPDATE venus.usuarios
		SET ${sets.join(', ')}
		WHERE id = $${index}
		RETURNING id, nome, email, nivel, empresa_id, ativo
	`;
	const result = await query(sql, values);
	return result.rows[0] || null;
}

module.exports = {
	findByEmail,
	listByCompany,
	createUser,
	findById,
	updateUser,
};
