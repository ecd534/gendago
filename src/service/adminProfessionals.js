const localProfessionalsService = require('../backend/domains/profissionais/service');
const { verifyAccessToken } = require('../backend/security/jwt');

function extractApiError(error) {
	if (error.response?.data?.detail) {
		if (Array.isArray(error.response.data.detail)) {
			return error.response.data.detail.map((item) => item.msg).join('. ');
		}

		if (typeof error.response.data.detail === 'string') {
			return error.response.data.detail;
		}
	}

	return 'Nao foi possivel concluir a operacao com a API de profissionais.';
}

function normalizeProfessional(professional) {
	return {
		id: professional.id,
		nome: professional.nome || '',
		ativo: typeof professional.ativo === 'boolean' ? professional.ativo : true,
		empresa_id: professional.empresa_id || '',
	};
}

function normalizeScale(scale) {
	return {
		id: scale.id,
		profissional_id: scale.profissional_id || '',
		dia_semana: Number(scale.dia_semana || 0),
		hora_inicio: scale.hora_inicio || '',
		hora_fim: scale.hora_fim || '',
	};
}

function normalizeBlock(block) {
	return {
		id: block.id,
		profissional_id: block.profissional_id || '',
		data: block.data || '',
		hora_inicio: block.hora_inicio || '',
		hora_fim: block.hora_fim || '',
		motivo: block.motivo || 'Bloqueio manual',
	};
}

async function listProfessionalsByCompany(token, companyId) {
	if (!companyId) {
		return [];
	}

	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	const professionals = await localProfessionalsService.listProfessionalsByCompany(viewer, companyId);
	return Array.isArray(professionals) ? professionals.map(normalizeProfessional) : [];
}

async function createProfessional(token, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		const created = await localProfessionalsService.createProfessional(viewer, form);
		return normalizeProfessional(created || form);
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function listScalesByProfessional(token, professionalId) {
	if (!professionalId) {
		return [];
	}

	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	const scales = await localProfessionalsService.listScalesByProfessional(viewer, professionalId);
	return Array.isArray(scales) ? scales.map(normalizeScale) : [];
}

async function createScale(token, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		return await localProfessionalsService.createScale(viewer, form);
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function listBlocksByProfessional(token, professionalId) {
	if (!professionalId) {
		return [];
	}

	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	const blocks = await localProfessionalsService.listBlocksByProfessional(viewer, professionalId);
	return Array.isArray(blocks) ? blocks.map(normalizeBlock) : [];
}

async function createBlock(token, form) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		return await localProfessionalsService.createBlock(viewer, form);
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function listProfessionalsByService(token, serviceId) {
	if (!serviceId) {
		return [];
	}

	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	const professionals = await localProfessionalsService.listProfessionalsByService(viewer, serviceId);
	return Array.isArray(professionals) ? professionals.map(normalizeProfessional) : [];
}

async function addProfessionalToService(token, serviceId, professionalId) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		return await localProfessionalsService.addProfessionalToService(viewer, serviceId, professionalId);
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

async function removeProfessionalFromService(token, serviceId, professionalId) {
	const viewer = verifyAccessToken(token);
	if (!viewer) {
		const error = new Error('Token invalido ou expirado');
		error.statusCode = 401;
		throw error;
	}

	try {
		return await localProfessionalsService.removeProfessionalFromService(viewer, serviceId, professionalId);
	} catch (error) {
		const customError = new Error(error.message || extractApiError(error));
		customError.statusCode = error.statusCode || 500;
		throw customError;
	}
}

module.exports = {
	listProfessionalsByCompany,
	createProfessional,
	listScalesByProfessional,
	createScale,
	listBlocksByProfessional,
	createBlock,
	listProfessionalsByService,
	addProfessionalToService,
	removeProfessionalFromService,
};