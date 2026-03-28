const localCatalogService = require('../backend/domains/catalogo/service');
const { verifyAccessToken } = require('../backend/security/jwt');

function normalizeCategory(category) {
	return {
		id: category.id,
		nome: category.nome || '',
		empresa_id: category.empresa_id || '',
		ativo: typeof category.ativo === 'boolean' ? category.ativo : true,
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

	return 'Nao foi possivel concluir a operacao com a API de categorias.';
}

async function listCategoriesByCompany(token, companyId, onlyActive = true) {
	if (!companyId) {
		return [];
	}

	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	const categories = await localCatalogService.listCategoriesByCompany(viewer, companyId, onlyActive);
	return Array.isArray(categories) ? categories.map(normalizeCategory) : [];
}

async function createCategory(token, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		const created = await localCatalogService.createCategory(viewer, form);
		return normalizeCategory(created || form);
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function updateCategory(token, categoryId, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		const updated = await localCatalogService.updateCategory(viewer, categoryId, form);
		return normalizeCategory(updated || { id: categoryId, ...form });
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

module.exports = {
	listCategoriesByCompany,
	createCategory,
	updateCategory,
};