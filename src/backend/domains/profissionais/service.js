const repository = require('./repository');

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function normalizeBoolean(value, defaultValue = true) {
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

	if (viewer.nivel !== 'admin') {
		throw createError('Permission denied', 403);
	}

	if (String(viewer.empresa_id || '') !== String(companyId)) {
		throw createError('Access denied to this company', 403);
	}

	return String(companyId);
}

function normalizeProfessional(professional = {}) {
	return {
		id: professional.id,
		nome: professional.nome || '',
		ativo: typeof professional.ativo === 'boolean' ? professional.ativo : true,
		empresa_id: professional.empresa_id || '',
	};
}

function normalizeScale(scale = {}) {
	return {
		id: scale.id,
		profissional_id: scale.profissional_id || '',
		dia_semana: Number(scale.dia_semana || 0),
		hora_inicio: String(scale.hora_inicio || '').slice(0, 8),
		hora_fim: String(scale.hora_fim || '').slice(0, 8),
	};
}

function normalizeBlock(block = {}) {
	return {
		id: block.id,
		profissional_id: block.profissional_id || '',
		data: block.data || '',
		hora_inicio: String(block.hora_inicio || '').slice(0, 8),
		hora_fim: String(block.hora_fim || '').slice(0, 8),
		motivo: block.motivo || 'Bloqueio manual',
	};
}

function normalizeService(service = {}) {
	return {
		id: service.id,
		nome: service.nome || '',
		preco: Number(service.preco || 0),
		duracao_minutos: Number(service.duracao_minutos || 0),
		empresa_id: service.empresa_id || '',
		categoria_id: service.categoria_id || '',
		ativo: typeof service.ativo === 'boolean' ? service.ativo : true,
	};
}

function parseDateOnly(value, message = 'Formato de data invalido. Use YYYY-MM-DD') {
	const text = String(value || '').trim();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
		throw createError(message, 400);
	}

	const date = new Date(`${text}T00:00:00`);
	if (Number.isNaN(date.getTime())) {
		throw createError(message, 400);
	}

	return date;
}

function parseTimeParts(value, label) {
	const text = String(value || '').trim();
	const match = text.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
	if (!match) {
		throw createError(`${label} invalida`, 422);
	}

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	const seconds = Number(match[3] || 0);
	return { hours, minutes, seconds, text: `${match[1]}:${match[2]}:${String(seconds).padStart(2, '0')}` };
}

function timePartsToSeconds(parts) {
	return (parts.hours * 3600) + (parts.minutes * 60) + parts.seconds;
}

function combineDateAndTime(date, timeValue) {
	const parts = parseTimeParts(timeValue, 'Hora');
	const dateTime = new Date(date.getTime());
	dateTime.setHours(parts.hours, parts.minutes, parts.seconds, 0);
	return dateTime;
}

function chooseScaleForDate(scales, date) {
	const normalized = scales.map(normalizeScale);
	// Detect convention: dia_semana=0 only exists in Python legacy records (Mon=0..Sun=6).
	// Node.js admin stores Mon=1..Sun=7. The two conventions share the value 6
	// (Python Sun=6 vs Node Sat=6), so we must pick ONE convention per professional.
	const hasPythonConvention = normalized.some((s) => s.dia_semana === 0);
	const jsDay = date.getDay(); // 0=Sun, 1=Mon … 6=Sat
	const targetDay = hasPythonConvention
		? (jsDay + 6) % 7          // Python: Mon=0 … Sun=6
		: (jsDay === 0 ? 7 : jsDay); // Node UI: Mon=1 … Sat=6, Sun=7
	return normalized.find((item) => item.dia_semana === targetDay) || null;
}

function overlapsTimeRange(slotStart, slotEnd, rangeStart, rangeEnd) {
	return slotStart < rangeEnd && slotEnd > rangeStart;
}

function getAppointmentEndDate(appointment) {
	const start = new Date(appointment.data_hora_inicio);
	const end = appointment.data_hora_fim ? new Date(appointment.data_hora_fim) : new Date(start.getTime() + 30 * 60000);
	return {
		start,
		end,
	};
}

