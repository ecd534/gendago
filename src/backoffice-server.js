const express = require('express')
require('dotenv').config();
const session = require('express-session');
const helmet = require('helmet');
const csrf = require('csurf');
const adminRoute = require('./route/admin');
const path = require('path');

const app = express()
const port = process.env.PORT || 3002;

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
		'http://localhost:3002',
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

// Security: CSRF protection - DISABLED for Railway production testing
// TODO: Re-enable with persistent session store (connect-pg-simple or similar)
// Current issue: CSRF tokens generated in GET don't match POST validation in distributed environments
//const csrfProtection = csrf({ cookie: true });

// Skip CSRF middleware completely for now
app.use((req, res, next) => {
	req.csrfToken = () => '';
	res.locals.csrfToken = '';
	next();
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

// DEBUG: Session and CSRF debug endpoint
app.get('/debug/session', (req, res) => {
	return res.json({
		session_id: req.sessionID,
		session_data: req.session,
		csrf_token: req.csrfToken ? req.csrfToken() : 'N/A',
	});
});

// Health check
app.get('/health', async (req, res) => {
	try {
		const { query } = require('./backend/db/pool');
		const result = await query('SELECT COUNT(*) as count FROM empresas');
		return res.json({
			status: 'ok',
			service: 'Backoffice',
			empresas_count: result.rows[0].count,
		});
	} catch (error) {
		return res.status(500).json({
			status: 'error',
			message: error.message,
		});
	}
});

// Routes
app.use(adminRoute);

// Error handling middleware
app.use((error, req, res, next) => {
	const isProduction = process.env.NODE_ENV === 'production';
	const statusCode = error.statusCode || error.status || 500;
	const message = error.message || 'Erro interno do servidor';

	if (isProduction) {
		console.error(`[Error ${statusCode}] ${message}`);
	} else {
		console.error(error);
	}

	res.status(statusCode).json({
		message,
		error: isProduction ? undefined : error,
		timestamp: new Date().toISOString(),
	});
});

if (require.main === module) {
	app.listen(port, () => {
		console.log(`🟡 Backoffice Server ativo na porta ${port}`);
	});
}

module.exports = app;
