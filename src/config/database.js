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
		// Warning: weak default for production - should be set via environment variable
	}

	return fallback;
}

let databaseConfig;

// Try DATABASE_URL first (standard PostgreSQL connection string)
if (process.env.DATABASE_URL) {
	// Using DATABASE_URL connection string
	databaseConfig = {
		connectionString: process.env.DATABASE_URL,
		ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
		query_timeout: process.env.DB_QUERY_TIMEOUT || 30000,
		statement_timeout: process.env.DB_STATEMENT_TIMEOUT || 30000,
		idle_in_transaction_session_timeout: 10000,
	};
} else {
	// Fallback to individual credentials
	databaseConfig = {
		host: process.env.DB_HOST || 'localhost',
		port: Number(process.env.DB_PORT || 5432),
		database: process.env.DB_NAME || 'postgres',
		user: getDatabaseCredential('DB_USER', 'postgres'),
		password: getDatabaseCredential('DB_PASSWORD', '123456'),
		ssl: process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false,
		query_timeout: process.env.DB_QUERY_TIMEOUT || 30000,
		statement_timeout: process.env.DB_STATEMENT_TIMEOUT || 30000,
		idle_in_transaction_session_timeout: 10000,
	};
}

module.exports = {
	databaseConfig,
};
