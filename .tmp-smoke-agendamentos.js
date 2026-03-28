const app = require('./src/app');
const http = require('http');

function request({ method, port, path, body, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1', port, path, method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        let parsed = {};
        try { parsed = data ? JSON.parse(data) : {}; } catch (e) { parsed = { raw: data.slice(0, 250) }; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const server = app.listen(3068);
  try {
    const today = new Date().toISOString().slice(0, 10);

    const loginRes = await request({
      method: 'POST', port: 3068, path: '/usuarios/login',
      body: { email: 'flavia@agendago.com', senha: '123456' },
    });
    const token = loginRes.body.access_token || '';
    const empresaId = loginRes.body.empresa_id || '';
    console.log('LOGIN_STATUS:' + loginRes.status);
    console.log('HAS_TOKEN:' + Boolean(token));

    if (!token) return;

    const listRes = await request({
      method: 'GET', port: 3068,
      path: `/agendamentos?empresa_id=${encodeURIComponent(empresaId)}&data=${today}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('AGENDAMENTOS_LIST_STATUS:' + listRes.status);
    console.log('AGENDAMENTOS_IS_ARRAY:' + Array.isArray(listRes.body));

    const detRes = await request({
      method: 'GET', port: 3068,
      path: `/agendamentos/detalhado/${encodeURIComponent(empresaId)}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('DETALHADO_STATUS:' + detRes.status);
    console.log('DETALHADO_IS_ARRAY:' + Array.isArray(detRes.body));

    const noAuthRes = await request({ method: 'GET', port: 3068, path: '/agendamentos' });
    console.log('NOAUTH_STATUS:' + noAuthRes.status);

  } catch (e) {
    console.error('ERROR:' + e.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
})();
