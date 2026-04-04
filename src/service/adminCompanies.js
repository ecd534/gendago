const localCompaniesService = require('../backend/domains/empresas/service');

function normalizeStatus(status) {
	return String(status || '').trim() === 'Inativa' ? 'Inativa' : 'Ativa';
}

function normalizeCompany(company) {
	return {
		id: company.id,
		nome: company.nome || '',
		slug: company.slug || '',
		telefone: company.telefone || '',
		email: company.email || '',
		endereco: company.endereco || '',
		status: company.ativo === true ? 'Ativa' : 'Inativa',
		ativo: company.ativo,
		logo_empresa: company.logo_empresa || '',
	};
}

function buildPayload(form) {
	return {
		nome: String(form.nome || '').trim(),
		slug: String(form.slug || '').trim(),
		telefone: String(form.telefone || '').trim(),
		email: String(form.email || '').trim() || null,
		endereco: String(form.endereco || '').trim(),
		ativo: String(form.status || 'Ativa').trim() !== 'Inativa', // Converter 'Ativa' → true, 'Inativa' → false
		logo_empresa: String(form.logo_empresa || '').trim(),
	};
}

function extractApiError(error) {
	if (error.response?.data?.detail) {
		if (Array.isArray(error.response.data.detail)) {
			return error.response.data.detail.map((item) => item.msg).join('. ');
		}

		if (typeof error.response.data.detail === 'string') {
			return error.response.data.detail;
		}
	}

	return 'Nao foi possivel concluir a operacao com a API de empresas.';
}

async function listCompanies(_token) {
	const companies = await localCompaniesService.listCompanies();
	return Array.isArray(companies) ? companies.map(normalizeCompany) : [];
}

async function listActiveCompanies(token) {
	const companies = await listCompanies(token);
	return companies.filter((company) => company.status === 'Ativa');
}

async function getCompanyById(token, companyId) {
	const company = await localCompaniesService.getCompanyById(companyId);
	return normalizeCompany(company || {});
}

async function createCompany(token, form) {
	try {
		const created = await localCompaniesService.createCompany(buildPayload(form));
		return normalizeCompany(created || form);
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function updateCompanyStatus(token, companyId, status) {
	const normalizedStatus = normalizeStatus(status);
	const ativoBoolean = normalizedStatus !== 'Inativa'; // Converter 'Ativa' → true, 'Inativa' → false

	try {
		await localCompaniesService.updateCompanyStatus(companyId, ativoBoolean);
		const updated = await localCompaniesService.getCompanyById(companyId);
		return normalizeCompany(updated || { id: companyId, ativo: ativoBoolean });
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function updateCompany(token, companyId, form) {
	try {
		const updated = await localCompaniesService.updateCompany(companyId, buildPayload(form));
		return normalizeCompany(updated || { id: companyId, ...form });
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

module.exports = {
	listCompanies,
	listActiveCompanies,
	getCompanyById,
	createCompany,
	updateCompany,
	updateCompanyStatus,
};