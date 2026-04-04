const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

let logoColumnAvailable;

async function hasLogoColumn() {
	if (typeof logoColumnAvailable === 'boolean') {
		return logoColumnAvailable;
	}

	const result = await query(`
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'agendago'
		  AND table_name = 'empresas'
		  AND column_name = 'logo_empresa'
		LIMIT 1
	`);

	logoColumnAvailable = Boolean(result.rows[0]);
	return logoColumnAvailable;
}

async function ensureLogoColumnForWrite() {
	const hasColumn = await hasLogoColumn();
	if (hasColumn) {
		return true;
	}

	try {
		await query('ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_empresa TEXT');
		logoColumnAvailable = true;
		return true;
	} catch (error) {
		logoColumnAvailable = false;
		return false;
	}
}

async function listCompanies() {
	const sql = `
		SELECT id, nome, slug, telefone, email, endereco, ativo
		FROM empresas
		ORDER BY nome ASC
	`;
	const result = await query(sql);
	return result.rows;
}

async function getCompanyById(companyId) {
	const sql = `
		SELECT id, nome, slug, telefone, email, endereco, ativo
		FROM empresas
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [companyId]);
	return result.rows[0] || null;
}

async function createCompany({ nome, slug, telefone, email, endereco, status, logo_empresa }) {
	const withLogo = await ensureLogoColumnForWrite();
	const companyId = randomUUID();
	const sql = withLogo
		? `
			INSERT INTO empresas (id, nome, slug, telefone, email, endereco, status, logo_empresa)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id, nome, slug, telefone, email, endereco, status, logo_empresa
		`
		: `
			INSERT INTO empresas (id, nome, slug, telefone, email, endereco, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id, nome, slug, telefone, email, endereco, status, NULL::text AS logo_empresa
		`;
	const params = withLogo
		? [companyId, nome, slug, telefone, email || null, endereco, status, logo_empresa || null]
		: [companyId, nome, slug, telefone, email || null, endereco, status];
	const result = await query(sql, params);
	return result.rows[0] || null;
}

async function updateCompanyStatus(companyId, status) {
	const withLogo = await hasLogoColumn();
	const sql = `
		UPDATE empresas
		SET status = $1
		WHERE id = $2
		RETURNING id, nome, slug, telefone, email, endereco, status, ${withLogo ? 'logo_empresa' : 'NULL::text AS logo_empresa'}
	`;
	const result = await query(sql, [status, companyId]);
	return result.rows[0] || null;
}

async function updateCompany(companyId, { nome, telefone, email, endereco, status, logo_empresa }) {
	const withLogo = await ensureLogoColumnForWrite();
	const sql = withLogo
		? `
			UPDATE empresas
			SET nome = $1,
				telefone = $2,
				email = $3,
				endereco = $4,
				status = $5,
				logo_empresa = $6
			WHERE id = $7
			RETURNING id, nome, slug, telefone, email, endereco, status, logo_empresa
		`
		: `
			UPDATE empresas
			SET nome = $1,
				telefone = $2,
				email = $3,
				endereco = $4,
				status = $5
			WHERE id = $6
			RETURNING id, nome, slug, telefone, email, endereco, status, NULL::text AS logo_empresa
		`;

	const params = withLogo
		? [nome, telefone, email || null, endereco, status, logo_empresa || null, companyId]
		: [nome, telefone, email || null, endereco, status, companyId];
	const result = await query(sql, params);
	return result.rows[0] || null;
}

module.exports = {
	listCompanies,
	getCompanyById,
	createCompany,
	updateCompanyStatus,
	updateCompany,
};