async function getProfessionalOrThrow(professionalId) {
	const professional = await repository.findProfessionalById(professionalId);
	if (!professional) {
		throw createError('Profissional nao encontrado', 404);
	}

	return professional;
}

async function listProfessionalsByCompany(viewer, companyId) {
	const scopedCompanyId = ensureCompanyAccess(viewer, companyId);
	const professionals = await repository.listProfessionalsByCompany(scopedCompanyId);
	return professionals.map(normalizeProfessional);
}

async function createProfessional(viewer, input) {
	const payload = {
		nome: String(input.nome || '').trim(),
		ativo: normalizeBoolean(input.ativo, true),
		empresaId: ensureCompanyAccess(viewer, input.empresa_id),
	};

	if (!payload.nome) {
		throw createError('nome e empresa_id sao obrigatorios', 422);
	}

	const created = await repository.createProfessional(payload);
	return normalizeProfessional(created || payload);
}

async function listScalesByProfessional(viewer, professionalId) {
	const professional = await getProfessionalOrThrow(professionalId);
	ensureCompanyAccess(viewer, professional.empresa_id);
	const scales = await repository.listScalesByProfessional(professionalId);
	return scales.map(normalizeScale);
}

async function createScale(viewer, input) {
	const professional = await getProfessionalOrThrow(input.profissional_id);
	ensureCompanyAccess(viewer, professional.empresa_id);

	const dayOfWeek = Number(input.dia_semana);
	const start = parseTimeParts(input.hora_inicio, 'Hora de inicio');
	const end = parseTimeParts(input.hora_fim, 'Hora de fim');

	if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 7) {
		throw createError('dia_semana invalido', 422);
	}

	if (timePartsToSeconds(end) <= timePartsToSeconds(start)) {
		throw createError('A hora de fim deve ser maior que a hora de início.', 400);
	}

	const existing = await repository.findScaleByProfessionalAndDay(professional.id, dayOfWeek);
	if (existing) {
		await repository.deleteScale(existing.id);
	}

	await repository.createScale({
		professionalId: professional.id,
		dayOfWeek,
		startTime: start.text,
		endTime: end.text,
	});

	return { status: 'Escala atualizada' };
}

async function listBlocksByProfessional(viewer, professionalId) {
	const professional = await getProfessionalOrThrow(professionalId);
	ensureCompanyAccess(viewer, professional.empresa_id);
	const blocks = await repository.listBlocksByProfessional(professionalId);
	return blocks.map(normalizeBlock);
}

async function createBlock(viewer, input) {
	const professional = await getProfessionalOrThrow(input.profissional_id);
	ensureCompanyAccess(viewer, professional.empresa_id);

	const date = String(input.data || '').trim();
	parseDateOnly(date);
	const start = parseTimeParts(input.hora_inicio, 'Hora de inicio');
	const end = parseTimeParts(input.hora_fim, 'Hora de fim');

	if (timePartsToSeconds(end) <= timePartsToSeconds(start)) {
		throw createError('A hora de fim deve ser maior que a hora de início.', 400);
	}

	const block = await repository.createBlock({
		professionalId: professional.id,
		date,
		startTime: start.text,
		endTime: end.text,
		reason: String(input.motivo || '').trim() || 'Bloqueio manual',
	});

	return {
		status: 'Horário bloqueado com sucesso',
		id: block?.id,
	};
}

