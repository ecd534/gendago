require('dotenv').config();

function getDatabaseCredential(name, fallback = '') {
	const value = String(process.env[name] || '').trim();
	if (value) {
		return value;
	}

	if (String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production') {
		throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
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
};

module.exports = {
	databaseConfig,
};
