const repository = require('./repository');

function normalizeStatus(status) {
	return String(status || '').trim() === 'Inativa' ? 'Inativa' : 'Ativa';
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
	};

	if (!payload.nome || !payload.slug || !payload.telefone || !payload.endereco) {
		const error = new Error('nome, slug, telefone e endereco sao obrigatorios');
		error.statusCode = 422;
		throw error;
	}

	const created = await repository.createCompany(payload);
	return normalizeCompany(created || payload);
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
	updateCompanyStatus,
};
