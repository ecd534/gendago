jest.mock('../../backend/domains/usuarios/service', () => ({
	login: jest.fn(),
}));

const usuariosLocalService = require('../../backend/domains/usuarios/service');
const { authenticate } = require('../adminAuth');

describe('adminAuth.authenticate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('normalizes login payload and response data', async () => {
		usuariosLocalService.login.mockResolvedValue({
			access_token: 'jwt-token',
			email: 'ADMIN@EXAMPLE.COM',
			empresa_id: 'empresa-1',
			nivel: 'master',
			nome: 'Admin Principal',
		});

		await expect(authenticate('  ADMIN@EXAMPLE.COM ', 'secret')).resolves.toEqual({
			email: 'admin@example.com',
			empresa: 'empresa-1',
			name: 'Admin Principal',
			raw: {
				access_token: 'jwt-token',
				email: 'ADMIN@EXAMPLE.COM',
				empresa_id: 'empresa-1',
				nivel: 'master',
				nome: 'Admin Principal',
			},
			role: 'master',
			token: 'jwt-token',
		});

		expect(usuariosLocalService.login).toHaveBeenCalledWith({
			email: 'admin@example.com',
			senha: 'secret',
		});
	});

	it('returns null for expected authentication failures', async () => {
		const error = new Error('Unauthorized');
		error.statusCode = 401;
		usuariosLocalService.login.mockRejectedValue(error);

		await expect(authenticate('user@example.com', 'secret')).resolves.toBeNull();
	});

	it('rethrows unexpected errors', async () => {
		const error = new Error('Database offline');
		error.statusCode = 500;
		usuariosLocalService.login.mockRejectedValue(error);

		await expect(authenticate('user@example.com', 'secret')).rejects.toThrow('Database offline');
	});
});