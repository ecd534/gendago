const repository = require('./repository');

function normalizeStatus(status) {
	return String(status || '').trim() === 'Inativa' ? 'Inativa' : 'Ativa';
}

function normalizeLogo(value) {
	const logo = String(value || '').trim();
	if (!logo) {
		return '';
	}

	const isDataImage = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(logo);
	if (!isDataImage) {
		const error = new Error('A logo deve estar no formato base64 (data URL de imagem).');
		error.statusCode = 422;
		throw error;
	}

	return logo;
}

function normalizeCompany(company = {}) {
	return {
		id: company.id,
		nome: company.nome || '',
		slug: company.slug || '',
		telefone: company.telefone || '',
		email: company.email || '',
		endereco: company.endereco || '',
		status: normalizeStatus(company.status),
		logo_empresa: company.logo_empresa || '',
	};
}

async function listCompanies() {
	const companies = await repository.listCompanies();
	return companies.map(normalizeCompany);
}

async function getCompanyById(companyId) {
	const company = await repository.getCompanyById(companyId);
	if (!company) {
		const error = new Error('Empresa nao encontrada');
		error.statusCode = 404;
		throw error;
	}

	return normalizeCompany(company);
}

async function createCompany(input) {
	const payload = {
		nome: String(input.nome || '').trim(),
		slug: String(input.slug || '').trim(),
		telefone: String(input.telefone || '').trim(),
		email: String(input.email || '').trim() || null,
		endereco: String(input.endereco || '').trim(),
		status: normalizeStatus(input.status),
		logo_empresa: normalizeLogo(input.logo_empresa),
	};

	if (!payload.nome || !payload.slug || !payload.telefone || !payload.endereco) {
		const error = new Error('nome, slug, telefone e endereco sao obrigatorios');
		error.statusCode = 422;
		throw error;
	}

	const created = await repository.createCompany(payload);
	return normalizeCompany(created || payload);
}

async function updateCompany(companyId, input) {
	const found = await repository.getCompanyById(companyId);
	if (!found) {
		const error = new Error('Empresa nao encontrada');
		error.statusCode = 404;
		throw error;
	}

	const payload = {
		nome: String(input.nome || '').trim(),
		telefone: String(input.telefone || '').trim(),
		email: String(input.email || '').trim() || null,
		endereco: String(input.endereco || '').trim(),
		status: normalizeStatus(input.status),
		logo_empresa: normalizeLogo(input.logo_empresa),
	};

	if (!payload.nome || !payload.telefone || !payload.endereco) {
		const error = new Error('nome, telefone e endereco sao obrigatorios');
		error.statusCode = 422;
		throw error;
	}

	const updated = await repository.updateCompany(companyId, payload);
	if (!updated) {
		const error = new Error('Nao foi possivel atualizar a empresa');
		error.statusCode = 500;
		throw error;
	}

	return normalizeCompany(updated);
}

async function updateCompanyStatus(companyId, status) {
	const found = await repository.getCompanyById(companyId);
	if (!found) {
		const error = new Error('Empresa nao encontrada');
		error.statusCode = 404;
		throw error;
	}

	const updated = await repository.updateCompanyStatus(companyId, normalizeStatus(status));
	if (!updated) {
		const error = new Error('Nao foi possivel atualizar o status da empresa');
		error.statusCode = 500;
		throw error;
	}

	return {
		status: 'atualizado',
		novo_status: normalizeStatus(updated.status),
	};
}

module.exports = {
	listCompanies,
	getCompanyById,
	createCompany,
	updateCompany,
	updateCompanyStatus,
};
