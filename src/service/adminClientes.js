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

function normalizeClient(client) {
	return {
		id: client.id,
		nome: client.nome || '',
		telefone: client.telefone || '',
		email: client.email || '',
		idade: typeof client.idade === 'number' ? client.idade : '',
		status: String(client.status || 'Ativo').trim() || 'Ativo',
		empresa_id: client.empresa_id || '',
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

	return 'Nao foi possivel concluir a operacao com a API de clientes.';
}

async function listClientesByCompany(token, companyId) {
	const client = createClient(token);
	const response = await client.get('/clientes/');
	const clients = Array.isArray(response.data) ? response.data.map(normalizeClient) : [];

	if (!companyId) {
		return clients;
	}

	return clients.filter((item) => item.empresa_id === companyId);
}

async function getClienteById(token, clientId) {
	const client = createClient(token);
	const response = await client.get(`/clientes/${clientId}`);
	return normalizeClient(response.data || {});
}

async function createCliente(token, form) {
	const client = createClient(token);
	const payload = {
		telefone: String(form.telefone || '').trim(),
		nome: String(form.nome || '').trim(),
		empresa_id: String(form.empresa_id || '').trim(),
		email: String(form.email || '').trim() || null,
		idade: form.idade === '' || form.idade === null || typeof form.idade === 'undefined' ? null : Number(form.idade),
		status: String(form.status || 'Ativo').trim() || 'Ativo',
	};

	try {
		const response = await client.post('/clientes/clientes/', payload);
		return normalizeClient(response.data || payload);
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

async function updateCliente(token, clientId, form) {
	const client = createClient(token);
	const payload = {
		nome: String(form.nome || '').trim() || null,
		telefone: String(form.telefone || '').trim() || null,
		email: String(form.email || '').trim() || null,
		idade: form.idade === '' || form.idade === null || typeof form.idade === 'undefined' ? null : Number(form.idade),
		status: String(form.status || '').trim() || null,
		empresa_id: String(form.empresa_id || '').trim() || null,
	};

	try {
		const response = await client.patch(`/clientes/clientes/${clientId}`, payload);
		return normalizeClient(response.data || { id: clientId, ...form });
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

module.exports = {
	listClientesByCompany,
	getClienteById,
	createCliente,
	updateCliente,
};