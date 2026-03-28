const agendamentosService = require('../backend/domains/agendamentos/service');
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

async function updateStatus(token, agendamentoId, newStatus) {
	const viewer = decodeToken(token);
	return agendamentosService.updateAppointmentStatus(viewer, agendamentoId, newStatus);
}

module.exports = {
	listByDate,
	updateStatus,
};
