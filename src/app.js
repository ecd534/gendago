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

const sessionSecret = process.env.SESSION_SECRET;

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

const csrfProtection = csrf({
	cookie: false,
	ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Apply CSRF protection globally for form requests, but skip for setup endpoints
app.use((req, res, next) => {
	const isApiRequest = req.path.startsWith('/admin/api/') || req.path.startsWith('/app/api/');

	if (isApiRequest) {
		return next();
	}

	return csrfProtection(req, res, next);
});

app.use((req, res, next) => {
	res.locals.currentAdmin = req.session.adminUser || null;
	res.locals.flashMessage = req.session.flashMessage || null;
	delete req.session.flashMessage;
	// Make CSRF token available when CSRF middleware is active for this request
	res.locals.csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : '';
	next();
});

app.get('/', (req, res) => {
	res.redirect('/admin');
});

if (process.env.NODE_ENV !== 'production') {
	app.get(['/__debug/error', '/__debug/error/:status'], (req, _res, next) => {
		const parsedStatus = Number.parseInt(String(req.params.status || '500'), 10);
		const statusCode = Number.isInteger(parsedStatus) && parsedStatus >= 400 && parsedStatus <= 599
			? parsedStatus
			: 500;
		const error = new Error(`Erro de teste ${statusCode}`);
		error.statusCode = statusCode;
		return next(error);
	});
}

app.use(adminRoute);
app.use(categoriaRoute);
app.use(webappRoute);
app.use(apiRoute);
app.use(swaggerRoute);

app.use((req, _res, next) => {
	const error = new Error('Pagina nao encontrada.');
	error.statusCode = 404;
	return next(error);
});

function isApiRequest(req) {
	const accept = String(req.get('accept') || '').toLowerCase();
	return req.path.startsWith('/admin/api/')
		|| req.path.startsWith('/app/api/')
		|| req.path.startsWith('/api/')
		|| accept.includes('application/json');
}

// Security: Handle CSRF errors gracefully - redirect to login with error message
app.use((error, req, res, next) => {
	if (error.code === 'EBADCSRFTOKEN') {
		if (isApiRequest(req)) {
			return res.status(403).json({
				message: 'Sessao expirada. Recarregue a pagina e tente novamente.',
			});
		}

		req.session.flashMessage = {
			type: 'warning',
			text: 'Sessão expirada. Por favor, tente novamente.',
		};
		return res.redirect('/admin/login');
	}
	return next(error);
});

// Security: Error handling middleware - don't leak stack traces in production
app.use((error, req, res, _next) => {
	const isProduction = process.env.NODE_ENV === 'production';
	const statusCode = error.statusCode || error.status || 500;
	const message = error.message || 'Erro interno do servidor';
	const requestExpectsJson = isApiRequest(req);

	// Log full error in development, minimal in production
	if (isProduction) {
		console.error(`[Error ${statusCode}] ${message}`);
	} else {
		console.error(error);
	}

	if (requestExpectsJson) {
		return res.status(statusCode).json({
			message,
			error: isProduction ? undefined : error,
			timestamp: new Date().toISOString(),
		});
	}

	const safeStatusCode = Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599
		? statusCode
		: 500;
	const fallbackMessagesByStatus = {
		404: 'Pagina nao encontrada.',
		502: 'Servico indisponivel no momento. Tente novamente em instantes.',
		504: 'Tempo limite excedido na comunicacao com servico externo. Tente novamente.',
	};
	const fallbackMessage = fallbackMessagesByStatus[safeStatusCode]
		|| (safeStatusCode >= 500
			? 'Nossa equipe ja esta atuando para normalizar este servico.'
			: 'Nao foi possivel concluir sua solicitacao agora.');

	return res.status(safeStatusCode).render('webapp/error', {
		title: `Erro ${safeStatusCode}`,
		statusCode: safeStatusCode,
		message: message || fallbackMessage,
		backUrl: req.get('referer') || req.originalUrl || '/',
	});
});

if (require.main === module) {
	app.listen(port, () => {
		console.log(`Servidor Node.js ativo na porta ${port}`);
	});
}

module.exports = app;