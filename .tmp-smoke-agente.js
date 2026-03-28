const app = require('./src/app');
const http = require('http');
const querystring = require('querystring');

function request({ method, port, path, body, headers = {} }) {
  return new Promise((resolve, reject) => {
    let payload = '';
    const finalHeaders = { ...headers };

    if (body && headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      payload = querystring.stringify(body);
      finalHeaders['Content-Length'] = Buffer.byteLength(payload);
    } else if (body) {
      payload = JSON.stringify(body);
      finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
      finalHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({ hostname: '127.0.0.1', port, path, method, headers: finalHeaders }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        let parsed = {};
        try { parsed = data ? JSON.parse(data) : {}; } catch { parsed = { raw: data }; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const server = app.listen(3069);
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Agente API login
    const agentLogin = await request({
      method: 'POST', port: 3069, path: '/usuarios/login',
      body: { email: 'duda@agendago.com', senha: '123456' },
      headers: { 'Content-Type': 'application/json' },
    });
    const agentToken = agentLogin.body.access_token || '';
    const companyId = agentLogin.body.empresa_id || '';

    console.log('AGENTE_LOGIN_STATUS:' + agentLogin.status);
    console.log('AGENTE_HAS_TOKEN:' + Boolean(agentToken));

    // Agente can list agendamentos via API
    const agentAg = await request({
      method: 'GET', port: 3069,
      path: `/agendamentos?empresa_id=${encodeURIComponent(companyId)}&data=${today}`,
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    console.log('AGENTE_AGENDAMENTOS_STATUS:' + agentAg.status);

    // Try status update if any appointment exists
    if (Array.isArray(agentAg.body) && agentAg.body.length > 0) {
      const first = agentAg.body[0];
      const id = first.id || first.agendamento_id;
      const current = first.status || 'agendado';
      const patch = await request({
        method: 'PATCH', port: 3069,
        path: `/agendamentos/${encodeURIComponent(id)}/status?novo_status=${encodeURIComponent(current)}`,
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      console.log('AGENTE_PATCH_STATUS:' + patch.status);
    } else {
      console.log('AGENTE_PATCH_STATUS:SKIPPED_NO_DATA');
    }

    // Session login on backoffice as agente
    const adminLogin = await request({
      method: 'POST', port: 3069, path: '/admin/login',
      body: { email: 'duda@agendago.com', password: '123456' },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const setCookie = adminLogin.headers['set-cookie'] || [];
    const cookieHeader = Array.isArray(setCookie)
      ? setCookie.map((c) => c.split(';')[0]).join('; ')
      : String(setCookie).split(';')[0];

    console.log('ADMIN_LOGIN_STATUS:' + adminLogin.status);
    console.log('ADMIN_COOKIE_PRESENT:' + Boolean(cookieHeader));

    const pageAg = await request({
      method: 'GET', port: 3069, path: '/admin/agendamentos',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
    console.log('ADMIN_PAGE_AGENDAMENTOS_STATUS:' + pageAg.status);

    const pageCli = await request({
      method: 'GET', port: 3069, path: '/admin/clientes',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
    console.log('ADMIN_PAGE_CLIENTES_STATUS:' + pageCli.status);

  } catch (e) {
    console.error('ERROR:' + e.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
})();
