const argon2 = require('argon2');
const { query } = require('./src/backend/db/pool');

async function findPassword() {
	const result = await query('SELECT senha_hash FROM venus.usuarios WHERE email = $1', ['flavia@agendago.com']);
	const hash = result.rows[0].senha_hash;
	const candidates = ['123Aa321', 'admin123', 'flavia123', '123456', 'senha123', 'master123', 'Flavia@123'];
	for (const p of candidates) {
		try {
			const ok = await argon2.verify(hash, p);
			console.log((ok ? 'MATCH:' : 'NO:') + p);
			if (ok) return p;
		} catch (e) {
			console.log('ERR:' + p + ':' + e.message);
		}
	}
	return null;
}

findPassword().then((p) => {
	console.log('RESULT:' + p);
	process.exit(0);
}).catch((e) => {
	console.error(e.message);
	process.exit(1);
});
