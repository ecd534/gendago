const express = require('express');

const adminAuth = require('../service/adminAuth');
const adminCategories = require('../service/adminCategories');
const adminCompanies = require('../service/adminCompanies');
const adminServices = require('../service/adminServices');
const adminUsers = require('../service/adminUsers');

const router = express.Router();

router.use((req, res, next) => {
	if (req.path === '/Admin') {
		return res.redirect('/admin');
	}

	return next();
});

function ensureAuthenticated(req, res, next) {
	if (req.session.adminUser) {
		return next();
	}

	return res.redirect('/admin/login');
}

function ensureRoles(roles, permissionMessage = 'Voce nao tem permissao para acessar este modulo.') {
	return (req, res, next) => {
		if (!req.session.adminUser) {
			return res.redirect('/admin/login');
		}

		if (!roles.includes(req.session.adminUser.role)) {
			req.session.flashMessage = {
				type: 'danger',
				text: permissionMessage,
			};
			return res.redirect('/admin');
		}

		return next();
	};
}

function getAllowedLevels(currentRole) {
	if (currentRole === 'master') {
		return ['master', 'admin', 'agente'];
	}

	return ['admin', 'agente'];
}

function buildUserForm(data = {}) {
	return {
		nome: data.nome || '',
		email: data.email || '',
		nivel: data.nivel || 'agente',
		empresa_id: data.empresa_id || '',
		senha: '',
		ativo: typeof data.ativo === 'boolean' ? data.ativo : true,
	};
}

function buildCompanyForm(data = {}) {
	return {
		nome: data.nome || '',
		slug: data.slug || '',
		telefone: data.telefone || '',
		email: data.email || '',
		endereco: data.endereco || '',
		status: data.status === 'Inativa' ? 'Inativa' : 'Ativa',
	};
}

function buildServiceForm(data = {}) {
	return {
		nome: data.nome || '',
		preco: typeof data.preco === 'number' ? data.preco : data.preco || '',
		duracao_minutos: data.duracao_minutos || '',
		empresa_id: data.empresa_id || '',
		categoria_id: data.categoria_id || '',
	};
}

function currentAdminCompanyId(req) {
	return String(req.session.adminUser?.empresa || '').trim();
}

async function resolveServiceContext(req, preferredCompanyId) {
	const role = req.session.adminUser.role;
	const token = req.session.adminUser.token;
	const activeCompanies = role === 'master' ? await adminCompanies.listActiveCompanies(token) : [];
	const companyId = role === 'master'
		? String(preferredCompanyId || '').trim() || (activeCompanies[0] ? activeCompanies[0].id : '')
		: currentAdminCompanyId(req);
	const categories = companyId ? await adminCategories.listCategoriesByCompany(token, companyId, true) : [];

	return {
		activeCompanies,
		companyId,
		categories,
	};
}

function parseBoolean(value, fallback = true) {
	if (typeof value === 'undefined') {
		return fallback;
	}

	return value === 'true' || value === 'on' || value === true;
}
router.get('/admin/login', (req, res) => {
	if (req.session.adminUser) {
		return res.redirect('/admin');
	}

	return res.render('backoffice/login', {
		title: 'Login Admin',
		errorMessage: null,
		form: {
			email: '',
		},
	});
});

router.post('/admin/login', async (req, res) => {
	const email = String(req.body.email || '').trim();
	const password = String(req.body.password || '');
	const invalidMessage = 'Atencao, email ou senha sao invalidos';

	if (!email || password.length < 6) {
		return res.status(401).render('backoffice/login', {
			title: 'Login Admin',
			errorMessage: invalidMessage,
			form: { email },
		});
	}

	let authenticatedUser;

	try {
		authenticatedUser = await adminAuth.authenticate(email, password);
	} catch (error) {
		return res.status(401).render('backoffice/login', {
			title: 'Login Admin',
			errorMessage: invalidMessage,
			form: { email },
		});
	}

	if (!authenticatedUser) {
		return res.status(401).render('backoffice/login', {
			title: 'Login Admin',
			errorMessage: invalidMessage,
			form: { email },
		});
	}

	req.session.adminUser = authenticatedUser;
	return req.session.save((error) => {
		if (error) {
			return res.status(401).render('backoffice/login', {
				title: 'Login Admin',
				errorMessage: invalidMessage,
				form: { email },
			});
		}

		return res.redirect('/admin');
	});
});

