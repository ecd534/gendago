const axios = require('axios');

const venusApiBaseUrl = process.env.VENUS_API_URL || 'http://127.0.0.1:8000';

function createClient(token) {
	return axios.create({
		baseURL: venusApiBaseUrl,
		timeout: 10000,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
	});
}

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
		status: normalizeStatus(company.status),
	};
}

function buildPayload(form) {
	return {
		nome: String(form.nome || '').trim(),
		slug: String(form.slug || '').trim(),
		telefone: String(form.telefone || '').trim(),
		email: String(form.email || '').trim() || null,
		endereco: String(form.endereco || '').trim(),
		status: normalizeStatus(form.status),
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

async function listCompanies(token) {
	const client = createClient(token);
	const response = await client.get('/empresas/');
	return Array.isArray(response.data) ? response.data.map(normalizeCompany) : [];
}

async function listActiveCompanies(token) {
	const companies = await listCompanies(token);
	return companies.filter((company) => company.status === 'Ativa');
}

async function getCompanyById(token, companyId) {
	const client = createClient(token);
	const response = await client.get(`/empresas/${companyId}`);
	return normalizeCompany(response.data || {});
}

async function createCompany(token, form) {
	const client = createClient(token);

	try {
		const response = await client.post('/empresas/', buildPayload(form));
		return normalizeCompany(response.data || form);
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

async function updateCompanyStatus(token, companyId, status) {
	const client = createClient(token);
	const normalizedStatus = normalizeStatus(status);

	try {
		const response = await client.patch(`/empresas/${companyId}`, null, {
			params: {
				status: normalizedStatus,
			},
		});
		return normalizeCompany(response.data || { id: companyId, status: normalizedStatus });
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

module.exports = {
	listCompanies,
	listActiveCompanies,
	getCompanyById,
	createCompany,
	updateCompanyStatus,
};