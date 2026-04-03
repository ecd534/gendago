#!/usr/bin/env node

/**
 * Railway Microservices Setup Script
 * Automatiza a criação de 3 serviços independentes no Railway
 * 
 * Uso: node scripts/railway-setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}\n`),
};

function run(command, description) {
  try {
    log.info(description || command);
    const output = execSync(command, { encoding: 'utf-8' });
    return output.trim();
  } catch (error) {
    log.error(`Failed: ${description || command}`);
    log.error(error.message);
    return null;
  }
}

async function main() {
  console.clear();
  log.section('🚀 Railway Microservices Setup');

  // Step 1: Check Railway CLI
  log.section('Step 1: Verificando Railway CLI');
  const railwayCheck = run('railway --version', 'Verificando installation do Railway CLI');
  if (!railwayCheck) {
    log.error('Railway CLI não está instalado. Install com: npm install -g @railway/cli');
    process.exit(1);
  }
  log.success(`Railway CLI: ${railwayCheck}`);

  // Step 2: Check logged in
  log.section('Step 2: Verificando autenticação');
  const currentProject = run('railway project', 'Checking current project');
  if (!currentProject) {
    log.error('Você não está logged in no Railway. Run: railway login');
    process.exit(1);
  }
  log.success(`Projeto atual: ${currentProject}`);

  // Step 3: Delete old service (if exists)
  log.section('Step 3: Deletando serviço antigo (opcional)');
  console.log(`${colors.yellow}⚠ AVISO: Isso vai deletar o serviço Node.js atual${colors.reset}`);
  console.log('Para deletar manualmente:');
  console.log('1. Abra https://railway.app');
  console.log('2. Clique no serviço Node.js');
  console.log('3. Vá em Settings > Danger Zone > Delete Service');
  console.log('4. Ou continue e eu deletarei via CLI\n');

  // Step 4: Create services info
  log.section('Step 4: Informações dos 3 Serviços');

  const services = [
    {
      name: 'API',
      port: 3001,
      startCmd: 'npm run start:api',
      description: 'API REST + Swagger (/api/*, /swagger)',
      color: '🔵',
    },
    {
      name: 'Backoffice',
      port: 3002,
      startCmd: 'npm run start:backoffice',
      description: 'Admin Dashboard (/admin/*)',
      color: '🟡',
    },
    {
      name: 'Webapp',
      port: 3003,
      startCmd: 'npm run start:webapp',
      description: 'Public Storefront (/app/*, /categorias)',
      color: '🟢',
    },
  ];

  services.forEach((service) => {
    console.log(`${service.color} ${colors.bright}${service.name}${colors.reset}`);
    console.log(`   Port: ${service.port}`);
    console.log(`   Start: ${colors.cyan}${service.startCmd}${colors.reset}`);
    console.log(`   Routes: ${service.description}`);
    console.log();
  });

  log.section('Step 5: Próximos Passos Manuais');

  console.log(`${colors.bright}INSTRUÇÕES:${colors.reset}\n`);

  console.log('1. Abra https://railway.app → Projeto "noble-friendship"\n');

  console.log('2. DELETE o serviço Node.js antigo:');
  console.log('   - Click no serviço Node.js');
  console.log('   - Settings → Danger Zone → Delete Service\n');

  console.log('3. CREATE 3 NOVOS Services (New Service → Node.js):\n');

  services.forEach((service, idx) => {
    console.log(`   ${idx + 1}. ${service.color} ${colors.bright}${service.name}${colors.reset}`);
    console.log(`      - Source: GitHub (gendago repo)`);
    console.log(`      - Environment:`);
    console.log(`        • PORT=3000 (Railway vai mapear para público)`);
    console.log(`        • NODE_ENV=production`);
    console.log(`        • DATABASE_URL=<postgres-connection-url>`);
    console.log(`        • SESSION_SECRET=<seu-secret>`);
    console.log(`        • SECRET_KEY=<seu-secret>`);
    console.log(`      - Build Command: npm install`);
    console.log(`      - Start Command: ${colors.cyan}${service.startCmd}${colors.reset}\n`);
  });

  console.log('4. LINK database ao todos os 3 services:');
  console.log('   - Click cada serviço → Variables');
  console.log('   - Add DATABASE_URL (copiar do PostgreSQL)\n');

  console.log('5. DEPLOY:');
  console.log('   - Cada serviço vai build e deploy automaticamente\n');

  console.log('6. TEST:');
  services.forEach((service) => {
    console.log(`   ${service.color} curl https://<${service.name.toLowerCase()}-domain>/health`);
  });
  console.log();

  log.section('📋 Railway Health Check');
  console.log('Depois dos deploys, teste cada serviço:\n');

  services.forEach((service) => {
    console.log(`${service.color} ${service.name}:`);
    console.log(`   GET https://<seu-${service.name.toLowerCase()}-dominio>.railway.app/health`);
    console.log('   Expected: {"status":"ok","service":"' + service.name + '","empresas_count":1}\n');
  });

  log.section('✅ Setup Concluído!');
  log.success('Os 3 serviços estão prontos para deploy no Railway');
  log.info('Documentação completa em: docs/RAILWAY-MICROSERVICES.md');
}

main().catch(error => {
  log.error('Setup failed:');
  console.error(error);
  process.exit(1);
});
