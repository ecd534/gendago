const argon2 = require('argon2');
const repository = require('./repository');
const { createAccessToken } = require('../../security/jwt');

async function login({ email, senha }) {
	if (!email || !senha) {
		const error = new Error('E-mail e senha sao obrigatorios');
		error.statusCode = 400;
		throw error;
	}

	const user = await repository.findByEmail(email);
	if (!user) {
		const error = new Error('E-mail ou senha incorretos');
		error.statusCode = 401;
		throw error;
	}

	const isValid = await argon2.verify(user.senha_hash, senha);
	if (!isValid) {
		const error = new Error('E-mail ou senha incorretos');
		error.statusCode = 401;
		throw error;
	}

	const accessToken = createAccessToken({
		usuarioId: user.id,
		email: user.email,
		nivel: user.nivel,
		empresaId: user.empresa_id,
	});

	return {
		access_token: accessToken,
		token_type: 'bearer',
		nome: user.nome,
		nivel: user.nivel,
		empresa_id: user.empresa_id,
	};
}

async function listUsers(empresaId) {
	return repository.listByCompany(empresaId || null);
}

async function createUser(input) {
	const { nome, email, senha_pura: senhaPura, nivel, empresa_id: empresaId } = input;

	if (!nome || !email || !senhaPura || !nivel || !empresaId) {
		const error = new Error('nome, email, senha_pura, nivel e empresa_id sao obrigatorios');
		error.statusCode = 422;
		throw error;
	}

	const existing = await repository.findByEmail(email);
	if (existing) {
		const error = new Error('Email ja cadastrado');
		error.statusCode = 400;
		throw error;
	}

	const senhaHash = await argon2.hash(senhaPura);
	const created = await repository.createUser({
		nome,
		email,
		senhaHash,
		nivel,
		empresaId,
		ativo: typeof input.ativo === 'boolean' ? input.ativo : true,
	});

	return {
		message: 'Usuario criado com sucesso',
		id: created.id,
		user: created,
	};
}

async function updateUser(userId, input) {
	const user = await repository.findById(userId);
	if (!user) {
		const error = new Error('Usuario nao encontrado');
		error.statusCode = 404;
		throw error;
	}

	const fields = {};
	if (typeof input.nome !== 'undefined') fields.nome = input.nome;
	if (typeof input.email !== 'undefined') fields.email = input.email;
	if (typeof input.nivel !== 'undefined') fields.nivel = input.nivel;
	if (typeof input.empresa_id !== 'undefined') fields.empresa_id = input.empresa_id;
	if (typeof input.ativo !== 'undefined') fields.ativo = Boolean(input.ativo);
	if (typeof input.senha_pura !== 'undefined' && input.senha_pura) {
		fields.senha_hash = await argon2.hash(input.senha_pura);
	}

	return repository.updateUser(userId, fields);
}

module.exports = {
	login,
	listUsers,
	createUser,
	updateUser,
};
