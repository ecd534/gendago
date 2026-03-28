const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'your-super-secret-key-change-in-production';
const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 480;
const CLIENT_ACCESS_TOKEN_EXPIRE_MINUTES = 480;

function createAccessToken({ usuarioId, email, nivel, empresaId, expiresInMinutes = ACCESS_TOKEN_EXPIRE_MINUTES }) {
	const nowSeconds = Math.floor(Date.now() / 1000);
	const payload = {
		sub: String(usuarioId),
		email,
		nivel,
		empresa_id: empresaId ? String(empresaId) : null,
		iat: nowSeconds,
		exp: nowSeconds + (expiresInMinutes * 60),
	};

	return jwt.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
}

function verifyAccessToken(token) {
	try {
		const payload = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
		if (!payload?.sub || !payload?.email || !payload?.nivel) {
			return null;
		}

		return {
			usuario_id: payload.sub,
			email: payload.email,
			nivel: payload.nivel,
			empresa_id: payload.empresa_id || null,
		};
	} catch (error) {
		return null;
	}
}

function createClientAccessToken({ clienteId, email, nome, empresaId, expiresInMinutes = CLIENT_ACCESS_TOKEN_EXPIRE_MINUTES }) {
	const nowSeconds = Math.floor(Date.now() / 1000);
	const payload = {
		sub: String(clienteId),
		scope: 'cliente_publico',
		email: email ? String(email) : null,
		nome: nome ? String(nome) : null,
		empresa_id: String(empresaId),
		iat: nowSeconds,
		exp: nowSeconds + (expiresInMinutes * 60),
	};

	return jwt.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
}

function verifyClientAccessToken(token) {
	try {
		const payload = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
		if (!payload?.sub || payload?.scope !== 'cliente_publico' || !payload?.empresa_id) {
			return null;
		}

		return {
			cliente_id: payload.sub,
			email: payload.email || null,
			nome: payload.nome || null,
			empresa_id: payload.empresa_id,
		};
	} catch (error) {
		return null;
	}
}

module.exports = {
	createAccessToken,
	verifyAccessToken,
	createClientAccessToken,
	verifyClientAccessToken,
};
