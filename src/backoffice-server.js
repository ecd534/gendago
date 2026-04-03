const express = require('express')
console.log('[STARTUP] 1. Express required');
require('dotenv').config();
console.log('[STARTUP] 2. Dotenv configured');
const session = require('express-session');
console.log('[STARTUP] 3. Express-session required');
const helmet = require('helmet');
console.log('[STARTUP] 4. Helmet required');
const csrf = require('csurf');
console.log('[STARTUP] 5. CSRF required');
const adminRoute = require('./route/admin');
console.log('[STARTUP] 6. Admin routes required');
const path = require('path');
console.log('[STARTUP] 7. Path required');

const app = express()
const port = process.env.PORT || 3002;
console.log(`[STARTUP] 8. Express app created, port=${port}`);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '../public')));
console.log('[STARTUP] 9. EJS and static middleware configured');

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
console.log('[STARTUP] SESSION_SECRET check:', sessionSecret ? 'SET' : 'NOT SET');
if (!sessionSecret && process.env.NODE_ENV === 'production') {
	console.error('[STARTUP] ERROR: SESSION_SECRET required in production!');
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
			database: 'connected',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('[Health Check] Database error:', error.message);
		return res.status(500).json({
			status: 'error',
			service: 'Backoffice',
			message: error.message,
			code: error.code || 'UNKNOWN_ERROR',
			timestamp: new Date().toISOString(),
		});
	}
});

// Setup endpoint - create admin user
app.post('/setup/create-admin', async (req, res) => {
	try {
		const argon2 = require('argon2');
		const { query } = require('./backend/db/pool');
		
		const email = 'raasjakarta@gmail.com';
		const password = 'admin123';
		const nome = 'Admin Raasjkarta';
		const hashedPassword = await argon2.hash(password);

		// Check if empresas table has entries
		const empresaResult = await query(`SELECT id FROM empresas LIMIT 1`);
		const empresaId = empresaResult.rows[0]?.id;

		if (!empresaId) {
			return res.status(400).json({ error: 'No empresas found in database' });
		}

		// Create or update user (sem coluna 'role' - usar permissoes como JSON)
		const result = await query(
			`INSERT INTO usuarios (email, senha, nome, ativo, empresa_id, permissoes) 
			 VALUES ($1, $2, $3, $4, $5, $6)
			 ON CONFLICT (email, empresa_id) DO UPDATE SET 
			 	senha = EXCLUDED.senha, ativo = true
			 RETURNING id, email, nome, ativo`,
			[email, hashedPassword, nome, true, empresaId, JSON.stringify({ admin: true })]
		);

		return res.json({
			status: 'ok',
			message: 'Admin user created/updated',
			user: result.rows[0],
			credentials: { email, password },
		});
	} catch (error) {
		return res.status(500).json({
			status: 'error',
			message: error.message,
		});
	}
});

// Routes
console.log('[STARTUP] Registering adminRoute');
app.use(adminRoute);
console.log('[STARTUP] adminRoute registered successfully');

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
	console.log('[STARTUP] About to listen on port', port);
	console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV);
	console.log('[STARTUP] DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
	
	app.listen(port, () => {
		console.log(`🟡 Backoffice Server ativo na porta ${port}`);
		console.log('[STARTUP] Server successfully listening!');
	});

	// Handle uncaught exceptions
	process.on('uncaughtException', (error) => {
		console.error('[FATAL] Uncaught exception:', error);
		process.exit(1);
	});

	process.on('unhandledRejection', (reason, promise) => {
		console.error('[FATAL] Unhandled rejection at:', promise, 'reason:', reason);
	});
}

module.exports = app;
