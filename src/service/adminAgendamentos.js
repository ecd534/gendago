const agendamentosService = require('../backend/domains/agendamentos/service');
const profissionaisService = require('../backend/domains/profissionais/service');
const { verifyAccessToken } = require('../backend/security/jwt');

function decodeToken(token) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	return viewer;
}

async function listByDate(token, companyId, date) {
	const viewer = decodeToken(token);
	const appointments = await agendamentosService.listAppointmentsByDateDetailed(viewer, {
		empresa_id: companyId,
		data: date,
	});
	return Array.isArray(appointments) ? appointments : [];
}

async function listByDateWithFilters(token, companyId, date, filters = {}) {
	const viewer = decodeToken(token);
	let appointments = await agendamentosService.listAppointmentsByDateDetailed(viewer, {
		empresa_id: companyId,
		data: date,
	});

	if (!Array.isArray(appointments)) {
		appointments = [];
	}

	// Filter by status if provided
	if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
		appointments = appointments.filter((a) => filters.status.includes(a.status));
	}

	// Filter by professional if provided
	if (filters.profissional_id && String(filters.profissional_id).trim()) {
		appointments = appointments.filter((a) => String(a.profissional).includes(filters.profissional_id));
	}

	return appointments;
}

async function getProfessionalsByCompany(token, companyId) {
	const viewer = decodeToken(token);
	return profissionaisService.listProfessionalsByCompany(viewer, companyId);
}

async function updateStatus(token, agendamentoId, newStatus) {
	const viewer = decodeToken(token);
	return agendamentosService.updateAppointmentStatus(viewer, agendamentoId, newStatus);
}

module.exports = {
	listByDate,
	listByDateWithFilters,
	getProfessionalsByCompany,
	updateStatus,
};
