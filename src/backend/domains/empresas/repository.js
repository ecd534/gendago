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

async function createCompany({ nome, slug, telefone, email, endereco, ativo, logo_empresa }) {
	const withLogo = await ensureLogoColumnForWrite();
	const companyId = randomUUID();
	const isActive = ativo !== false; // Converter status string ou boolean para ativo verdadeiro
	const sql = withLogo
		? `
			INSERT INTO empresas (id, nome, slug, telefone, email, endereco, ativo, logo_empresa)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id, nome, slug, telefone, email, endereco, ativo, logo_empresa
		`
		: `
			INSERT INTO empresas (id, nome, slug, telefone, email, endereco, ativo)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id, nome, slug, telefone, email, endereco, ativo, NULL::text AS logo_empresa
		`;
	const params = withLogo
		? [companyId, nome, slug, telefone, email || null, endereco, isActive, logo_empresa || null]
		: [companyId, nome, slug, telefone, email || null, endereco, isActive];
	const result = await query(sql, params);
	return result.rows[0] || null;
}

async function updateCompanyStatus(companyId, ativo) {
	const isActive = typeof ativo === 'boolean' ? ativo : (String(ativo).toLowerCase() !== 'inativa');
	const withLogo = await hasLogoColumn();
	const sql = `
		UPDATE empresas
		SET ativo = $1
		WHERE id = $2
		RETURNING id, nome, slug, telefone, email, endereco, ativo, ${withLogo ? 'logo_empresa' : 'NULL::text AS logo_empresa'}
	`;
	const result = await query(sql, [isActive, companyId]);
	return result.rows[0] || null;
}

async function updateCompany(companyId, { nome, telefone, email, endereco, ativo, logo_empresa }) {
	const withLogo = await ensureLogoColumnForWrite();
	const isActive = typeof ativo === 'boolean' ? ativo : (String(ativo).toLowerCase() !== 'inativa');
	const sql = withLogo
		? `
			UPDATE empresas
			SET nome = $1,
				telefone = $2,
				email = $3,
				endereco = $4,
				ativo = $5,
				logo_empresa = $6
			WHERE id = $7
			RETURNING id, nome, slug, telefone, email, endereco, ativo, logo_empresa
		`
		: `
			UPDATE empresas
			SET nome = $1,
				telefone = $2,
				email = $3,
				endereco = $4,
				ativo = $5
			WHERE id = $6
			RETURNING id, nome, slug, telefone, email, endereco, ativo, NULL::text AS logo_empresa
		`;

	const params = withLogo
		? [nome, telefone, email || null, endereco, isActive, logo_empresa || null, companyId]
		: [nome, telefone, email || null, endereco, isActive, companyId];
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
