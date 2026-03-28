const usuariosLocalService = require('../backend/domains/usuarios/service');
const { verifyAccessToken } = require('../backend/security/jwt');

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
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	const users = await usuariosLocalService.listUsers();
	return Array.isArray(users) ? users.map(normalizeUser) : [];
}

async function getUserById(token, userId) {
	const users = await listUsers(token);
	return users.find((user) => user.id === userId) || null;
}

async function createUser(token, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		const created = await usuariosLocalService.createUser(buildPayload(form, { includePassword: true }));
		return normalizeUser(created?.user || { id: created?.id, ...form });
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function updateUser(token, userId, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	const payload = buildPayload(form, { includePassword: Boolean(form.senha) });

	if (!form.senha) {
		delete payload.senha_pura;
	}

	try {
		const updated = await usuariosLocalService.updateUser(userId, payload);
		return normalizeUser(updated || { ...form, id: userId });
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function toggleUserStatus(token, userId, active) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		const updated = await usuariosLocalService.updateUser(userId, {
			ativo: Boolean(active),
		});
		return normalizeUser(updated || { id: userId, ativo: active });
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
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