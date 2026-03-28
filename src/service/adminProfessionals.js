const axios = require('axios');

const venusApiBaseUrl = process.env.VENUS_API_URL || 'http://127.0.0.1:8000';

function createClient(token) {
	return axios.create({
		baseURL: venusApiBaseUrl,
		timeout: 10000,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
	});
}

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

	const client = createClient(token);
	const response = await client.get(`/profissionais/${companyId}`);
	return Array.isArray(response.data) ? response.data.map(normalizeProfessional) : [];
}

async function createProfessional(token, form) {
	const client = createClient(token);
	const payload = {
		nome: String(form.nome || '').trim(),
		ativo: typeof form.ativo === 'boolean' ? form.ativo : true,
		empresa_id: String(form.empresa_id || '').trim(),
	};

	try {
		const response = await client.post('/profissionais/', payload);
		return normalizeProfessional(response.data || payload);
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

async function listScalesByProfessional(token, professionalId) {
	if (!professionalId) {
		return [];
	}

	const client = createClient(token);
	const response = await client.get(`/escalas/${professionalId}`);
	return Array.isArray(response.data) ? response.data.map(normalizeScale) : [];
}

async function createScale(token, form) {
	const client = createClient(token);
	const payload = {
		profissional_id: String(form.profissional_id || '').trim(),
		dia_semana: Number(form.dia_semana),
		hora_inicio: String(form.hora_inicio || '').trim(),
		hora_fim: String(form.hora_fim || '').trim(),
	};

	try {
		const response = await client.post('/escalas/', payload);
		return normalizeScale(response.data || payload);
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
		throw customError;
	}
}

async function listBlocksByProfessional(token, professionalId) {
	if (!professionalId) {
		return [];
	}

	const client = createClient(token);
	const response = await client.get(`/bloqueios/${professionalId}`);
	return Array.isArray(response.data) ? response.data.map(normalizeBlock) : [];
}

async function createBlock(token, form) {
	const client = createClient(token);
	const payload = {
		profissional_id: String(form.profissional_id || '').trim(),
		data: String(form.data || '').trim(),
		hora_inicio: String(form.hora_inicio || '').trim(),
		hora_fim: String(form.hora_fim || '').trim(),
		motivo: String(form.motivo || '').trim() || 'Bloqueio manual',
	};

	try {
		const response = await client.post('/bloqueios/', payload);
		return normalizeBlock(response.data || payload);
	} catch (error) {
		const customError = new Error(extractApiError(error));
		customError.statusCode = error.response?.status || 500;
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
};