const localCatalogService = require('../backend/domains/catalogo/service');
const { verifyAccessToken } = require('../backend/security/jwt');

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

	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	const services = await localCatalogService.listServicesByCompany(viewer, companyId);
	return Array.isArray(services) ? services.map(normalizeService) : [];
}

async function getServiceById(token, serviceId) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	return normalizeService(await localCatalogService.getServiceById(viewer, serviceId));
}

async function createService(token, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		const created = await localCatalogService.createService(viewer, buildPayload(form));
		return normalizeService(created || form);
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function updateService(token, serviceId, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		const updated = await localCatalogService.updateService(viewer, serviceId, form);
		return normalizeService(updated || form);
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

module.exports = {
	listServicesByCompany,
	getServiceById,
	createService,
	updateService,
};