const repository = require('./repository');

function normalizeBoolean(value, defaultValue = true) {
	if (typeof value === 'boolean') {
		return value;
	}

	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (['true', '1', 'sim', 'yes', 'on'].includes(normalized)) return true;
		if (['false', '0', 'nao', 'não', 'no', 'off'].includes(normalized)) return false;
	}

	return defaultValue;
}

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function ensureCompanyAccess(viewer, companyId) {
	if (!companyId) {
		throw createError('Empresa nao informada', 422);
	}

	if (!viewer?.nivel) {
		throw createError('Usuario autenticado nao informado', 401);
	}

	if (viewer.nivel === 'master') {
		return String(companyId);
	}

	if (viewer.nivel !== 'admin') {
		throw createError('Permission denied', 403);
	}

	if (String(viewer.empresa_id || '') !== String(companyId)) {
		throw createError('Access denied to this company', 403);
	}

	return String(companyId);
}

function normalizeCategory(category = {}) {
	return {
		id: category.id,
		nome: category.nome || '',
		empresa_id: category.empresa_id || '',
		ativo: typeof category.ativo === 'boolean' ? category.ativo : true,
	};
}

function normalizeService(service = {}) {
	return {
		id: service.id,
		nome: service.nome || '',
		preco: Number(service.preco || 0),
		duracao_minutos: Number(service.duracao_minutos || 0),
		empresa_id: service.empresa_id || '',
		categoria_id: service.categoria_id || '',
		ativo: typeof service.ativo === 'boolean' ? service.ativo : true,
	};
}

async function listCategoriesByCompany(viewer, companyId, onlyActive = true) {
	const scopedCompanyId = ensureCompanyAccess(viewer, companyId);
	const categories = await repository.listCategoriesByCompany(scopedCompanyId, normalizeBoolean(onlyActive, true));
	return categories.map(normalizeCategory);
}

async function createCategory(viewer, input) {
	const payload = {
		nome: String(input.nome || '').trim(),
		empresaId: ensureCompanyAccess(viewer, input.empresa_id),
		ativo: normalizeBoolean(input.ativo, true),
	};

	if (!payload.nome) {
		throw createError('nome e empresa_id sao obrigatorios', 422);
	}

	const created = await repository.createCategory(payload);
	return normalizeCategory(created || payload);
}

async function updateCategory(viewer, categoryId, input) {
	const found = await repository.findCategoryById(categoryId);
	if (!found) {
		throw createError('Categoria nao encontrada', 404);
	}

	ensureCompanyAccess(viewer, found.empresa_id);

	const nome = String(input.nome || '').trim();
	if (!nome) {
		throw createError('nome e obrigatorio', 422);
	}

	const updated = await repository.updateCategory(categoryId, {
		nome,
		ativo: normalizeBoolean(input.ativo, true),
	});

	if (!updated) {
		throw createError('Nao foi possivel atualizar a categoria', 500);
	}

	return normalizeCategory(updated);
}

async function listServicesByCompany(viewer, companyId, onlyActive = false) {
	const scopedCompanyId = ensureCompanyAccess(viewer, companyId);
	const services = await repository.listServicesByCompany(scopedCompanyId, normalizeBoolean(onlyActive, false));
	return services.map(normalizeService);
}

async function listServicesByCategory(viewer, categoryId, onlyActive = false) {
	const category = await repository.findCategoryById(categoryId);
	if (!category) {
		throw createError('Categoria nao encontrada', 404);
	}

	ensureCompanyAccess(viewer, category.empresa_id);
	const services = await repository.listServicesByCategory(categoryId, normalizeBoolean(onlyActive, false));
	return services.map(normalizeService);
}

async function getServiceById(viewer, serviceId) {
	const service = await repository.findServiceById(serviceId);
	if (!service) {
		throw createError('Service not found', 404);
	}

	ensureCompanyAccess(viewer, service.empresa_id);
	return normalizeService(service);
}

async function createService(viewer, input) {
	const payload = {
		nome: String(input.nome || '').trim(),
		preco: Number(input.preco || 0),
		duracaoMinutos: Number(input.duracao_minutos || 0),
		empresaId: ensureCompanyAccess(viewer, input.empresa_id),
		categoriaId: String(input.categoria_id || '').trim(),
		ativo: normalizeBoolean(input.ativo, true),
	};

	if (!payload.nome || !payload.preco || !payload.duracaoMinutos || !payload.categoriaId) {
		throw createError('nome, preco, duracao_minutos, empresa_id e categoria_id sao obrigatorios', 422);
	}

	const category = await repository.findCategoryById(payload.categoriaId);
	if (!category) {
		throw createError('Categoria nao encontrada', 404);
	}

	if (String(category.empresa_id) !== payload.empresaId) {
		throw createError('Can only create service in your company', 403);
	}

	const created = await repository.createService(payload);
	return normalizeService(created || payload);
}

async function updateService(viewer, serviceId, input) {
	const found = await repository.findServiceById(serviceId);
	if (!found) {
		throw createError('Servico nao encontrado', 404);
	}

	ensureCompanyAccess(viewer, found.empresa_id);

	const nome = String(input.nome || '').trim();
	const preco = Number(input.preco || 0);
	const duracaoMinutos = Number(input.duracao_minutos || 0);
	const categoriaId = String(input.categoria_id || '').trim();

	if (!nome || !preco || !duracaoMinutos || !categoriaId) {
		throw createError('nome, preco, duracao_minutos e categoria_id sao obrigatorios', 422);
	}

	const category = await repository.findCategoryById(categoriaId);
	if (!category) {
		throw createError('Categoria nao encontrada', 404);
	}

	if (String(category.empresa_id) !== String(found.empresa_id)) {
		throw createError('Categoria nao pertence a esta empresa', 403);
	}

	const updated = await repository.updateService(serviceId, {
		nome,
		preco,
		duracaoMinutos,
		categoriaId,
		ativo: normalizeBoolean(input.ativo, found.ativo),
	});

	if (!updated) {
		throw createError('Nao foi possivel atualizar o servico', 500);
	}

	return normalizeService(updated);
}

module.exports = {
	listCategoriesByCompany,
	createCategory,
	updateCategory,
	listServicesByCompany,
	listServicesByCategory,
	getServiceById,
	createService,
	updateService,
};