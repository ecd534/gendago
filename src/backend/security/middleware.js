const { verifyAccessToken } = require('./jwt');

function extractBearerToken(authorizationHeader) {
	const value = String(authorizationHeader || '').trim();
	if (!value.toLowerCase().startsWith('bearer ')) {
		return null;
	}
	return value.slice(7).trim() || null;
}

function requireAuth(req, res, next) {
	const token = extractBearerToken(req.headers.authorization);
	if (!token) {
		return res.status(401).json({ message: 'Missing authentication token' });
	}

	const user = verifyAccessToken(token);
	if (!user) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}

	req.localUser = user;
	return next();
}

function requireRoles(roles) {
	const allowedRoles = Array.isArray(roles) ? roles : [];

	return (req, res, next) => {
		const currentRole = req.localUser?.nivel;
		if (!currentRole) {
			return res.status(401).json({ message: 'Missing authenticated user' });
		}

		if (!allowedRoles.includes(currentRole)) {
			return res.status(403).json({ message: 'User level not allowed' });
		}

		return next();
	};
}

module.exports = {
	requireAuth,
	requireRoles,
};
