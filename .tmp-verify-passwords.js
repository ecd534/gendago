const argon2 = require('argon2');
const { query } = require('./src/backend/db/pool');

query('SELECT email, senha_hash FROM venus.usuarios')
  .then(async (result) => {
    const candidates = ['123Aa321', 'admin123', 'flavia123', '123456', 'senha123', 'master123'];
    for (const user of result.rows) {
      for (const password of candidates) {
        try {
          const ok = await argon2.verify(user.senha_hash, password);
          if (ok) {
            console.log(`MATCH ${user.email} => ${password}`);
          }
        } catch {}
      }
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
