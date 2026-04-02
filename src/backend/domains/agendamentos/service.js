const repository = require('./repository');
const profissionaisRepository = require('../profissionais/repository');

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function ensureCompanyAccess(viewer, companyId) {
	if (!companyId) {
		throw createError('Empresa nao informada', 422);
	}

	if (!viewer?.nivel) {
		throw createError('Usuario autenticado nao informado', 401);
	}

	if (viewer.nivel === 'master') {
		return String(companyId);
	}

	if (viewer.nivel !== 'admin' && viewer.nivel !== 'agente') {
		throw createError('Permission denied', 403);
	}

	if (String(viewer.empresa_id || '') !== String(companyId)) {
		throw createError('Access denied to this company', 403);
	}

	return String(companyId);
}

function parseDate(value) {
	const date = new Date(String(value || '').trim());
	if (Number.isNaN(date.getTime())) {
		throw createError('Formato de data invalido', 422);
	}

	return date;
}

function parseDateOnly(value) {
	const text = String(value || '').trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
		throw createError('Formato de data invalido. Use YYYY-MM-DD', 400);
	}

	const date = new Date(`${text}T00:00:00`);
	if (Number.isNaN(date.getTime())) {
		throw createError('Formato de data invalido. Use YYYY-MM-DD', 400);
	}

	return text;
}

function toDayInterval(dateText) {
	const start = new Date(`${dateText}T00:00:00`);
	const end = new Date(`${dateText}T23:59:59.999`);
	return {
		start: start.toISOString(),
		end: end.toISOString(),
	};
}

function normalizeAppointment(appointment = {}) {
	return {
		id: appointment.id,
		empresa_id: appointment.empresa_id,
		profissional_id: appointment.profissional_id,
		cliente_id: appointment.cliente_id,
		servico_id: appointment.servico_id,
		data_hora_inicio: appointment.data_hora_inicio,
		data_hora_fim: appointment.data_hora_fim,
		status: appointment.status || 'agendado',
		created_at: appointment.created_at,
	};
}

async function resolveClient(companyId, clientName, clientPhone) {
	const existing = await repository.findClientByPhoneAndCompany(clientPhone, companyId);
	if (existing) {
		await repository.updateClientLastContact(existing.id);
		return existing;
	}

	return repository.createClient({
		nome: clientName,
		telefone: clientPhone,
		empresaId: companyId,
	});
}

async function validateAppointmentReferences({ companyId, serviceId, professionalId, startDate }) {
	const service = await repository.findServiceById(serviceId);
	if (!service) {
		throw createError('Servico nao encontrado', 404);
	}

	if (String(service.empresa_id) !== String(companyId)) {
		throw createError('Access denied to this service', 403);
	}

	const professional = await repository.findProfessionalById(professionalId);
	if (!professional || !professional.ativo) {
		throw createError('Profissional nao encontrado', 404);
	}

	if (String(professional.empresa_id) !== String(companyId)) {
		throw createError('Access denied to this professional', 403);
	}

	const durationMinutes = Number(service.duracao_minutos || 0);
	if (!durationMinutes || durationMinutes < 1) {
		throw createError('Duracao do servico invalida', 422);
	}

	const endDate = new Date(startDate.getTime() + (durationMinutes * 60000));
	const conflicts = await repository.listOverlappingAppointments(professional.id, startDate.toISOString(), endDate.toISOString());
	if (conflicts.length > 0) {
		throw createError('Horario indisponivel para este profissional', 409);
	}

	return {
		service,
		professional,
		endDate,
	};
}

async function listAppointmentsByDateDetailed(viewer, { empresa_id, data }) {
	const companyId = ensureCompanyAccess(viewer, empresa_id);
	const dateText = parseDateOnly(data);
	const interval = toDayInterval(dateText);
	return repository.listDetailedAppointmentsByDate(companyId, interval.start, interval.end);
}

async function listAppointments(viewer, query) {
	const date = parseDateOnly(query.data);
	const companyId = ensureCompanyAccess(viewer, query.empresa_id);
	const interval = toDayInterval(date);
	const appointments = await repository.listAppointmentsByDate(companyId, interval.start, interval.end);

	return appointments.map((item) => ({
		...normalizeAppointment(item),
		nome: item.nome || '',
	}));
}

async function listDetailedAppointments(viewer, companyId) {
	const scopedCompanyId = ensureCompanyAccess(viewer, companyId);
	return repository.listDetailedAppointmentsByCompany(scopedCompanyId);
}

