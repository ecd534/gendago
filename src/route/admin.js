const express = require('express');

const adminAuth = require('../service/adminAuth');
const adminAgendamentos = require('../service/adminAgendamentos');
const adminCategories = require('../service/adminCategories');
const adminClientes = require('../service/adminClientes');
const adminCompanies = require('../service/adminCompanies');
const adminPermissions = require('../service/adminPermissions');
const adminProfessionals = require('../service/adminProfessionals');
const adminServices = require('../service/adminServices');
const adminUsers = require('../service/adminUsers');

const router = express.Router();

router.use((req, res, next) => {
	if (req.path === '/Admin') {
		return res.redirect('/admin');
	}

	res.locals.sidebarMenuItems = adminPermissions.getSidebarMenuByRole(req.session?.adminUser?.role);

	return next();
});

function ensureAuthenticated(req, res, next) {
	if (req.session.adminUser) {
		return next();
	}

	return res.redirect('/admin/login');
}

function ensureRoles(roles, permissionMessage = 'Voce nao tem permissão para acessar este modulo.') {
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

function buildProfessionalForm(data = {}) {
	return {
		nome: data.nome || '',
		ativo: typeof data.ativo === 'boolean' ? data.ativo : true,
		empresa_id: data.empresa_id || '',
	};
}

function buildClientForm(data = {}) {
	return {
		nome: data.nome || '',
		telefone: data.telefone || '',
		email: data.email || '',
		idade: typeof data.idade === 'number' ? data.idade : data.idade || '',
		status: String(data.status || 'Ativo').trim() || 'Ativo',
		empresa_id: data.empresa_id || '',
	};
}

function currentAdminCompanyId(req) {
	return String(req.session.adminUser?.empresa || '').trim();
}

function resolveCompanyName(companyById, companyId, fallback = 'Empresa nao vinculada') {
	const normalizedCompanyId = String(companyId || '').trim();
	if (!normalizedCompanyId) {
		return 'Global';
	}

	return companyById.get(normalizedCompanyId)?.nome || fallback;
}

function resolveSessionCompanyName(req, companyById, companyId, fallback = 'Empresa nao vinculada') {
	return resolveCompanyName(
		companyById,
		companyId,
		req.session.adminUser?.empresa_nome || fallback,
	);
}

async function resolveCompaniesDirectory(token) {
	const companies = await adminCompanies.listCompanies(token);
	const companyById = new Map(companies.map((company) => [company.id, company]));

	return {
		companies,
		companyById,
	};
}

async function resolveUserFormContext(req, preferredCompanyId) {
	const role = req.session.adminUser.role;
	const token = req.session.adminUser.token;
	const directory = await resolveCompaniesDirectory(token);
	const isMaster = role === 'master';
	const selectedCompanyId = isMaster
		? String(preferredCompanyId || '').trim()
		: currentAdminCompanyId(req);
	const selectedCompanyName = resolveCompanyName(directory.companyById, selectedCompanyId, req.session.adminUser.empresa_nome || 'Empresa nao vinculada');

	return {
		activeCompanies: directory.companies,
		selectedCompanyId,
		selectedCompanyName,
		isMaster,
		companyById: directory.companyById,
	};
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

async function resolveProfessionalContext(req, preferredCompanyId) {
	const role = req.session.adminUser.role;
	const token = req.session.adminUser.token;
	const activeCompanies = role === 'master' ? await adminCompanies.listActiveCompanies(token) : [];
	const companyId = role === 'master'
		? String(preferredCompanyId || '').trim() || (activeCompanies[0] ? activeCompanies[0].id : '')
		: currentAdminCompanyId(req);
	const professionals = companyId ? await adminProfessionals.listProfessionalsByCompany(token, companyId) : [];

	return {
		activeCompanies,
		companyId,
		professionals,
	};
}

async function resolveAppointmentContext(req, preferredCompanyId, date) {
	const role = req.session.adminUser.role;
	const token = req.session.adminUser.token;
	const activeCompanies = role === 'master' ? await adminCompanies.listActiveCompanies(token) : [];
	const companyId = role === 'master'
		? String(preferredCompanyId || '').trim() || (activeCompanies[0] ? activeCompanies[0].id : '')
		: currentAdminCompanyId(req);
	const appointments = companyId ? await adminAgendamentos.listByDate(token, companyId, date) : [];

	return {
		activeCompanies,
		companyId,
		appointments,
	};
}

async function resolveClientContext(req, preferredCompanyId) {
	const role = req.session.adminUser.role;
	const token = req.session.adminUser.token;
	const activeCompanies = role === 'master' ? await adminCompanies.listActiveCompanies(token) : [];
	const companyId = role === 'master'
		? String(preferredCompanyId || '').trim() || (activeCompanies[0] ? activeCompanies[0].id : '')
		: currentAdminCompanyId(req);
	const clients = await adminClientes.listClientesByCompany(token, companyId);

	return {
		activeCompanies,
		companyId,
		clients,
	};
}

async function assertProfessionalAccess(req, professionalId, companyId) {
	if (!companyId || !professionalId) {
		return false;
	}

	const professionals = await adminProfessionals.listProfessionalsByCompany(req.session.adminUser.token, companyId);
	return professionals.some((professional) => professional.id === professionalId);
}

async function assertClientAccess(req, clientId, companyId) {
	if (!clientId) {
		return false;
	}

	try {
		const client = await adminClientes.getClienteById(req.session.adminUser.token, clientId);
		if (!client || !client.id) {
			return false;
		}

		if (req.session.adminUser.role !== 'master') {
			return client.empresa_id === currentAdminCompanyId(req);
		}

		if (companyId) {
			return client.empresa_id === companyId;
		}

		return true;
	} catch (error) {
		return false;
	}
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

	if (authenticatedUser.empresa && authenticatedUser.token) {
		try {
			const company = await adminCompanies.getCompanyById(authenticatedUser.token, authenticatedUser.empresa);
			authenticatedUser.empresa_nome = company?.nome || authenticatedUser.empresa;
		} catch (error) {
			authenticatedUser.empresa_nome = authenticatedUser.empresa;
		}
	} else {
		authenticatedUser.empresa_nome = 'Global';
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

router.get('/admin/usuarios', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
	try {
		const users = await adminUsers.listUsers(req.session.adminUser.token);
		const directory = await resolveCompaniesDirectory(req.session.adminUser.token);
		const decoratedUsers = users.map((user) => ({
			...user,
			empresa_nome: resolveCompanyName(directory.companyById, user.empresa_id),
		}));

		return res.render('backoffice/users/index', {
			title: 'Usuarios',
			page: 'usuarios',
			currentAdmin: req.session.adminUser,
			users: decoratedUsers,
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar os usuarios.',
		};
		return res.redirect('/admin');
	}
});

router.get('/admin/usuarios/novo', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
	const userForm = buildUserForm();
	if (req.session.adminUser.role !== 'master') {
		userForm.empresa_id = currentAdminCompanyId(req);
	}

	const userContext = await resolveUserFormContext(req, userForm.empresa_id);

	return res.render('backoffice/users/form', {
		title: 'Novo usuario',
		page: 'usuarios',
		currentAdmin: req.session.adminUser,
		formMode: 'create',
		formAction: '/admin/usuarios',
		formError: null,
		userForm,
		levelOptions: getAllowedLevels(req.session.adminUser.role),
		activeCompanies: userContext.activeCompanies,
		selectedCompanyId: userContext.selectedCompanyId,
		selectedCompanyName: userContext.selectedCompanyName,
		isMaster: userContext.isMaster,
	});
});

router.post('/admin/usuarios', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
	const userForm = buildUserForm({
		...req.body,
		ativo: parseBoolean(req.body.ativo, true),
	});
	if (req.session.adminUser.role !== 'master') {
		userForm.empresa_id = currentAdminCompanyId(req);
	}
	const userContext = await resolveUserFormContext(req, userForm.empresa_id);

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
			activeCompanies: userContext.activeCompanies,
			selectedCompanyId: userContext.selectedCompanyId,
			selectedCompanyName: userContext.selectedCompanyName,
			isMaster: userContext.isMaster,
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
			activeCompanies: userContext.activeCompanies,
			selectedCompanyId: userContext.selectedCompanyId,
			selectedCompanyName: userContext.selectedCompanyName,
			isMaster: userContext.isMaster,
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
			activeCompanies: userContext.activeCompanies,
			selectedCompanyId: userContext.selectedCompanyId,
			selectedCompanyName: userContext.selectedCompanyName,
			isMaster: userContext.isMaster,
		});
	}
});

