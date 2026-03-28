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

function normalizeService(service) {
	return {
		id: service.id,
		nome: service.nome || '',
		preco: Number(service.preco || 0),
		duracao_minutos: Number(service.duracao_minutos || 0),
		empresa_id: service.empresa_id || '',
		categoria_id: service.categoria_id || '',
	};
}

function buildPayload(form) {
	return {
		nome: String(form.nome || '').trim(),
		preco: Number(form.preco || 0),
		duracao_minutos: Number(form.duracao_minutos || 0),
		empresa_id: String(form.empresa_id || '').trim(),
		categoria_id: String(form.categoria_id || '').trim(),
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

	return 'Nao foi possivel concluir a operacao com a API de servicos.';
}

async function listServicesByCompany(token, companyId) {
	if (!companyId) {
		return [];
	}

	const client = createClient(token);
	const response = await client.get(`/servicos/empresa/${companyId}`);
	return Array.isArray(response.data) ? response.data.map(normalizeService) : [];
}

async function getServiceById(token, serviceId) {
	const client = createClient(token);
	const response = await client.get(`/servicos/detalhe/${serviceId}`);
	return normalizeService(response.data || {});
}

async function createService(token, form) {
	const client = createClient(token);

	try {
		const response = await client.post('/servicos/', buildPayload(form));
		return normalizeService(response.data || form);
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

module.exports = {
	listServicesByCompany,
	getServiceById,
	createService,
};