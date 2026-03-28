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

	const client = createClient(token);
	const response = await client.get(`/categorias/${companyId}`, {
		params: {
			apenas_ativas: onlyActive,
		},
	});

	return Array.isArray(response.data) ? response.data.map(normalizeCategory) : [];
}

async function createCategory(token, form) {
	const client = createClient(token);

	try {
		const response = await client.post('/categorias/', {
			nome: String(form.nome || '').trim(),
			empresa_id: String(form.empresa_id || '').trim(),
			ativo: typeof form.ativo === 'boolean' ? form.ativo : true,
		});
		return normalizeCategory(response.data || form);
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

async function updateCategory(token, categoryId, form) {
	const client = createClient(token);

	try {
		const response = await client.patch(`/categorias/${categoryId}`, null, {
			params: {
				nome: String(form.nome || '').trim(),
				ativo: Boolean(form.ativo),
			},
		});
		return normalizeCategory(response.data || { id: categoryId, ...form });
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

module.exports = {
	listCategoriesByCompany,
	createCategory,
	updateCategory,
};