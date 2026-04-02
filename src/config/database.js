require('dotenv').config();

function getDatabaseCredential(name, fallback = '') {
	const value = String(process.env[name] || '').trim();
	if (value) {
		return value;
	}

	const isProduction = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
	if (isProduction) {
		throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
	}

	// Log warnings for weak defaults in development
	if ((name === 'DB_USER' || name === 'DB_PASSWORD') && fallback) {
		console.warn(`⚠️  [Database] Using weak default for ${name}. Set environment variable for production.`);
	}

	return fallback;
}

const databaseConfig = {
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 5432),
	database: process.env.DB_NAME || 'postgres',
	user: getDatabaseCredential('DB_USER', 'postgres'),
	password: getDatabaseCredential('DB_PASSWORD', '1234'),
	ssl: process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false,
	// Security: Query timeout to prevent long-running queries
	query_timeout: process.env.DB_QUERY_TIMEOUT || 30000, // 30 seconds
	statement_timeout: process.env.DB_STATEMENT_TIMEOUT || 30000,
	idle_in_transaction_session_timeout: 10000, // 10 seconds for idle transactions
};

module.exports = {
	databaseConfig,
};
