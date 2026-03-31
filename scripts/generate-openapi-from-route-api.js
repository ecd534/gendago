const fs = require('fs');
const path = require('path');

const apiPath = path.resolve('src/route/api.js');
const outPath = path.resolve('docs/openapi-baseline.json');

const source = fs.readFileSync(apiPath, 'utf8');

const routeRegex = /router\.(get|post|put|patch|delete)\('([^']+)'[\s\S]*?=>\s*\{[\s\S]*?\n\}\);/g;
const methodsByPath = {};

function toOpenApiPath(expressPath) {
  return expressPath.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}

function opId(method, p) {
  return `${method}_${p.replace(/[/{}:.-]+/g, '_').replace(/^_+|_+$/g, '')}`;
}

function inferTags(p) {
  if (p.startsWith('/usuarios')) return ['Usuários'];
  if (p.startsWith('/empresas')) return ['Empresas'];
  if (p.startsWith('/categorias') || p.startsWith('/servicos')) return ['Configurações'];
  if (p.startsWith('/profissionais') || p.startsWith('/escalas') || p.startsWith('/bloqueios') || p.startsWith('/disponibilidade')) return ['Profissionais e Configurações'];
  if (p.startsWith('/clientes')) return ['Clientes'];
  if (p.startsWith('/agendamentos')) return ['Agendamentos'];
  return ['API'];
}

function extractPathParams(p) {
  const params = [];
  for (const m of p.matchAll(/:([a-zA-Z0-9_]+)/g)) {
    params.push({
      name: m[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    });
  }
  return params;
}

function inferQueryParams(block) {
  const found = new Set();
  for (const m of block.matchAll(/req\.query\.([a-zA-Z0-9_]+)/g)) {
    found.add(m[1]);
  }
  return [...found].map((name) => ({
    name,
    in: 'query',
    required: false,
    schema: { type: 'string' },
  }));
}

function hasBody(method) {
  return ['post', 'put', 'patch'].includes(method);
}

function requiresAuth(block) {
  return block.includes('requireAuth');
}

let match;
while ((match = routeRegex.exec(source)) !== null) {
  const method = match[1].toLowerCase();
  const expressPath = match[2];
  const fullBlock = match[0];
  const pathKey = toOpenApiPath(expressPath);

  if (!methodsByPath[pathKey]) {
    methodsByPath[pathKey] = {};
  }

  const parameters = [
    ...extractPathParams(expressPath),
    ...inferQueryParams(fullBlock),
  ];

  const operation = {
    tags: inferTags(expressPath),
    summary: `${method.toUpperCase()} ${expressPath}`,
    operationId: opId(method, expressPath),
    responses: {
      200: {
        description: 'Successful Response',
        content: { 'application/json': { schema: {} } },
      },
    },
  };

  if (parameters.length) {
    operation.parameters = parameters;
  }

  if (hasBody(method)) {
    operation.requestBody = {
      required: false,
      content: {
        'application/json': {
          schema: { type: 'object', additionalProperties: true },
        },
      },
    };
  }

  if (requiresAuth(fullBlock)) {
    operation.security = [{ HTTPBearer: [] }];
  }

  methodsByPath[pathKey][method] = operation;
}

const doc = {
  openapi: '3.1.0',
  info: {
    title: 'Gendago API',
    version: '1.0.0',
    description: 'Contrato gerado automaticamente a partir de src/route/api.js',
  },
  servers: [{ url: '/', description: 'Node local backend' }],
  paths: methodsByPath,
  components: {
    securitySchemes: {
      HTTPBearer: { type: 'http', scheme: 'bearer' },
    },
  },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(doc, null, 2), 'utf8');
console.log('OK -> docs/openapi-baseline.json');
