require('dotenv').config();
const { query } = require('./src/backend/db/pool');

async function test() {
	try {
		const result = await query('SELECT id, nome, slug FROM empresas LIMIT 5');
		console.log('Companies:', result.rows);
		process.exit(0);
	} catch (error) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

test();