async function getAvailability(viewer, professionalId, dateConsulta, serviceId) {
	const professional = await getProfessionalOrThrow(professionalId);
	ensureCompanyAccess(viewer, professional.empresa_id);

	const service = await repository.findServiceById(serviceId);
	if (!service) {
		throw createError('Servico nao encontrado', 404);
	}

	if (String(service.empresa_id) !== String(professional.empresa_id)) {
		throw createError('Access denied to this service', 403);
	}

	const date = parseDateOnly(dateConsulta, 'Formato de data invalido. Use YYYY-MM-DD');
	const scales = await repository.listScalesByProfessional(professionalId);
	const scale = chooseScaleForDate(scales, date);
	if (!scale) {
		return [];
	}

	const dayStart = new Date(`${dateConsulta}T00:00:00`);
	const dayEnd = new Date(`${dateConsulta}T23:59:59.999`);
	const appointments = await repository.listOverlappingAppointments(professionalId, dayStart.toISOString(), dayEnd.toISOString());
	const blocks = await repository.listBlocksByProfessionalAndDate(professionalId, dateConsulta);
	const serviceDurationMinutes = Number(service.duracao_minutos || 0);

	const slotStart = combineDateAndTime(date, scale.hora_inicio);
	const workdayEnd = combineDateAndTime(date, scale.hora_fim);
	const slots = [];

	for (let current = new Date(slotStart.getTime()); current.getTime() + (serviceDurationMinutes * 60000) <= workdayEnd.getTime(); current = new Date(current.getTime() + 30 * 60000)) {
		const end = new Date(current.getTime() + serviceDurationMinutes * 60000);

		const booked = appointments.some((appointment) => {
			const appointmentStart = new Date(appointment.data_hora_inicio);
			const appointmentEnd = new Date(appointment.data_hora_fim);
			return overlapsTimeRange(current, end, appointmentStart, appointmentEnd);
		});

		const blocked = blocks.some((block) => {
			const blockStart = combineDateAndTime(date, block.hora_inicio);
			const blockEnd = combineDateAndTime(date, block.hora_fim);
			return overlapsTimeRange(current, end, blockStart, blockEnd);
		});

		if (!booked && !blocked) {
			slots.push(current.toTimeString().slice(0, 5));
		}
	}

	return slots;
}

async function getPublicProfessionalsByService(serviceId) {
	const service = await repository.findServiceById(serviceId);
	if (!service) {
		throw createError('Serviço não encontrado', 404);
	}

	const professionals = await repository.listActiveProfessionalsByService(serviceId);
	return {
		servico: normalizeService(service),
		profissionais: professionals.map((professional) => ({
			id: professional.id,
			nome: professional.nome || '',
		})),
	};
}

async function getPublicProfessionalAvailability(professionalId, dateValue) {
	const professional = await getProfessionalOrThrow(professionalId);
	if (!professional.ativo) {
		throw createError('Profissional não encontrado', 404);
	}

	const date = parseDateOnly(dateValue, 'Formato de data inválido. Use YYYY-MM-DD');
	const scales = await repository.listScalesByProfessional(professionalId);
	const scale = chooseScaleForDate(scales, date);

	if (!scale) {
		return {
			profissional_id: String(professionalId),
			profissional_nome: professional.nome,
			data: String(dateValue),
			horarios: [],
		};
	}

	const blocks = await repository.listBlocksByProfessionalAndDate(professionalId, String(dateValue));
	const dayStart = new Date(`${dateValue}T00:00:00`);
	const dayEnd = new Date(`${dateValue}T23:59:59.999`);
	const appointments = await repository.listOverlappingAppointments(professionalId, dayStart.toISOString(), dayEnd.toISOString());

	const slotStart = combineDateAndTime(date, scale.hora_inicio);
	const workdayEnd = combineDateAndTime(date, scale.hora_fim);
	const horarios = [];

	for (let current = new Date(slotStart.getTime()); current < workdayEnd; current = new Date(current.getTime() + 30 * 60000)) {
		const nextSlot = new Date(current.getTime() + 30 * 60000);
		const blocked = blocks.some((block) => {
			const blockStart = combineDateAndTime(date, block.hora_inicio);
			const blockEnd = combineDateAndTime(date, block.hora_fim);
			return overlapsTimeRange(current, nextSlot, blockStart, blockEnd);
		});

		const booked = appointments.some((appointment) => {
			const appointmentRange = getAppointmentEndDate(appointment);
			return overlapsTimeRange(current, nextSlot, appointmentRange.start, appointmentRange.end);
		});

		horarios.push({
			hora: current.toTimeString().slice(0, 5),
			disponivel: !blocked && !booked,
		});
	}

	return {
		profissional_id: String(professionalId),
		profissional_nome: professional.nome,
		data: String(dateValue),
		horarios,
	};
}

module.exports = {
	listProfessionalsByCompany,
	createProfessional,
	listScalesByProfessional,
	createScale,
	listBlocksByProfessional,
	createBlock,
	getAvailability,
	getPublicProfessionalsByService,
	getPublicProfessionalAvailability,
};