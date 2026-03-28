const usuariosLocalService = require('../backend/domains/usuarios/service');

function normalizeEmail(email) {
	return String(email || '').trim().toLowerCase();
}

function normalizeRole(payload) {
	return payload.nivel || payload.role || payload.perfil || 'agente';
}

function normalizeName(payload) {
	return payload.nome || payload.name || payload.usuario || payload.email || 'Administrador';
}

function normalizeToken(payload) {
	return payload.access_token || payload.token || payload.jwt || null;
}

function normalizeCompany(payload) {
	return payload.empresa_id || payload.empresa || null;
}

async function authenticate(email, password) {
	try {
		const payload = await usuariosLocalService.login({
			email: normalizeEmail(email),
			senha: password,
		});

		return {
			email: normalizeEmail(payload.email || email),
			name: normalizeName(payload),
			role: normalizeRole(payload),
			empresa: normalizeCompany(payload),
			token: normalizeToken(payload),
			raw: payload,
		};
	} catch (error) {
		if (error.statusCode === 401 || error.statusCode === 422 || error.statusCode === 400) {
			return null;
		}

		throw error;
	}
}

module.exports = {
	authenticate,
};