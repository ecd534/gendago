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

function normalizeUser(user) {
	return {
		id: user.id,
		nome: user.nome || '',
		email: user.email || '',
		nivel: user.nivel || 'agente',
		empresa_id: user.empresa_id || '',
		ativo: typeof user.ativo === 'boolean' ? user.ativo : true,
	};
}

function buildPayload(form, options = {}) {
	const payload = {
		nome: String(form.nome || '').trim(),
		email: String(form.email || '').trim().toLowerCase(),
		nivel: String(form.nivel || '').trim(),
		empresa_id: String(form.empresa_id || '').trim() || null,
		ativo: Boolean(form.ativo),
	};

	if (options.includePassword && form.senha) {
		payload.senha_pura = String(form.senha);
	}

	return payload;
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

	return 'Nao foi possivel concluir a operacao com a API de usuarios.';
}

async function listUsers(token) {
	const client = createClient(token);
	const response = await client.get('/usuarios/');
	return Array.isArray(response.data) ? response.data.map(normalizeUser) : [];
}

async function getUserById(token, userId) {
	const users = await listUsers(token);
	return users.find((user) => user.id === userId) || null;
}

async function createUser(token, form) {
	const client = createClient(token);

	try {
		const response = await client.post('/usuarios/', buildPayload(form, { includePassword: true }));
		return normalizeUser(response.data || form);
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

async function updateUser(token, userId, form) {
	const client = createClient(token);
	const payload = buildPayload(form, { includePassword: Boolean(form.senha) });

	if (!form.senha) {
		delete payload.senha_pura;
	}

	try {
		const response = await client.put(`/usuarios/${userId}`, payload);
		return normalizeUser(response.data || { ...form, id: userId });
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

async function toggleUserStatus(token, userId, active) {
	const client = createClient(token);

	try {
		const response = await client.put(`/usuarios/${userId}`, {
			ativo: Boolean(active),
		});
		return normalizeUser(response.data || { id: userId, ativo: active });
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

module.exports = {
	listUsers,
	getUserById,
	createUser,
	updateUser,
	toggleUserStatus,
};