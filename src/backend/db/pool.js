const { Pool } = require('pg');

const pool = new Pool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 5432),
	database: process.env.DB_NAME || 'postgres',
	user: process.env.DB_USER || 'postgres',
	password: process.env.DB_PASSWORD || '1234',
	ssl: process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

async function query(text, params = []) {
	return pool.query(text, params);
}

module.exports = {
	pool,
	query,
};
