const express = require('express');

const publicStore = require('../service/publicStore');
const clientesService = require('../backend/domains/clientes/service');
const { createClientAccessToken, verifyClientAccessToken } = require('../backend/security/jwt');

const router = express.Router();
const CLIENT_COOKIE_NAME = 'cliente_session';
const CLIENT_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 8;

function buildDatetime(data, hora) {
	const date = String(data || '').trim();
	const hour = String(hora || '').trim();

	if (!date || !hour) {
		return '';
	}

	const fullHour = hour.length === 5 ? `${hour}:00` : hour;
	return `${date}T${fullHour}`;
}

function parseCookies(cookieHeader) {
	const source = String(cookieHeader || '').trim();
	if (!source) {
		return {};
	}

	return source.split(';').reduce((acc, chunk) => {
		const [rawKey, ...rest] = chunk.split('=');
		const key = String(rawKey || '').trim();
		if (!key) {
			return acc;
		}

		acc[key] = decodeURIComponent(rest.join('=').trim());
		return acc;
	}, {});
}

function getClientTokenFromRequest(req) {
	const cookies = parseCookies(req.headers.cookie || '');
	return cookies[CLIENT_COOKIE_NAME] || '';
}

function setClientSessionCookie(res, token) {
	res.cookie(CLIENT_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: CLIENT_COOKIE_MAX_AGE_MS,
		path: '/',
	});
}

function clearClientSessionCookie(res) {
	res.clearCookie(CLIENT_COOKIE_NAME, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
	});
}

async function resolveAuthenticatedClient(req, companyId) {
	const token = getClientTokenFromRequest(req);
	if (!token) {
		return null;
	}

	const session = verifyClientAccessToken(token);
	if (!session || String(session.empresa_id || '') !== String(companyId || '')) {
		return null;
	}

	try {
		const client = await clientesService.getPublicClientById(companyId, session.cliente_id);
		return {
			session,
			client,
		};
	} catch (error) {
		return null;
	}
}

async function resolveStoreContext(slug) {
	const company = await publicStore.resolveCompanyBySlug(slug);
	if (!company) {
		return null;
	}

	const vitrine = await publicStore.getPublicVitrine(company.id);
	return {
		company: {
			...company,
			...(vitrine.company && vitrine.company.id ? vitrine.company : {}),
		},
		vitrine,
	};
}

router.get('/app/:slug', async (req, res) => {
	try {
		const context = await resolveStoreContext(req.params.slug);
		if (!context) {
			return res.status(404).render('webapp/not-found', {
				title: 'Loja nao encontrada',
				slug: req.params.slug,
				message: '',
			});
		}

		const auth = await resolveAuthenticatedClient(req, context.company.id);

		return res.render('webapp/store', {
			title: context.company.nome || 'Loja',
			company: context.company,
			services: context.vitrine.services,
			categories: context.vitrine.categories,
			slug: req.params.slug,
			authenticatedClient: auth?.client || null,
		});
	} catch (error) {
		return res.status(500).render('webapp/not-found', {
			title: 'Erro ao carregar loja',
			slug: req.params.slug,
			message: 'Nao foi possivel carregar esta loja no momento.',
		});
	}
});

router.post('/app/api/:slug/auth/login', async (req, res) => {
	const identifier = String(req.body.email_ou_telefone || req.body.identificador || '').trim();
	const password = String(req.body.senha || '').trim();

	if (!identifier || !password) {
		return res.status(422).json({ message: 'Informe seu email ou telefone com o ddd e a senha.' });
	}

	try {
		const context = await resolveStoreContext(req.params.slug);
		if (!context) {
			return res.status(404).json({ message: 'Loja nao encontrada.' });
		}

		const client = await clientesService.loginPublicClient({
			identificador: identifier,
			senha: password,
			empresa_id: context.company.id,
		});

		const token = createClientAccessToken({
			clienteId: client.id,
			email: client.email,
			nome: client.nome,
			empresaId: context.company.id,
		});

		setClientSessionCookie(res, token);

		return res.json({
			message: 'Login realizado com sucesso.',
			cliente: client,
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message || 'Nao foi possivel concluir o login.' });
	}
});

router.post('/app/api/:slug/auth/cadastro', async (req, res) => {
	try {
		const context = await resolveStoreContext(req.params.slug);
		if (!context) {
			return res.status(404).json({ message: 'Loja nao encontrada.' });
		}

		const client = await clientesService.registerPublicClient({
			nome_completo: req.body.nome_completo,
			email: req.body.email,
			telefone: req.body.telefone,
			senha: req.body.senha,
			empresa_id: context.company.id,
		});

		const token = createClientAccessToken({
			clienteId: client.id,
			email: client.email,
			nome: client.nome,
			empresaId: context.company.id,
		});

		setClientSessionCookie(res, token);

		return res.status(201).json({
			message: 'Cadastro realizado com sucesso.',
			cliente: client,
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message || 'Nao foi possivel concluir o cadastro.' });
	}
});