router.get('/admin/usuarios/:id/editar', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
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
			...(await resolveUserFormContext(req, user.empresa_id)),
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar o usuario para edicao.',
		};
		return res.redirect('/admin/usuarios');
	}
});

router.post('/admin/usuarios/:id', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
	const userForm = buildUserForm({
		...req.body,
		ativo: parseBoolean(req.body.ativo, true),
	});
	if (req.session.adminUser.role !== 'master') {
		userForm.empresa_id = currentAdminCompanyId(req);
	}
	const userContext = await resolveUserFormContext(req, userForm.empresa_id);

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
			activeCompanies: userContext.activeCompanies,
			selectedCompanyId: userContext.selectedCompanyId,
			selectedCompanyName: userContext.selectedCompanyName,
			isMaster: userContext.isMaster,
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
			activeCompanies: userContext.activeCompanies,
			selectedCompanyId: userContext.selectedCompanyId,
			selectedCompanyName: userContext.selectedCompanyName,
			isMaster: userContext.isMaster,
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
			activeCompanies: userContext.activeCompanies,
			selectedCompanyId: userContext.selectedCompanyId,
			selectedCompanyName: userContext.selectedCompanyName,
			isMaster: userContext.isMaster,
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
			activeCompanies: userContext.activeCompanies,
			selectedCompanyId: userContext.selectedCompanyId,
			selectedCompanyName: userContext.selectedCompanyName,
			isMaster: userContext.isMaster,
		});
	}
});

