const express = require('express')
require('dotenv').config();
const helmet = require('helmet');
const webappRoute = require('./route/webapp');
const categoriaRoute = require('./route/categoria');
const path = require('path');

const app = express()
const port = process.env.PORT || 3003;

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
		'http://localhost:3003',
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

// Health check
app.get('/health', async (req, res) => {
	try {
		const { query } = require('./backend/db/pool');
		const result = await query('SELECT COUNT(*) as count FROM empresas');
		const companies = await query('SELECT id, nome, slug FROM empresas LIMIT 10');
		return res.json({
			status: 'ok',
			service: 'Webapp',
			empresas_count: result.rows[0].count,
			empresas: companies.rows,
		});
	} catch (error) {
		return res.status(500).json({
			status: 'error',
			message: error.message,
		});
	}
});

app.get('/', (req, res) => {
	res.render('webapp/store', {
		title: 'GendaGO - Agende seus Serviços',
		company: null,
		services: [],
		categories: [],
		slug: '',
		authenticatedClient: null,
	});
});

// Routes
app.use(categoriaRoute);
app.use(webappRoute);

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
		console.log(`🟢 Webapp Server ativo na porta ${port}`);
	});
}

module.exports = app;