router.get('/app/api/:slug/auth/me', async (req, res) => {
	try {
		const context = await resolveStoreContext(req.params.slug);
		if (!context) {
			return res.status(404).json({ message: 'Loja nao encontrada.' });
		}

		const auth = await resolveAuthenticatedClient(req, context.company.id);
		if (!auth) {
			return res.status(401).json({ message: 'Cliente nao autenticado.' });
		}

		return res.json({ cliente: auth.client });
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message || 'Nao foi possivel validar sessao.' });
	}
});

router.post('/app/api/:slug/auth/logout', async (req, res) => {
	clearClientSessionCookie(res);
	return res.json({ status: 'ok' });
});

router.get('/app/api/:slug/agendamentos/meus', async (req, res) => {
	try {
		const context = await resolveStoreContext(req.params.slug);
		if (!context) {
			return res.status(404).json({ message: 'Loja nao encontrada.' });
		}

		const auth = await resolveAuthenticatedClient(req, context.company.id);
		if (!auth?.client?.id) {
			return res.status(401).json({ message: 'Cliente nao autenticado.' });
		}

		const appointments = await publicStore.getPublicClientAppointments({
			empresa_id: context.company.id,
			cliente_id: auth.client.id,
		});

		return res.json({ agendamentos: appointments });
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message || 'Nao foi possivel carregar seus agendamentos.' });
	}
});

router.get('/app/api/:slug/servicos/:serviceId/profissionais', async (req, res) => {
	try {
		const context = await resolveStoreContext(req.params.slug);
		if (!context) {
			return res.status(404).json({ message: 'Loja nao encontrada.' });
		}

		const professionals = await publicStore.getProfessionalsByService(req.params.serviceId);
		return res.json({ professionals });
	} catch (error) {
		return res.status(500).json({ message: 'Nao foi possivel carregar os profissionais.' });
	}
});

router.get('/app/api/:slug/profissionais/:professionalId/disponibilidade', async (req, res) => {
	const date = String(req.query.data || '').trim();
	if (!date) {
		return res.status(422).json({ message: 'Informe a data para consultar disponibilidade.' });
	}

	try {
		const context = await resolveStoreContext(req.params.slug);
		if (!context) {
			return res.status(404).json({ message: 'Loja nao encontrada.' });
		}

		const slots = await publicStore.getProfessionalAvailability(req.params.professionalId, date);
		return res.json({ slots });
	} catch (error) {
		return res.status(500).json({ message: 'Nao foi possivel carregar a disponibilidade.' });
	}
});

router.post('/app/api/:slug/agendamentos/confirmar', async (req, res) => {
	const serviceId = String(req.body.servico_id || '').trim();
	const professionalId = String(req.body.profissional_id || '').trim();
	const date = String(req.body.data || '').trim();
	const time = String(req.body.hora || '').trim();

	if (!serviceId || !professionalId || !date || !time) {
		return res.status(422).json({ message: 'Informe servico, profissional, data e horario para confirmar.' });
	}

	try {
		const context = await resolveStoreContext(req.params.slug);
		if (!context) {
			return res.status(404).json({ message: 'Loja nao encontrada.' });
		}

		const auth = await resolveAuthenticatedClient(req, context.company.id);
		if (!auth?.client?.id) {
			return res.status(401).json({ message: 'Faca login para confirmar seu agendamento.' });
		}

		const dataInicio = buildDatetime(date, time);
		if (!dataInicio) {
			return res.status(422).json({ message: 'Data e horario invalidos para agendamento.' });
		}

		const booking = await publicStore.confirmPublicBooking({
			data_inicio: dataInicio,
			servico_id: serviceId,
			profissional_id: professionalId,
			empresa_id: context.company.id,
			cliente_id: auth.client.id,
		});

		return res.status(201).json({
			message: 'Agendamento confirmado com sucesso.',
			booking,
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message });
	}
});

router.post('/app/api/:slug/agendamentos/:appointmentId/cancelar', async (req, res) => {
	const appointmentId = String(req.params.appointmentId || '').trim();
	if (!appointmentId) {
		return res.status(422).json({ message: 'ID do agendamento nao informado.' });
	}

	try {
		const context = await resolveStoreContext(req.params.slug);
		if (!context) {
			return res.status(404).json({ message: 'Loja nao encontrada.' });
		}

		const auth = await resolveAuthenticatedClient(req, context.company.id);
		if (!auth?.client?.id) {
			return res.status(401).json({ message: 'Cliente nao autenticado.' });
		}

		// Get the appointment to verify it belongs to the client
		const allAppointments = await publicStore.getPublicClientAppointments({
			empresa_id: context.company.id,
			cliente_id: auth.client.id,
		});
		const appointment = allAppointments.find((apt) => String(apt.id) === appointmentId);
		if (!appointment) {
			return res.status(404).json({ message: 'Agendamento nao encontrado.' });
		}

		// Cancel the appointment by updating its status to "cancelado"
		const agendamentosService = require('../backend/domains/agendamentos/service');
		const result = await agendamentosService.updateAppointmentStatus(
			{ nivel: 'cliente', cliente_id: auth.client.id, empresa_id: context.company.id },
			appointmentId,
			'cancelado'
		);

		return res.json({
			message: 'Agendamento cancelado com sucesso.',
			result,
		});
	} catch (error) {
		return res.status(error.statusCode || 500).json({ message: error.message || 'Nao foi possivel cancelar o agendamento.' });
	}
});

module.exports = router;