router.post('/admin/usuarios/:id/status', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar o cadastro de usuarios.'), async (req, res) => {
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

router.get('/admin/api/empresas/:empresaId/categorias', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar categorias.'), async (req, res) => {
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

router.post('/admin/api/categorias', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para criar categorias.'), async (req, res) => {
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

router.patch('/admin/api/categorias/:id', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para atualizar categorias.'), async (req, res) => {
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

router.get('/admin/servicos', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar o cadastro de servicos.'), async (req, res) => {
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
			empresa_nome: resolveSessionCompanyName(req, companiesById, service.empresa_id),
		}));

		return res.render('backoffice/services/index', {
			title: 'Servicos',
			page: 'servicos-categorias',
			currentAdmin: req.session.adminUser,
			services: decoratedServices,
			activeCompanies: serviceContext.activeCompanies,
			selectedCompanyId: serviceContext.companyId,
			selectedCompanyName: resolveSessionCompanyName(req, companiesById, serviceContext.companyId),
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

router.get('/admin/servicos/novo', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar o cadastro de servicos.'), async (req, res) => {
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
			selectedCompanyName: serviceContext.activeCompanies.find((company) => company.id === serviceContext.companyId)?.nome || req.session.adminUser.empresa_nome || 'Empresa nao vinculada',
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

router.post('/admin/servicos', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar o cadastro de servicos.'), async (req, res) => {
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

router.get('/admin/profissionais', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para acessar profissionais e configuracoes.'), async (req, res) => {
	try {
		const professionalContext = await resolveProfessionalContext(req, req.query.empresa_id);
		const companiesById = new Map(professionalContext.activeCompanies.map((company) => [company.id, company]));

		return res.render('backoffice/profissionais/index', {
			title: 'Profissionais',
			page: 'profissionais-config',
			currentAdmin: req.session.adminUser,
			professionals: professionalContext.professionals,
			activeCompanies: professionalContext.activeCompanies,
			selectedCompanyId: professionalContext.companyId,
			selectedCompanyName: resolveSessionCompanyName(req, companiesById, professionalContext.companyId),
			isMaster: req.session.adminUser.role === 'master',
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar os profissionais.',
		};
		return res.redirect('/admin');
	}
});

router.get('/admin/api/profissionais', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para consultar profissionais.'), async (req, res) => {
	const preferredCompanyId = req.session.adminUser.role === 'master'
		? String(req.query.empresa_id || '').trim()
		: currentAdminCompanyId(req);

	try {
		const context = await resolveProfessionalContext(req, preferredCompanyId);
		return res.json({
			companyId: context.companyId,
			professionals: context.professionals,
		});
	} catch (error) {
		return res.status(500).json({ message: 'Nao foi possivel carregar os profissionais.' });
	}
});

router.post('/admin/api/profissionais', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para criar profissionais.'), async (req, res) => {
	const effectiveCompanyId = req.session.adminUser.role === 'master'
		? String(req.body.empresa_id || '').trim()
		: currentAdminCompanyId(req);
	const professionalForm = buildProfessionalForm({
		...req.body,
		empresa_id: effectiveCompanyId,
		ativo: parseBoolean(req.body.ativo, true),
	});

	if (!professionalForm.nome || !professionalForm.empresa_id) {
		return res.status(422).json({ message: 'Informe nome e empresa para criar o profissional.' });
	}

	try {
		const professional = await adminProfessionals.createProfessional(req.session.adminUser.token, professionalForm);
		return res.status(201).json(professional);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/admin/api/profissionais/:id/escalas', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para consultar escalas.'), async (req, res) => {
	const effectiveCompanyId = req.session.adminUser.role === 'master'
		? String(req.query.empresa_id || '').trim()
		: currentAdminCompanyId(req);

	if (!effectiveCompanyId) {
		return res.status(422).json({ message: 'Informe empresa para consultar escalas.' });
	}

	try {
		const hasAccess = await assertProfessionalAccess(req, req.params.id, effectiveCompanyId);
		if (!hasAccess) {
			return res.status(403).json({ message: 'Voce nao pode acessar escalas deste profissional.' });
		}

		const scales = await adminProfessionals.listScalesByProfessional(req.session.adminUser.token, req.params.id);
		return res.json(scales);
	} catch (error) {
		return res.status(500).json({ message: 'Nao foi possivel carregar as escalas.' });
	}
});

router.post('/admin/api/profissionais/:id/escalas', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para cadastrar escalas.'), async (req, res) => {
	const effectiveCompanyId = req.session.adminUser.role === 'master'
		? String(req.body.empresa_id || '').trim()
		: currentAdminCompanyId(req);
	const diaSemana = Number(req.body.dia_semana);
	const horaInicio = String(req.body.hora_inicio || '').trim();
	const horaFim = String(req.body.hora_fim || '').trim();

	if (!effectiveCompanyId) {
		return res.status(422).json({ message: 'Informe empresa para cadastrar a escala.' });
	}

	if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7 || !horaInicio || !horaFim) {
		return res.status(422).json({ message: 'Informe dia da semana (1 a 7) e faixa de horario valida.' });
	}

	try {
		const hasAccess = await assertProfessionalAccess(req, req.params.id, effectiveCompanyId);
		if (!hasAccess) {
			return res.status(403).json({ message: 'Voce nao pode cadastrar escala para este profissional.' });
		}

		const scale = await adminProfessionals.createScale(req.session.adminUser.token, {
			profissional_id: req.params.id,
			dia_semana: diaSemana,
			hora_inicio: horaInicio,
			hora_fim: horaFim,
		});
		return res.status(201).json(scale);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/admin/api/profissionais/:id/bloqueios', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para consultar bloqueios.'), async (req, res) => {
	const effectiveCompanyId = req.session.adminUser.role === 'master'
		? String(req.query.empresa_id || '').trim()
		: currentAdminCompanyId(req);

	if (!effectiveCompanyId) {
		return res.status(422).json({ message: 'Informe empresa para consultar bloqueios.' });
	}

	try {
		const hasAccess = await assertProfessionalAccess(req, req.params.id, effectiveCompanyId);
		if (!hasAccess) {
			return res.status(403).json({ message: 'Voce nao pode acessar bloqueios deste profissional.' });
		}

		const blocks = await adminProfessionals.listBlocksByProfessional(req.session.adminUser.token, req.params.id);
		return res.json(blocks);
	} catch (error) {
		return res.status(500).json({ message: 'Nao foi possivel carregar os bloqueios.' });
	}
});

router.post('/admin/api/profissionais/:id/bloqueios', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para cadastrar bloqueios.'), async (req, res) => {
	const effectiveCompanyId = req.session.adminUser.role === 'master'
		? String(req.body.empresa_id || '').trim()
		: currentAdminCompanyId(req);
	const data = String(req.body.data || '').trim();
	const horaInicio = String(req.body.hora_inicio || '').trim();
	const horaFim = String(req.body.hora_fim || '').trim();
	const motivo = String(req.body.motivo || '').trim();

	if (!effectiveCompanyId) {
		return res.status(422).json({ message: 'Informe empresa para cadastrar o bloqueio.' });
	}

	if (!data || !horaInicio || !horaFim) {
		return res.status(422).json({ message: 'Informe data, hora inicio e hora fim para o bloqueio.' });
	}

	try {
		const hasAccess = await assertProfessionalAccess(req, req.params.id, effectiveCompanyId);
		if (!hasAccess) {
			return res.status(403).json({ message: 'Voce nao pode cadastrar bloqueio para este profissional.' });
		}

		const block = await adminProfessionals.createBlock(req.session.adminUser.token, {
			profissional_id: req.params.id,
			data,
			hora_inicio: horaInicio,
			hora_fim: horaFim,
			motivo,
		});
		return res.status(201).json(block);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/admin/clientes', ensureRoles(adminPermissions.modules.masterAdminAgente, 'Voce nao tem permissao para acessar o cadastro de clientes.'), async (req, res) => {
	try {
		const clientContext = await resolveClientContext(req, req.query.empresa_id);
		const companiesById = new Map(clientContext.activeCompanies.map((company) => [company.id, company]));

		return res.render('backoffice/clientes/index', {
			title: 'Clientes',
			page: 'clientes',
			currentAdmin: req.session.adminUser,
			clients: clientContext.clients,
			activeCompanies: clientContext.activeCompanies,
			selectedCompanyId: clientContext.companyId,
			selectedCompanyName: resolveSessionCompanyName(req, companiesById, clientContext.companyId),
			isMaster: req.session.adminUser.role === 'master',
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar os clientes.',
		};
		return res.redirect('/admin');
	}
});

router.get('/admin/api/clientes', ensureRoles(adminPermissions.modules.masterAdminAgente, 'Voce nao tem permissao para consultar clientes.'), async (req, res) => {
	const preferredCompanyId = req.session.adminUser.role === 'master'
		? String(req.query.empresa_id || '').trim()
		: currentAdminCompanyId(req);

	try {
		const context = await resolveClientContext(req, preferredCompanyId);
		return res.json({
			companyId: context.companyId,
			clients: context.clients,
		});
	} catch (error) {
		return res.status(500).json({ message: 'Nao foi possivel carregar os clientes.' });
	}
});

router.post('/admin/api/clientes', ensureRoles(adminPermissions.modules.masterAdmin, 'Voce nao tem permissao para criar clientes.'), async (req, res) => {
	const effectiveCompanyId = req.session.adminUser.role === 'master'
		? String(req.body.empresa_id || '').trim()
		: currentAdminCompanyId(req);
	const clientForm = buildClientForm({
		...req.body,
		empresa_id: effectiveCompanyId,
	});

	if (!clientForm.nome || !clientForm.telefone || !clientForm.empresa_id) {
		return res.status(422).json({ message: 'Informe nome, telefone e empresa para criar o cliente.' });
	}

	try {
		const client = await adminClientes.createCliente(req.session.adminUser.token, clientForm);
		return res.status(201).json(client);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/admin/api/clientes/:id', ensureRoles(adminPermissions.modules.masterAdminAgente, 'Voce nao tem permissao para consultar cliente.'), async (req, res) => {
	const effectiveCompanyId = req.session.adminUser.role === 'master'
		? String(req.query.empresa_id || '').trim()
		: currentAdminCompanyId(req);

	try {
		const hasAccess = await assertClientAccess(req, req.params.id, effectiveCompanyId);
		if (!hasAccess) {
			return res.status(403).json({ message: 'Voce nao pode acessar este cliente.' });
		}

		const client = await adminClientes.getClienteById(req.session.adminUser.token, req.params.id);
		return res.json(client);
	} catch (error) {
		return res.status(500).json({ message: 'Nao foi possivel carregar o cliente.' });
	}
});

router.patch('/admin/api/clientes/:id', ensureRoles(adminPermissions.modules.masterAdminAgente, 'Voce nao tem permissao para atualizar cliente.'), async (req, res) => {
	const effectiveCompanyId = req.session.adminUser.role === 'master'
		? String(req.body.empresa_id || '').trim()
		: currentAdminCompanyId(req);
	const clientForm = buildClientForm({
		...req.body,
		empresa_id: effectiveCompanyId,
	});

	if (!clientForm.nome || !clientForm.telefone || !clientForm.empresa_id) {
		return res.status(422).json({ message: 'Informe nome, telefone e empresa para atualizar o cliente.' });
	}

	try {
		const hasAccess = await assertClientAccess(req, req.params.id, effectiveCompanyId);
		if (!hasAccess) {
			return res.status(403).json({ message: 'Voce nao pode atualizar este cliente.' });
		}

		const client = await adminClientes.updateCliente(req.session.adminUser.token, req.params.id, clientForm);
		return res.json(client);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/admin/empresas', ensureRoles(adminPermissions.modules.master, 'Voce nao tem permissao para acessar o cadastro de empresas.'), async (req, res) => {
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

router.get('/admin/empresas/nova', ensureRoles(adminPermissions.modules.master, 'Voce nao tem permissao para acessar o cadastro de empresas.'), (req, res) => {
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

router.post('/admin/empresas', ensureRoles(adminPermissions.modules.master, 'Voce nao tem permissao para acessar o cadastro de empresas.'), async (req, res) => {
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

router.get('/admin/empresas/:id/editar', ensureRoles(adminPermissions.modules.master, 'Voce nao tem permissao para acessar o cadastro de empresas.'), async (req, res) => {
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

router.post('/admin/empresas/:id/status', ensureRoles(adminPermissions.modules.master, 'Voce nao tem permissao para acessar o cadastro de empresas.'), async (req, res) => {
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

router.get('/admin/agendamentos', ensureRoles(adminPermissions.modules.masterAdminAgente, 'Voce nao tem permissao para acessar o gerenciamento de agendamentos.'), async (req, res) => {
	const today = new Date().toISOString().slice(0, 10);
	const date = String(req.query.data || today).slice(0, 10) || today;
	const preferredCompanyId = String(req.query.empresa_id || '').trim();

	try {
		const context = await resolveAppointmentContext(req, preferredCompanyId, date);
		const companiesById = new Map(context.activeCompanies.map((c) => [c.id, c]));

		return res.render('backoffice/agendamentos/index', {
			title: 'Gerenciar Agendamentos',
			page: 'agendamentos',
			currentAdmin: req.session.adminUser,
			appointments: context.appointments,
			activeCompanies: context.activeCompanies,
			selectedCompanyId: context.companyId,
			selectedCompanyName: resolveSessionCompanyName(req, companiesById, context.companyId),
			selectedDate: date,
			isMaster: req.session.adminUser.role === 'master',
		});
	} catch (error) {
		req.session.flashMessage = {
			type: 'danger',
			text: 'Nao foi possivel carregar os agendamentos.',
		};
		return res.redirect('/admin');
	}
});

router.get('/admin/api/agendamentos', ensureRoles(adminPermissions.modules.masterAdminAgente, 'Voce nao tem permissao para consultar agendamentos.'), async (req, res) => {
	const today = new Date().toISOString().slice(0, 10);
	const date = String(req.query.data || today).slice(0, 10) || today;
	const preferredCompanyId = req.session.adminUser.role === 'master'
		? String(req.query.empresa_id || '').trim()
		: currentAdminCompanyId(req);

	try {
		const context = await resolveAppointmentContext(req, preferredCompanyId, date);
		return res.json({ appointments: context.appointments, companyId: context.companyId });
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.patch('/admin/api/agendamentos/:id/status', ensureRoles(adminPermissions.modules.masterAdminAgente, 'Voce nao tem permissao para atualizar o status de agendamentos.'), async (req, res) => {
	const newStatus = String(req.body.novo_status || req.query.novo_status || '').trim();
	if (!newStatus) {
		return res.status(422).json({ message: 'novo_status e obrigatorio.' });
	}

	try {
		const result = await adminAgendamentos.updateStatus(req.session.adminUser.token, req.params.id, newStatus);
		return res.json(result);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

module.exports = router;