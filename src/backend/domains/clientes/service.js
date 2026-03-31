const repository = require('./repository');
const argon2 = require('argon2');

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function normalizeStatus(status) {
	return String(status || '').trim() === 'Inativo' ? 'Inativo' : 'Ativo';
}

function normalizeClient(client = {}) {
	return {
		id: client.id,
		nome: client.nome || '',
		telefone: client.telefone || '',
		email: client.email || '',
		idade: typeof client.idade === 'number' ? client.idade : '',
		status: normalizeStatus(client.status),
		empresa_id: client.empresa_id || '',
	};
}

function normalizeEmail(value) {
	return String(value || '').trim().toLowerCase();
}

function normalizePhoneDigits(value) {
	return String(value || '').replace(/\D/g, '');
}

function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeIdentifier(value) {
	const raw = String(value || '').trim();
	const email = normalizeEmail(raw);
	if (isValidEmail(email)) {
		return { type: 'email', value: email };
	}

	const phoneDigits = normalizePhoneDigits(raw);
	if (phoneDigits.length === 10 || phoneDigits.length === 11) {
		return { type: 'phone', value: phoneDigits };
	}

	return { type: 'invalid', value: '' };
}

function ensureCompanyAccess(viewer, companyId) {
	if (!viewer?.nivel) {
		throw createError('Usuario autenticado nao informado', 401);
	}

	if (viewer.nivel === 'master') {
		return companyId ? String(companyId) : null;
	}

	if (viewer.nivel !== 'admin' && viewer.nivel !== 'agente') {
		throw createError('Access denied', 403);
	}

	if (companyId && String(viewer.empresa_id) !== String(companyId)) {
		throw createError('Access denied', 403);
	}

	return String(viewer.empresa_id);
}

function normalizeInput(input, companyIdOverride = null) {
	const idadeValue = input.idade === '' || input.idade === null || typeof input.idade === 'undefined'
		? null
		: Number(input.idade);

	return {
		telefone: String(input.telefone || '').trim(),
		nome: String(input.nome || '').trim(),
		empresaId: String(companyIdOverride || input.empresa_id || '').trim(),
		email: String(input.email || '').trim() || null,
		idade: Number.isFinite(idadeValue) ? idadeValue : null,
		status: normalizeStatus(input.status),
	};
}

async function assertPhoneAvailable(phone, companyId, excludeClientId = null) {
	const existing = await repository.findClientsByPhone(phone, companyId);
	const conflict = existing.find((item) => item.id !== excludeClientId);
	if (conflict) {
		throw createError('Telefone ja cadastrado nesta empresa', 400);
	}
}

async function assertEmailAvailable(email, companyId, excludeClientId = null) {
	const existing = await repository.findClientByEmailAndCompany(email, companyId);
	if (existing && existing.id !== excludeClientId) {
		throw createError('E-mail ja cadastrado nesta empresa', 400);
	}
}

async function listClients(viewer, companyId = null) {
	const scopedCompanyId = ensureCompanyAccess(viewer, companyId);
	const clients = await repository.listClientsByCompany(scopedCompanyId);
	return clients.map(normalizeClient);
}

async function listClientsByPhone(viewer, phone) {
	const normalizedPhone = String(phone || '').trim();
	if (!normalizedPhone) {
		throw createError('Telefone nao informado', 422);
	}

	const scopedCompanyId = viewer.nivel === 'master' ? null : ensureCompanyAccess(viewer, viewer.empresa_id);
	const clients = await repository.findClientsByPhone(normalizedPhone, scopedCompanyId);
	return clients.map(normalizeClient);
}

async function getClientById(viewer, clientId) {
	const client = await repository.findClientById(clientId);
	if (!client) {
		throw createError('Cliente nao encontrado', 404);
	}

	ensureCompanyAccess(viewer, client.empresa_id);
	return normalizeClient(client);
}

async function createClient(viewer, input) {
	const scopedCompanyId = ensureCompanyAccess(viewer, input.empresa_id);
	const payload = normalizeInput(input, scopedCompanyId);

	if (!payload.nome || !payload.telefone || !payload.empresaId) {
		throw createError('telefone, nome e empresa_id sao obrigatorios', 422);
	}

	await assertPhoneAvailable(payload.telefone, payload.empresaId);
	const created = await repository.createClient(payload);
	return normalizeClient(created || payload);
}