router.post('/admin/logout', ensureAuthenticated, (req, res, next) => {
	req.session.destroy((error) => {
		if (error) {
			return next(error);
		}

		res.clearCookie('gendago.admin.sid');
		return res.redirect('/admin/login');
	});
});

router.get('/admin', ensureAuthenticated, (req, res) => {
	res.render('backoffice/index', {
		title: 'Administrador',
		page: 'dashboard',
		currentAdmin: req.session.adminUser,
	});
});

router.get('/admin/usuarios', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
	try {
		const users = await adminUsers.listUsers(req.session.adminUser.token);

		return res.render('backoffice/users/index', {
			title: 'Usuarios',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			users,
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar os usuarios.',
		};
		return res.redirect('/admin');
	}
});

router.get('/admin/usuarios/novo', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar o cadastro de usuarios.'), (req, res) => {
	return res.render('backoffice/users/form', {
		title: 'Novo usuario',
		page: 'usuarios',
		currentAdmin: req.session.adminUser,
		formMode: 'create',
		formAction: '/admin/usuarios',
		formError: null,
		userForm: buildUserForm(),
		levelOptions: getAllowedLevels(req.session.adminUser.role),
	});
});

router.post('/admin/usuarios', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
	const userForm = buildUserForm({
		...req.body,
		ativo: parseBoolean(req.body.ativo, true),
	});

	if (!userForm.nome || !userForm.email || !userForm.nivel || userForm.senha.length < 6) {
		return res.status(422).render('backoffice/users/form', {
			title: 'Novo usuario',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			formMode: 'create',
			formAction: '/admin/usuarios',
			formError: 'Preencha nome, email, nivel e uma senha com no minimo 6 caracteres.',
			userForm,
			levelOptions: getAllowedLevels(req.session.adminUser.role),
		});
	}

	if (!getAllowedLevels(req.session.adminUser.role).includes(userForm.nivel)) {
		return res.status(403).render('backoffice/users/form', {
			title: 'Novo usuario',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			formMode: 'create',
			formAction: '/admin/usuarios',
			formError: 'Voce nao pode criar usuarios com esse nivel.',
			userForm,
			levelOptions: getAllowedLevels(req.session.adminUser.role),
		});
	}

	try {
		await adminUsers.createUser(req.session.adminUser.token, userForm);
		req.session.flashMessage = {
			type: 'success',
			text: 'Usuario criado com sucesso.',
		};
		return res.redirect('/admin/usuarios');
	} catch (error) {
		return res.status(error.statusCode || 500).render('backoffice/users/form', {
			title: 'Novo usuario',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			formMode: 'create',
			formAction: '/admin/usuarios',
			formError: error.message,
			userForm,
			levelOptions: getAllowedLevels(req.session.adminUser.role),
		});
	}
});

router.get('/admin/usuarios/:id/editar', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
	try {
		const user = await adminUsers.getUserById(req.session.adminUser.token, req.params.id);

		if (!user) {
			req.session.flashMessage = {
				type: 'danger',
				text: 'Usuario nao encontrado.',
			};
			return res.redirect('/admin/usuarios');
		}

		return res.render('backoffice/users/form', {
			title: 'Editar usuario',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			formMode: 'edit',
			formAction: `/admin/usuarios/${user.id}`,
			formError: null,
			userForm: buildUserForm(user),
			levelOptions: getAllowedLevels(req.session.adminUser.role),
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar o usuario para edicao.',
		};
		return res.redirect('/admin/usuarios');
	}
});

