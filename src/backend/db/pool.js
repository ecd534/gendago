const { Pool } = require('pg');
const { databaseConfig } = require('../../config/database');

const pool = new Pool(databaseConfig);

// Set search_path for all connections
pool.on('connect', (client) => {
	client.query('SET search_path TO agendago, public');
});

async function query(text, params = []) {
	return pool.query(text, params);
}

module.exports = {
	pool,
	query,
};
