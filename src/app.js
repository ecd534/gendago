const express = require('express')
require('dotenv').config();
const session = require('express-session');
const helmet = require('helmet');
const csrf = require('csurf');
const adminRoute = require('./route/admin');
const categoriaRoute = require('./route/categoria');
const webappRoute = require('./route/webapp');
const apiRoute = require('./route/api');
const swaggerRoute = require('./route/swagger');
const path = require('path');

const app = express()
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '../public')));

// Security: Helmet middleware for HTTP headers
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
			styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
			imgSrc: ["'self'", 'data:', 'https:'],
		},
	},
	hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// Security: CORS configuration (restrict to same-origin by default)
app.use((req, res, next) => {
	const origin = req.get('origin');
	const allowedOrigins = [
		'http://localhost:3000',
		'http://localhost:3001',
		process.env.ALLOWED_ORIGIN, // Set in production
	].filter(Boolean);

	if (!origin || allowedOrigins.includes(origin)) {
		res.set('Access-Control-Allow-Origin', origin || '*');
		res.set('Access-Control-Allow-Credentials', 'true');
		res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
		res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
	}

	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}

	next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Security: Request logging for audit trail (auth/sensitive endpoints only)
app.use((req, res, next) => {
	const url = req.originalUrl || req.url;
	const sensitiveEndpoints = ['/admin', '/app/api'];
	const isSensitive = sensitiveEndpoints.some(ep => url.includes(ep));

	if (isSensitive && req.method !== 'GET') {
		console.log(`[${new Date().toISOString()}] ${req.method} ${url} - IP: ${req.ip}`);
	}

	next();
});

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
	throw new Error('SESSION_SECRET environment variable is required in production');
}

app.use(session({
	name: 'gendago.admin.sid',
	secret: sessionSecret || 'dev-session-secret-change-me',
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 1000 * 60 * 60 * 8,
	},
}));

// Security: CSRF protection (only for form-submitting methods)
const csrfProtection = csrf({ 
	cookie: false, // Uses session instead of cookies
	// Skip CSRF check for setup endpoints
	ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
}); // Uses session instead of cookies

// Apply CSRF protection globally for form requests, but skip for setup endpoints
app.use((req, res, next) => {
	// Skip CSRF token generation for one-time setup endpoints
	if (req.path === '/admin/seed-database') {
		// Provide a dummy csrfToken function for compatibility
		req.csrfToken = () => 'none';
		res.locals.csrfToken = 'none';
		return next();
	}
	return csrfProtection(req, res, next);
});

app.use((req, res, next) => {
	res.locals.currentAdmin = req.session.adminUser || null;
	res.locals.flashMessage = req.session.flashMessage || null;
	delete req.session.flashMessage;
	// Make CSRF token available in all responses
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.get('/', (req, res) => {
	res.redirect('/admin');
});

// DEBUG: Health check
app.get('/health', async (req, res) => {
	try {
		const { query } = require('./backend/db/pool');
		const result = await query('SELECT COUNT(*) as count FROM empresas');
		return res.json({
			status: 'ok',
			empresas_count: result.rows[0].count,
		});
	} catch (error) {
		return res.status(500).json({
			status: 'error',
			message: error.message,
		});
	}
});

app.use(adminRoute);
app.use(categoriaRoute);
app.use(webappRoute);
app.use(apiRoute);
app.use(swaggerRoute);

// Security: Error handling middleware - don't leak stack traces in production
app.use((error, req, res, next) => {
	const isProduction = process.env.NODE_ENV === 'production';
	const statusCode = error.statusCode || error.status || 500;
	const message = error.message || 'Erro interno do servidor';

	// Log full error in development, minimal in production
	if (isProduction) {
		console.error(`[Error ${statusCode}] ${message}`);
	} else {
		console.error(error);
	}

	// Send safe error response
	res.status(statusCode).json({
		message,
		error: isProduction ? undefined : error,
		timestamp: new Date().toISOString(),
	});
});

if (require.main === module) {
	app.listen(port, () => {
		console.log(`Servidor Node.js ativo na porta ${port}`);
	});
}

module.exports = app;