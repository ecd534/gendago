const axios = require('axios');

const venusApiBaseUrl = process.env.VENUS_API_URL || 'http://127.0.0.1:8000';

const venusAuthClient = axios.create({
	baseURL: venusApiBaseUrl,
	timeout: 10000,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
	},
});

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
		const response = await venusAuthClient.post('/usuarios/login', {
			email: normalizeEmail(email),
			senha: password,
		});

		const payload = response.data || {};

		return {
			email: normalizeEmail(payload.email || email),
			name: normalizeName(payload),
			role: normalizeRole(payload),
			empresa: normalizeCompany(payload),
			token: normalizeToken(payload),
			raw: payload,
		};
	} catch (error) {
		if (error.response && error.response.status === 401) {
			return null;
		}

		if (error.response && error.response.status === 422) {
			return null;
		}

		throw error;
	}
}

module.exports = {
	authenticate,
};