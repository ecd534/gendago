const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

async function listCompanies() {
	const sql = `
		SELECT id, nome, slug, telefone, email, endereco, status
		FROM venus.empresas
		ORDER BY nome ASC
	`;
	const result = await query(sql);
	return result.rows;
}

async function getCompanyById(companyId) {
	const sql = `
		SELECT id, nome, slug, telefone, email, endereco, status
		FROM venus.empresas
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [companyId]);
	return result.rows[0] || null;
}

async function createCompany({ nome, slug, telefone, email, endereco, status }) {
	const sql = `
		INSERT INTO venus.empresas (id, nome, slug, telefone, email, endereco, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, nome, slug, telefone, email, endereco, status
	`;
	const result = await query(sql, [randomUUID(), nome, slug, telefone, email || null, endereco, status]);
	return result.rows[0] || null;
}

async function updateCompanyStatus(companyId, status) {
	const sql = `
		UPDATE venus.empresas
		SET status = $1
		WHERE id = $2
		RETURNING id, nome, slug, telefone, email, endereco, status
	`;
	const result = await query(sql, [status, companyId]);
	return result.rows[0] || null;
}

module.exports = {
	listCompanies,
	getCompanyById,
	createCompany,
	updateCompanyStatus,
};