async function updateClient(viewer, clientId, input) {
	const existing = await repository.findClientById(clientId);
	if (!existing) {
		throw createError('Cliente nao encontrado', 404);
	}

	ensureCompanyAccess(viewer, existing.empresa_id);
	const targetCompanyId = viewer.nivel === 'master'
		? String(input.empresa_id || existing.empresa_id || '').trim()
		: String(existing.empresa_id);
	ensureCompanyAccess(viewer, targetCompanyId);

	const payload = normalizeInput({
		telefone: input.telefone,
		nome: input.nome,
		email: input.email,
		idade: input.idade,
		status: input.status,
		empresa_id: targetCompanyId,
	}, targetCompanyId);

	if (!payload.nome || !payload.telefone || !payload.empresaId) {
		throw createError('telefone, nome e empresa_id sao obrigatorios', 422);
	}

	await assertPhoneAvailable(payload.telefone, payload.empresaId, clientId);
	const updated = await repository.updateClient(clientId, payload);
	if (!updated) {
		throw createError('Nao foi possivel atualizar o cliente', 500);
	}

	return {
		status: 'atualizado',
		cliente: normalizeClient(updated),
	};
}

async function loginPublicClient(input) {
	const identifier = normalizeIdentifier(input.identificador || input.email_ou_telefone);
	const senha = String(input.senha || '').trim();
	const companyId = String(input.empresa_id || '').trim();

	if (!companyId || identifier.type === 'invalid' || !senha) {
		throw createError('Informe email ou telefone com ddd e senha.', 422);
	}

	let client = null;
	if (identifier.type === 'email') {
		client = await repository.findClientByEmailAndCompany(identifier.value, companyId);
	} else {
		client = await repository.findClientByPhoneDigitsAndCompany(identifier.value, companyId);
	}

	if (!client || !client.senha_hash || normalizeStatus(client.status) !== 'Ativo') {
		throw createError('E-mail/telefone ou senha invalidos', 401);
	}

	const isValidPassword = await argon2.verify(client.senha_hash, senha);
	if (!isValidPassword) {
		throw createError('E-mail/telefone ou senha invalidos', 401);
	}

	const updated = await repository.updateClientLastLogin(client.id);
	return normalizeClient(updated || client);
}

async function registerPublicClient(input) {
	const companyId = String(input.empresa_id || '').trim();
	const nome = String(input.nome_completo || input.nome || '').trim();
	const email = normalizeEmail(input.email);
	const phoneDigits = normalizePhoneDigits(input.telefone);
	const senha = String(input.senha || '').trim();

	if (!companyId || !nome || !email || !phoneDigits || !senha) {
		throw createError('nome, email, telefone, senha e empresa_id sao obrigatorios', 422);
	}

	if (!isValidEmail(email)) {
		throw createError('E-mail invalido', 400);
	}

	if (!(phoneDigits.length === 10 || phoneDigits.length === 11)) {
		throw createError('Telefone invalido. Informe DDD + numero.', 400);
	}

	if (senha.length < 6) {
		throw createError('Senha deve ter no minimo 6 caracteres', 400);
	}

	await assertEmailAvailable(email, companyId);
	const existingByPhone = await repository.findClientByPhoneDigitsAndCompany(phoneDigits, companyId);
	if (existingByPhone) {
		throw createError('Telefone ja cadastrado nesta empresa', 400);
	}

	const senhaHash = await argon2.hash(senha);
	const created = await repository.createPublicClient({
		nome,
		email,
		telefone: phoneDigits,
		empresaId: companyId,
		senhaHash,
	});

	return normalizeClient(created);
}

async function getPublicClientById(companyId, clientId) {
	const client = await repository.findClientById(clientId);
	if (!client) {
		throw createError('Cliente nao encontrado', 404);
	}

	if (String(client.empresa_id || '') !== String(companyId || '')) {
		throw createError('Sessao invalida para esta empresa', 403);
	}

	if (normalizeStatus(client.status) !== 'Ativo') {
		throw createError('Cliente inativo', 403);
	}

	return normalizeClient(client);
}

module.exports = {
	listClients,
	listClientsByPhone,
	getClientById,
	createClient,
	updateClient,
	loginPublicClient,
	registerPublicClient,
	getPublicClientById,
};