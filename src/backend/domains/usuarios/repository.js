const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

async function findByEmail(email) {
	const sql = `
		SELECT id, nome, email, senha, permissoes, empresa_id, ativo, nivel
		FROM agendago.usuarios
		WHERE email = $1 AND ativo = true
		LIMIT 1
	`;
	const result = await query(sql, [email]);
	// Normalize the response to match expected structure
	const user = result.rows[0];
	if (user) {
		// Map 'senha' to 'senha_hash' for compatibility with service code
		user.senha_hash = user.senha;
		// Use nivel from database, fallback to admin if admin permission exists
		if (!user.nivel) {
			user.nivel = (user.permissoes?.admin || user.permissoes?.superadmin) ? 'admin' : 'agente';
		}
	}
	return user || null;
}

async function listByCompany(empresaId) {
	if (!empresaId) {
		const result = await query('SELECT id, nome, email, empresa_id, ativo, nivel FROM agendago.usuarios ORDER BY nome ASC');
		return result.rows;
	}

	const result = await query(
		'SELECT id, nome, email, empresa_id, ativo, nivel FROM agendago.usuarios WHERE empresa_id = $1 ORDER BY nome ASC',
		[empresaId],
	);
	return result.rows;
}

async function createUser({ nome, email, senhaHash, nivel, empresaId, ativo }) {
	const sql = `
		INSERT INTO agendago.usuarios (id, nome, email, senha, empresa_id, ativo, permissoes, nivel)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, nome, email, empresa_id, ativo, nivel
	`;
	// Encode nivel into permissoes JSON
	const permissoes = { [nivel]: true };
	const result = await query(sql, [randomUUID(), nome, email, senhaHash, empresaId, ativo, JSON.stringify(permissoes), nivel]);
	return result.rows[0];
}

async function findById(userId) {
	const result = await query(
		'SELECT id, nome, email, senha, permissoes, empresa_id, ativo, nivel FROM agendago.usuarios WHERE id = $1 LIMIT 1',
		[userId],
	);
	const user = result.rows[0];
	if (user) {
		user.senha_hash = user.senha;
		// Use nivel from database, fallback to admin if admin permission exists
		if (!user.nivel) {
			user.nivel = (user.permissoes?.admin || user.permissoes?.superadmin) ? 'admin' : 'agente';
		}
	}
	return user || null;
}

async function updateUser(userId, fields) {
	const sets = [];
	const values = [];
	let index = 1;

	for (const [key, value] of Object.entries(fields)) {
		// Keep nivel and permissoes in sync
		if (key === 'nivel') {
			sets.push(`nivel = $${index}`);
			values.push(value);
			index += 1;

			sets.push(`permissoes = $${index}`);
			values.push(JSON.stringify({ [value]: true }));
		} else if (key === 'senha_hash') {
			// Service layer still uses senha_hash naming; DB column is senha
			sets.push(`senha = $${index}`);
			values.push(value);
		} else {
			sets.push(`${key} = $${index}`);
			values.push(value);
		}
		index += 1;
	}

	if (!sets.length) {
		return findById(userId);
	}

	values.push(userId);
	const sql = `
		UPDATE agendago.usuarios
		SET ${sets.join(', ')}
		WHERE id = $${index}
		RETURNING id, nome, email, empresa_id, ativo, nivel
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
