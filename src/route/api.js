const express = require('express');

const usuariosService = require('../backend/domains/usuarios/service');
const empresasService = require('../backend/domains/empresas/service');
const catalogoService = require('../backend/domains/catalogo/service');
const profissionaisService = require('../backend/domains/profissionais/service');
const clientesService = require('../backend/domains/clientes/service');
const agendamentosService = require('../backend/domains/agendamentos/service');
const { requireAuth, requireRoles } = require('../backend/security/middleware');

const router = express.Router();

function parseBoolean(value, defaultValue) {
	if (typeof value === 'boolean') {
		return value;
	}

	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (['true', '1', 'sim', 'yes', 'on'].includes(normalized)) return true;
		if (['false', '0', 'nao', 'não', 'no', 'off'].includes(normalized)) return false;
	}

	return defaultValue;
}

router.get('/usuarios', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const users = await usuariosService.listUsers(req.query.empresa_id);
		return res.json(users);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/usuarios', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const created = await usuariosService.createUser(req.body || {});
		return res.status(201).json(created);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.put('/usuarios/:user_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const updated = await usuariosService.updateUser(req.params.user_id, req.body || {});
		return res.json(updated);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/usuarios/login', async (req, res) => {
	try {
		const session = await usuariosService.login({
			email: req.body?.email,
			senha: req.body?.senha,
		});
		return res.json(session);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/empresas', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const companies = await empresasService.listCompanies();
		return res.json(companies);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/empresas/:empresa_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const company = await empresasService.getCompanyById(req.params.empresa_id);
		return res.json(company);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/empresas', requireAuth, requireRoles(['master']), async (req, res) => {
	try {
		const company = await empresasService.createCompany(req.body || {});
		return res.status(201).json(company);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.patch('/empresas/:empresa_id', requireAuth, requireRoles(['master']), async (req, res) => {
	try {
		const payload = await empresasService.updateCompanyStatus(req.params.empresa_id, req.query.status);
		return res.json(payload);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/categorias/:empresa_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const categories = await catalogoService.listCategoriesByCompany(
			req.localUser,
			req.params.empresa_id,
			parseBoolean(req.query.apenas_ativas, true),
		);
		return res.json(categories);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/categorias', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const category = await catalogoService.createCategory(req.localUser, req.body || {});
		return res.status(201).json(category);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.patch('/categorias/:categoria_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const category = await catalogoService.updateCategory(req.localUser, req.params.categoria_id, {
			nome: req.query.nome,
			ativo: req.query.ativo,
		});
		return res.json(category);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/servicos/detalhe/:servico_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const service = await catalogoService.getServiceById(req.localUser, req.params.servico_id);
		return res.json(service);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/servicos/categoria/:categoria_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const services = await catalogoService.listServicesByCategory(req.localUser, req.params.categoria_id, req.query.apenas_ativos);
		return res.json(services);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/servicos/empresa/:empresa_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const services = await catalogoService.listServicesByCompany(req.localUser, req.params.empresa_id, req.query.apenas_ativos);
		return res.json(services);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/servicos/:empresa_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const services = await catalogoService.listServicesByCompany(req.localUser, req.params.empresa_id, req.query.apenas_ativos);
		return res.json(services);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/servicos', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const service = await catalogoService.createService(req.localUser, req.body || {});
		return res.status(201).json(service);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/profissionais/:empresa_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const professionals = await profissionaisService.listProfessionalsByCompany(req.localUser, req.params.empresa_id);
		return res.json(professionals);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/profissionais', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const professional = await profissionaisService.createProfessional(req.localUser, req.body || {});
		return res.status(201).json(professional);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/escalas/:profissional_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const scales = await profissionaisService.listScalesByProfessional(req.localUser, req.params.profissional_id);
		return res.json(scales);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/escalas', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const payload = await profissionaisService.createScale(req.localUser, req.body || {});
		return res.status(201).json(payload);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/bloqueios/:profissional_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const blocks = await profissionaisService.listBlocksByProfessional(req.localUser, req.params.profissional_id);
		return res.json(blocks);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/bloqueios', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const payload = await profissionaisService.createBlock(req.localUser, req.body || {});
		return res.status(201).json(payload);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/disponibilidade', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const slots = await profissionaisService.getAvailability(
			req.localUser,
			req.query.profissional_id,
			req.query.data_consulta,
			req.query.servico_id,
		);
		return res.json(slots);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/clientes', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const clients = await clientesService.listClients(req.localUser, req.query.empresa_id || null);
		return res.json(clients);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/clientes/telefone/:telefone', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const clients = await clientesService.listClientsByPhone(req.localUser, req.params.telefone);
		return res.json(clients);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/clientes/:cliente_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const client = await clientesService.getClientById(req.localUser, req.params.cliente_id);
		return res.json(client);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/clientes', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const client = await clientesService.createClient(req.localUser, req.body || {});
		return res.status(201).json(client);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.patch('/clientes/:cliente_id', requireAuth, requireRoles(['master', 'admin']), async (req, res) => {
	try {
		const payload = await clientesService.updateClient(req.localUser, req.params.cliente_id, req.body || {});
		return res.json(payload);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/agendamentos', requireAuth, requireRoles(['master', 'admin', 'agente']), async (req, res) => {
	try {
		const payload = await agendamentosService.listAppointments(req.localUser, {
			data: req.query.data,
			empresa_id: req.query.empresa_id,
		});
		return res.json(payload);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/agendamentos', requireAuth, requireRoles(['master', 'admin', 'agente']), async (req, res) => {
	try {
		const created = await agendamentosService.createAppointment(req.localUser, req.body || {});
		return res.status(201).json(created);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.patch('/agendamentos/:agendamento_id/status', requireAuth, requireRoles(['master', 'admin', 'agente']), async (req, res) => {
	try {
		const payload = await agendamentosService.updateAppointmentStatus(
			req.localUser,
			req.params.agendamento_id,
			req.query.novo_status,
		);
		return res.json(payload);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.get('/agendamentos/detalhado/:empresa_id', requireAuth, requireRoles(['master', 'admin', 'agente']), async (req, res) => {
	try {
		const payload = await agendamentosService.listDetailedAppointments(req.localUser, req.params.empresa_id);
		return res.json(payload);
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

module.exports = router;