router.post('/admin/usuarios/:id', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
	const userForm = buildUserForm({
		...req.body,
		ativo: parseBoolean(req.body.ativo, true),
	});

	if (!userForm.nome || !userForm.email || !userForm.nivel) {
		return res.status(422).render('backoffice/users/form', {
			title: 'Editar usuario',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			formMode: 'edit',
			formAction: `/admin/usuarios/${req.params.id}`,
			formError: 'Preencha nome, email e nivel para continuar.',
			userForm,
			levelOptions: getAllowedLevels(req.session.adminUser.role),
		});
	}

	if (userForm.senha && userForm.senha.length < 6) {
		return res.status(422).render('backoffice/users/form', {
			title: 'Editar usuario',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			formMode: 'edit',
			formAction: `/admin/usuarios/${req.params.id}`,
			formError: 'Quando informada, a senha deve ter no minimo 6 caracteres.',
			userForm,
			levelOptions: getAllowedLevels(req.session.adminUser.role),
		});
	}

	if (!getAllowedLevels(req.session.adminUser.role).includes(userForm.nivel)) {
		return res.status(403).render('backoffice/users/form', {
			title: 'Editar usuario',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			formMode: 'edit',
			formAction: `/admin/usuarios/${req.params.id}`,
			formError: 'Voce nao pode atribuir esse nivel.',
			userForm,
			levelOptions: getAllowedLevels(req.session.adminUser.role),
		});
	}

	try {
		await adminUsers.updateUser(req.session.adminUser.token, req.params.id, userForm);
		req.session.flashMessage = {
			type: 'success',
			text: 'Usuario atualizado com sucesso.',
		};
		return res.redirect('/admin/usuarios');
	} catch (error) {
		return res.status(error.statusCode || 500).render('backoffice/users/form', {
			title: 'Editar usuario',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			formMode: 'edit',
			formAction: `/admin/usuarios/${req.params.id}`,
			formError: error.message,
			userForm,
			levelOptions: getAllowedLevels(req.session.adminUser.role),
		});
	}
});

router.post('/admin/usuarios/:id/status', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
	const active = parseBoolean(req.body.ativo, false);

	try {
		await adminUsers.toggleUserStatus(req.session.adminUser.token, req.params.id, active);
		req.session.flashMessage = {
			type: 'success',
			text: active ? 'Usuario ativado com sucesso.' : 'Usuario inativado com sucesso.',
		};
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: error.message,
		};
	}

	return res.redirect('/admin/usuarios');
});

router.get('/admin/api/empresas/:empresaId/categorias', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar categorias.'), async (req, res) => {
	const requestedCompanyId = String(req.params.empresaId || '').trim();
	const currentCompanyId = currentAdminCompanyId(req);
	const onlyActive = req.query.onlyActive !== 'false';

	if (req.session.adminUser.role !== 'master' && requestedCompanyId !== currentCompanyId) {
		return res.status(403).json({ message: 'Voce nao pode consultar categorias desta empresa.' });
	}

	try {
		const categories = await adminCategories.listCategoriesByCompany(req.session.adminUser.token, requestedCompanyId, onlyActive);
		return res.json(categories);
	} catch (error) {
		return res.status(500).json({ message: 'Nao foi possivel carregar as categorias.' });
	}
});

