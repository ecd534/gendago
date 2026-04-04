const { query } = require('../src/backend/db/pool');
query(`SELECT id, nome, empresa_id, categoria_id FROM agendago.servicos ORDER BY id DESC LIMIT 10`)
    .then(r => { 
        console.log('LATEST SERVICES:');
        console.log(JSON.stringify(r.rows, null, 2));
        process.exit(0); 
    })
    .catch(e => { console.error('ERROR:', e.message); process.exit(1); });
