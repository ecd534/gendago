const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

async function listCategoriesByCompany(companyId, onlyActive = true) {
	const params = [companyId];
	let sql = `
		SELECT id, nome, empresa_id, ativo
		FROM categorias
		WHERE empresa_id = $1
	`;

	if (onlyActive) {
		params.push(true);
		sql += ' AND ativo = $2';
	}

	sql += ' ORDER BY nome ASC';
	const result = await query(sql, params);
	return result.rows;
}

async function findCategoryById(categoryId) {
	const sql = `
		SELECT id, nome, empresa_id, ativo
		FROM categorias
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [categoryId]);
	return result.rows[0] || null;
}

async function createCategory({ nome, empresaId, ativo }) {
	const sql = `
		INSERT INTO categorias (id, nome, empresa_id, ativo)
		VALUES ($1, $2, $3, $4)
		RETURNING id, nome, empresa_id, ativo
	`;
	const result = await query(sql, [randomUUID(), nome, empresaId, ativo]);
	return result.rows[0] || null;
}

async function updateCategory(categoryId, { nome, ativo }) {
	const sql = `
		UPDATE categorias
		SET nome = $1,
			ativo = $2
		WHERE id = $3
		RETURNING id, nome, empresa_id, ativo
	`;
	const result = await query(sql, [nome, ativo, categoryId]);
	return result.rows[0] || null;
}

async function listServicesByCompany(companyId, onlyActive = false) {
	const params = [companyId];
	let sql = `
		SELECT id, nome, preco, duracao_minutos, empresa_id, categoria_id, ativo
		FROM servicos
		WHERE empresa_id = $1
	`;

	if (onlyActive) {
		params.push(true);
		sql += ' AND ativo = $2';
	}

	sql += ' ORDER BY nome ASC';
	const result = await query(sql, params);
	return result.rows;
}

async function listServicesByCategory(categoryId, onlyActive = false) {
	const params = [categoryId];
	let sql = `
		SELECT id, nome, preco, duracao_minutos, empresa_id, categoria_id, ativo
		FROM servicos
		WHERE categoria_id = $1
	`;

	if (onlyActive) {
		params.push(true);
		sql += ' AND ativo = $2';
	}

	sql += ' ORDER BY nome ASC';
	const result = await query(sql, params);
	return result.rows;
}

async function findServiceById(serviceId) {
	const sql = `
		SELECT id, nome, preco, duracao_minutos, empresa_id, categoria_id, ativo
		FROM servicos
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [serviceId]);
	return result.rows[0] || null;
}

async function createService({ nome, preco, duracaoMinutos, empresaId, categoriaId, ativo }) {
	const sql = `
		INSERT INTO servicos (id, nome, preco, duracao_minutos, empresa_id, categoria_id, ativo)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, nome, preco, duracao_minutos, empresa_id, categoria_id, ativo
	`;
	const result = await query(sql, [randomUUID(), nome, preco, duracaoMinutos, empresaId, categoriaId, ativo]);
	return result.rows[0] || null;
}

async function updateService(serviceId, { nome, preco, duracaoMinutos, categoriaId, ativo }) {
	const sql = `
		UPDATE servicos
		SET nome = $1,
			preco = $2,
			duracao_minutos = $3,
			categoria_id = $4,
			ativo = $5
		WHERE id = $6
		RETURNING id, nome, preco, duracao_minutos, empresa_id, categoria_id, ativo
	`;
	const result = await query(sql, [nome, preco, duracaoMinutos, categoriaId, ativo, serviceId]);
	return result.rows[0] || null;
}

module.exports = {
	listCategoriesByCompany,
	findCategoryById,
	createCategory,
	updateCategory,
	listServicesByCompany,
	listServicesByCategory,
	findServiceById,
	createService,
	updateService,
};
