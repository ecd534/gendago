const localClientsService = require('../backend/domains/clientes/service');
const { verifyAccessToken } = require('../backend/security/jwt');

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
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	const clients = await localClientsService.listClients(viewer, companyId || null);
	return Array.isArray(clients) ? clients.map(normalizeClient) : [];
}

async function getClienteById(token, clientId) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	return normalizeClient(await localClientsService.getClientById(viewer, clientId));
}

async function createCliente(token, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		return normalizeClient(await localClientsService.createClient(viewer, form));
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function updateCliente(token, clientId, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		const payload = await localClientsService.updateClient(viewer, clientId, form);
		return normalizeClient(payload?.cliente || { id: clientId, ...form });
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

module.exports = {
	listClientesByCompany,
	getClienteById,
	createCliente,
	updateCliente,
};