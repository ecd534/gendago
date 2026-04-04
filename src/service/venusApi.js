const { query } = require('../backend/db/pool');

function createError(message, statusCode = 500) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function normalizeCategoria(row = {}) {
	return {
		id: String(row.id || '').trim(),
		nome: String(row.nome || '').trim(),
	};
}

async function getCategorias() {
	const result = await query(`
		SELECT id, nome
		FROM agendago.categorias
		WHERE ativo = true
		ORDER BY nome ASC
	`);

	return result.rows
		.map(normalizeCategoria)
		.filter((categoria) => categoria.id && categoria.nome);
}

async function getCategoriaById(id) {
	const categoriaId = String(id || '').trim();
	if (!categoriaId) {
		throw createError('Categoria nao informada.', 422);
	}

	const result = await query(`
		SELECT id, nome
		FROM agendago.categorias
		WHERE id = $1 AND ativo = true
		LIMIT 1
	`, [categoriaId]);

	if (!result.rows[0]) {
		throw createError('Categoria nao encontrada.', 404);
	}

	return normalizeCategoria(result.rows[0]);
}

module.exports = {
	getCategorias,
	getCategoriaById,
};
