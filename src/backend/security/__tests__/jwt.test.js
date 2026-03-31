const jsonwebtoken = require('jsonwebtoken');

const {
	createAccessToken,
	verifyAccessToken,
	createClientAccessToken,
	verifyClientAccessToken,
} = require('../jwt');

describe('jwt helpers', () => {
	it('creates and verifies an admin access token', () => {
		const token = createAccessToken({
			usuarioId: 42,
			email: 'admin@example.com',
			nivel: 'admin',
			empresaId: 7,
			expiresInMinutes: 5,
		});

		expect(verifyAccessToken(token)).toEqual({
			usuario_id: '42',
			email: 'admin@example.com',
			nivel: 'admin',
			empresa_id: '7',
		});
	});

	it('returns null for malformed access token payloads', () => {
		const token = jsonwebtoken.sign(
			{ sub: '42', email: 'admin@example.com' },
			process.env.SECRET_KEY,
			{ algorithm: 'HS256' }
		);

		expect(verifyAccessToken(token)).toBeNull();
	});

	it('creates and verifies a client access token', () => {
		const token = createClientAccessToken({
			clienteId: 25,
			email: 'client@example.com',
			nome: 'Cliente Teste',
			empresaId: 9,
			expiresInMinutes: 5,
		});

		expect(verifyClientAccessToken(token)).toEqual({
			cliente_id: '25',
			email: 'client@example.com',
			nome: 'Cliente Teste',
			empresa_id: '9',
		});
	});

	it('returns null for invalid client access tokens', () => {
		expect(verifyClientAccessToken('invalid-token')).toBeNull();
	});
});