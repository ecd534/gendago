jest.mock('../jwt', () => ({
	verifyAccessToken: jest.fn(),
}));

const { verifyAccessToken } = require('../jwt');
const { requireAuth, requireRoles } = require('../middleware');

function createResponse() {
	return {
		json: jest.fn(),
		status: jest.fn().mockReturnThis(),
	};
}

describe('auth middleware', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('rejects requests without bearer token', () => {
		const req = { headers: {} };
		const res = createResponse();
		const next = jest.fn();

		requireAuth(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ message: 'Missing authentication token' });
		expect(next).not.toHaveBeenCalled();
	});

	it('rejects requests with invalid token', () => {
		verifyAccessToken.mockReturnValue(null);
		const req = { headers: { authorization: 'Bearer invalid-token' } };
		const res = createResponse();
		const next = jest.fn();

		requireAuth(req, res, next);

		expect(verifyAccessToken).toHaveBeenCalledWith('invalid-token');
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
		expect(next).not.toHaveBeenCalled();
	});

	it('stores authenticated user and continues', () => {
		const user = { usuario_id: '42', nivel: 'admin' };
		verifyAccessToken.mockReturnValue(user);
		const req = { headers: { authorization: 'Bearer valid-token' } };
		const res = createResponse();
		const next = jest.fn();

		requireAuth(req, res, next);

		expect(req.localUser).toEqual(user);
		expect(next).toHaveBeenCalledTimes(1);
	});

	it('rejects missing authenticated user for role checks', () => {
		const req = {};
		const res = createResponse();
		const next = jest.fn();

		requireRoles(['admin'])(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ message: 'Missing authenticated user' });
		expect(next).not.toHaveBeenCalled();
	});

	it('rejects users without the required role', () => {
		const req = { localUser: { nivel: 'agente' } };
		const res = createResponse();
		const next = jest.fn();

		requireRoles(['admin'])(req, res, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ message: 'User level not allowed' });
		expect(next).not.toHaveBeenCalled();
	});

	it('continues when user has the required role', () => {
		const req = { localUser: { nivel: 'admin' } };
		const res = createResponse();
		const next = jest.fn();

		requireRoles(['admin', 'master'])(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
	});
});