router.post('/admin/api/categorias', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para criar categorias.'), async (req, res) => {
	const currentCompanyId = currentAdminCompanyId(req);
	const companyId = req.session.adminUser.role === 'master'
		? String(req.body.empresa_id || '').trim()
		: currentCompanyId;
	const nome = String(req.body.nome || '').trim();

	if (!companyId || !nome) {
		return res.status(422).json({ message: 'Informe empresa e nome da categoria.' });
	}

	if (req.session.adminUser.role !== 'master' && companyId !== currentCompanyId) {
		return res.status(403).json({ message: 'Voce nao pode criar categorias para outra empresa.' });
	}

	try {
		const category = await adminCategories.createCategory(req.session.adminUser.token, {
			nome,
			empresa_id: companyId,
			ativo: true,
		});
		return res.status(201).json(category);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.patch('/admin/api/categorias/:id', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para atualizar categorias.'), async (req, res) => {
	const currentCompanyId = currentAdminCompanyId(req);
	const categoryCompanyId = req.session.adminUser.role === 'master'
		? String(req.body.empresa_id || '').trim()
		: currentCompanyId;
	const nome = String(req.body.nome || '').trim();
	const ativo = parseBoolean(req.body.ativo, true);

	if (!categoryCompanyId || !nome) {
		return res.status(422).json({ message: 'Informe empresa e nome da categoria.' });
	}

	if (req.session.adminUser.role !== 'master' && categoryCompanyId !== currentCompanyId) {
		return res.status(403).json({ message: 'Voce nao pode atualizar categorias de outra empresa.' });
	}

	try {
		const category = await adminCategories.updateCategory(req.session.adminUser.token, req.params.id, {
			nome,
			ativo,
		});
		return res.json(category);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/admin/servicos', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar o cadastro de servicos.'), async (req, res) => {
	try {
		const serviceContext = await resolveServiceContext(req, req.query.empresa_id);
		const services = serviceContext.companyId
			? await adminServices.listServicesByCompany(req.session.adminUser.token, serviceContext.companyId)
			: [];
		const categoryMap = new Map(serviceContext.categories.map((category) => [category.id, category.nome]));
		const companiesById = new Map(serviceContext.activeCompanies.map((company) => [company.id, company]));
		const decoratedServices = services.map((service) => ({
			...service,
			categoria_nome: categoryMap.get(service.categoria_id) || service.categoria_id,
			empresa_nome: companiesById.get(service.empresa_id)?.nome || service.empresa_id,
		}));

		return res.render('backoffice/services/index', {
			title: 'Servicos',
			page: 'servicos-categorias',
			currentAdmin: req.session.adminUser,
			services: decoratedServices,
			activeCompanies: serviceContext.activeCompanies,
			selectedCompanyId: serviceContext.companyId,
			selectedCompanyName: companiesById.get(serviceContext.companyId)?.nome || serviceContext.companyId,
			isMaster: req.session.adminUser.role === 'master',
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar os servicos.',
		};
		return res.redirect('/admin');
	}
});

router.get('/admin/servicos/novo', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar o cadastro de servicos.'), async (req, res) => {
	try {
		const serviceContext = await resolveServiceContext(req, req.query.empresa_id);
		const companyForm = buildServiceForm({ empresa_id: serviceContext.companyId });

		return res.render('backoffice/services/form', {
			title: 'Novo servico',
			page: 'servicos-categorias',
			currentAdmin: req.session.adminUser,
			formMode: 'create',
			formAction: '/admin/servicos',
			formError: null,
			serviceForm: companyForm,
			categories: serviceContext.categories,
			activeCompanies: serviceContext.activeCompanies,
			selectedCompanyId: serviceContext.companyId,
			isMaster: req.session.adminUser.role === 'master',
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar o formulario de servicos.',
		};
		return res.redirect('/admin/servicos');
	}
});

router.post('/admin/servicos', ensureRoles(['master', 'admin'], 'Voce nao tem permissao para acessar o cadastro de servicos.'), async (req, res) => {
	const effectiveCompanyId = req.session.adminUser.role === 'master'
		? String(req.body.empresa_id || '').trim()
		: currentAdminCompanyId(req);
	const serviceForm = buildServiceForm({
		...req.body,
		empresa_id: effectiveCompanyId,
	});

	let serviceContext;

	try {
		serviceContext = await resolveServiceContext(req, effectiveCompanyId);
	} catch (error) {
		serviceContext = {
			activeCompanies: [],
			categories: [],
			companyId: effectiveCompanyId,
		};
	}

	if (!serviceForm.nome || !serviceForm.preco || !serviceForm.duracao_minutos || !serviceForm.empresa_id || !serviceForm.categoria_id) {
		return res.status(422).render('backoffice/services/form', {
			title: 'Novo servico',
			page: 'servicos-categorias',
			currentAdmin: req.session.adminUser,
			formMode: 'create',
			formAction: '/admin/servicos',
			formError: 'Preencha nome, preco, duracao, empresa e categoria para continuar.',
			serviceForm,
			categories: serviceContext.categories,
			activeCompanies: serviceContext.activeCompanies,
			selectedCompanyId: serviceContext.companyId,
			isMaster: req.session.adminUser.role === 'master',
		});
	}

	try {
		await adminServices.createService(req.session.adminUser.token, serviceForm);
		req.session.flashMessage = {
			type: 'success',
			text: 'Servico criado com sucesso.',
		};
		return res.redirect(`/admin/servicos?empresa_id=${encodeURIComponent(serviceForm.empresa_id)}`);
	} catch (error) {
		return res.status(error.statusCode || 500).render('backoffice/services/form', {
			title: 'Novo servico',
			page: 'servicos-categorias',
			currentAdmin: req.session.adminUser,
			formMode: 'create',
			formAction: '/admin/servicos',
			formError: error.message,
			serviceForm,
			categories: serviceContext.categories,
			activeCompanies: serviceContext.activeCompanies,
			selectedCompanyId: serviceContext.companyId,
			isMaster: req.session.adminUser.role === 'master',
		});
	}
});

router.get('/admin/empresas', ensureRoles(['master'], 'Voce nao tem permissao para acessar o cadastro de empresas.'), async (req, res) => {
	try {
		const companies = await adminCompanies.listCompanies(req.session.adminUser.token);

		return res.render('backoffice/companies/index', {
			title: 'Empresas',
			page: 'empresas',
			currentAdmin: req.session.adminUser,
			companies,
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar as empresas.',
		};
		return res.redirect('/admin');
	}
});

router.get('/admin/empresas/nova', ensureRoles(['master'], 'Voce nao tem permissao para acessar o cadastro de empresas.'), (req, res) => {
	return res.render('backoffice/companies/form', {
		title: 'Nova empresa',
		page: 'empresas',
		currentAdmin: req.session.adminUser,
		formMode: 'create',
		formAction: '/admin/empresas',
		formError: null,
		companyForm: buildCompanyForm(),
	});
});

router.post('/admin/empresas', ensureRoles(['master'], 'Voce nao tem permissao para acessar o cadastro de empresas.'), async (req, res) => {
	const companyForm = buildCompanyForm(req.body);

	if (!companyForm.nome || !companyForm.slug || !companyForm.telefone || !companyForm.endereco) {
		return res.status(422).render('backoffice/companies/form', {
			title: 'Nova empresa',
			page: 'empresas',
			currentAdmin: req.session.adminUser,
			formMode: 'create',
			formAction: '/admin/empresas',
			formError: 'Preencha nome, slug, telefone e endereco para continuar.',
			companyForm,
		});
	}

	try {
		await adminCompanies.createCompany(req.session.adminUser.token, companyForm);
		req.session.flashMessage = {
			type: 'success',
			text: 'Empresa criada com sucesso.',
		};
		return res.redirect('/admin/empresas');
	} catch (error) {
		return res.status(error.statusCode || 500).render('backoffice/companies/form', {
			title: 'Nova empresa',
			page: 'empresas',
			currentAdmin: req.session.adminUser,
			formMode: 'create',
			formAction: '/admin/empresas',
			formError: error.message,
			companyForm,
		});
	}
});

router.get('/admin/empresas/:id/editar', ensureRoles(['master'], 'Voce nao tem permissao para acessar o cadastro de empresas.'), async (req, res) => {
	try {
		const company = await adminCompanies.getCompanyById(req.session.adminUser.token, req.params.id);

		return res.render('backoffice/companies/form', {
			title: 'Editar empresa',
			page: 'empresas',
			currentAdmin: req.session.adminUser,
			formMode: 'edit',
			formAction: `/admin/empresas/${req.params.id}/status`,
			formError: null,
			companyForm: buildCompanyForm(company),
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar a empresa para edicao.',
		};
		return res.redirect('/admin/empresas');
	}
});

router.post('/admin/empresas/:id/status', ensureRoles(['master'], 'Voce nao tem permissao para acessar o cadastro de empresas.'), async (req, res) => {
	const companyForm = buildCompanyForm(req.body);

	try {
		await adminCompanies.updateCompanyStatus(req.session.adminUser.token, req.params.id, companyForm.status);
		req.session.flashMessage = {
			type: 'success',
			text: companyForm.status === 'Ativa' ? 'Empresa ativada com sucesso.' : 'Empresa inativada com sucesso.',
		};
		return res.redirect('/admin/empresas');
	} catch (error) {
		return res.status(error.statusCode || 500).render('backoffice/companies/form', {
			title: 'Editar empresa',
			page: 'empresas',
			currentAdmin: req.session.adminUser,
			formMode: 'edit',
			formAction: `/admin/empresas/${req.params.id}/status`,
			formError: error.message,
			companyForm,
		});
	}
});

module.exports = router;