async function createAppointment(viewer, input) {
	const clientName = String(input.cliente_nome || '').trim();
	const clientPhone = String(input.cliente_telefone || '').trim();
	const serviceId = String(input.servico_id || '').trim();
	const professionalId = String(input.profissional_id || '').trim();
	const companyId = ensureCompanyAccess(viewer, input.empresa_id);
	const startDate = parseDate(input.data_inicio);

	if (!clientName || !clientPhone || !serviceId || !professionalId) {
		throw createError('data_inicio, cliente_nome, cliente_telefone, servico_id, profissional_id e empresa_id sao obrigatorios', 422);
	}

	const { service, professional, endDate } = await validateAppointmentReferences({
		companyId,
		serviceId,
		professionalId,
		startDate,
	});

	const client = await resolveClient(companyId, clientName, clientPhone);
	const created = await repository.createAppointment({
		companyId,
		professionalId: professional.id,
		clientId: client.id,
		serviceId: service.id,
		startDateTime: startDate.toISOString(),
		endDateTime: endDate.toISOString(),
	});

	return normalizeAppointment(created);
}

async function createPublicAppointment(input) {
	const companyId = String(input.empresa_id || '').trim();
	const serviceId = String(input.servico_id || '').trim();
	const professionalId = String(input.profissional_id || '').trim();
	const clientId = String(input.cliente_id || '').trim();
	const startDate = parseDate(input.data_inicio);

	if (!companyId || !serviceId || !professionalId || !clientId) {
		throw createError('data_inicio, servico_id, profissional_id, empresa_id e cliente_id sao obrigatorios', 422);
	}

	const { service, professional, endDate } = await validateAppointmentReferences({
		companyId,
		serviceId,
		professionalId,
		startDate,
	});

	const jsDay = startDate.getDay(); // 0=Sun..6=Sat
	const scales = await profissionaisRepository.listScalesByProfessional(professionalId);
	const hasPythonConvention = scales.some((s) => s.dia_semana === 0);
	const targetDay = hasPythonConvention ? (jsDay + 6) % 7 : (jsDay === 0 ? 7 : jsDay);
	const hasScale = scales.some((s) => Number(s.dia_semana) === targetDay);
	if (!hasScale) {
		throw createError('Profissional nao trabalha neste dia', 422);
	}

	const client = await repository.findClientById(clientId);
	if (!client) {
		throw createError('Cliente nao encontrado', 404);
	}

	if (String(client.empresa_id || '') !== String(companyId)) {
		throw createError('Sessao nao pertence a empresa informada', 403);
	}

	await repository.updateClientLastContact(client.id);

	const created = await repository.createAppointment({
		companyId,
		professionalId: professional.id,
		clientId: client.id,
		serviceId: service.id,
		startDateTime: startDate.toISOString(),
		endDateTime: endDate.toISOString(),
	});

	return {
		...normalizeAppointment(created),
		cliente_id: client.id,
		empresa_id: companyId,
	};
}

async function listPublicClientAppointments(input) {
	const companyId = String(input.empresa_id || '').trim();
	const clientId = String(input.cliente_id || '').trim();

	if (!companyId || !clientId) {
		throw createError('empresa_id e cliente_id sao obrigatorios', 422);
	}

	const client = await repository.findClientById(clientId);
	if (!client) {
		throw createError('Cliente nao encontrado', 404);
	}

	if (String(client.empresa_id || '') !== String(companyId)) {
		throw createError('Sessao invalida para esta empresa', 403);
	}

	const appointments = await repository.listPublicAppointmentsByClient(companyId, clientId, 5);
	return appointments.map((item) => ({
		id: item.id,
		ticket_id: `ATD-${String(item.id || '').split('-')[0].toUpperCase()}`,
		status: item.status,
		servico: item.servico,
		valor: Number(item.valor || 0),
		profissional: item.profissional || '',
		data_agendamento: item.data_hora_inicio,
	}));
}

async function updateAppointmentStatus(viewer, appointmentId, newStatus) {
	const status = String(newStatus || '').trim();
	if (!status) {
		throw createError('novo_status e obrigatorio', 422);
	}

	const appointment = await repository.findAppointmentById(appointmentId);
	if (!appointment) {
		throw createError('Agendamento nao encontrado', 404);
	}

	ensureCompanyAccess(viewer, appointment.empresa_id);
 await repository.updateAppointmentStatus(appointmentId, status);

	return {
		status: 'atualizado',
		novo_status: status,
	};
}

module.exports = {
	listAppointments,
	listAppointmentsByDateDetailed,
	listDetailedAppointments,
	createAppointment,
	createPublicAppointment,
	listPublicClientAppointments,
	updateAppointmentStatus,
};