const { Pool } = require('pg');
const { databaseConfig } = require('../../config/database');

const pool = new Pool(databaseConfig);

async function query(text, params = []) {
	return pool.query(text, params);
}

module.exports = {
	pool,
	query,
};
