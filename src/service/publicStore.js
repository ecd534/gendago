const { query } = require('../backend/db/pool');
const localProfessionalsService = require('../backend/domains/profissionais/service');
const localAppointmentsService = require('../backend/domains/agendamentos/service');

function normalizeText(value) {
	return String(value || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function slugify(value) {
	return normalizeText(value)
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

function pickArray(payload) {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (payload && typeof payload === 'object') {
		if (Array.isArray(payload.items)) return payload.items;
		if (Array.isArray(payload.empresas)) return payload.empresas;
		if (Array.isArray(payload.data)) return payload.data;
		if (Array.isArray(payload.result)) return payload.result;
	}

	return [];
}

function normalizeCompany(company = {}) {
	const nome = String(company.nome || company.nome_fantasia || '').trim();
	const slug = String(company.slug || '').trim() || slugify(nome);

	return {
		id: String(company.id || company.empresa_id || '').trim(),
		nome,
		slug,
		telefone: String(company.telefone || '').trim(),
		email: String(company.email || '').trim(),
		endereco: String(company.endereco || company.endereco_completo || '').trim(),
		status: String(company.status || 'Ativa').trim(),
	};
}

function normalizeService(service = {}) {
	return {
		id: String(service.id || service.servico_id || '').trim(),
		nome: String(service.nome || '').trim(),
		descricao: String(service.descricao || '').trim(),
		preco: Number(service.preco || 0),
		duracaoMinutos: Number(service.duracao_minutos || service.duracao || 0),
		categoriaId: String(service.categoria_id || '').trim(),
		categoriaNome: String(service.categoria_nome || service.categoria || '').trim(),
	};
}

function normalizeProfessional(professional = {}) {
	return {
		id: String(professional.id || professional.profissional_id || '').trim(),
		nome: String(professional.nome || '').trim(),
		ativo: typeof professional.ativo === 'boolean' ? professional.ativo : true,
	};
}

function normalizeSlot(slot) {
	if (typeof slot === 'string') {
		return slot.slice(0, 5);
	}

	if (slot && typeof slot === 'object') {
		const value = slot.horario || slot.hora || slot.slot || slot.inicio || slot.value;
		return String(value || '').slice(0, 5);
	}

	return '';
}

function formatMoney(value) {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(Number(value || 0));
}

function normalizeCategoryGroup(group = {}) {
	const servicesRaw = pickArray(group.servicos || group.services || group.itens || group);
	const services = servicesRaw
		.map(normalizeService)
		.filter((service) => service.id && service.nome);

	return {
		id: String(group.id || group.categoria_id || '').trim(),
		nome: String(group.nome || group.categoria || 'Procedimentos').trim(),
		servicos: services,
	};
}

async function searchCompaniesByName(name) {
	const normalized = String(name || '').trim();
	if (!normalized) {
		return [];
	}

	const result = await query(`
		SELECT id, nome, slug, telefone, email, endereco, status
		FROM venus.empresas
		WHERE status = 'Ativa'
		  AND (nome ILIKE $1 OR slug ILIKE $1)
		ORDER BY nome ASC
		LIMIT 20
	`, [`%${normalized}%`]);

	return result.rows
		.map(normalizeCompany)
		.filter((company) => company.id && company.nome);
}

async function resolveCompanyBySlug(slug) {
	const normalizedSlug = slugify(slug);
	if (!normalizedSlug) {
		return null;
	}

	const exact = await query(`
		SELECT id, nome, slug, telefone, email, endereco, status
		FROM venus.empresas
		WHERE status = 'Ativa' AND slug = $1
		LIMIT 1
	`, [normalizedSlug]);

	if (exact.rows[0]) {
		return normalizeCompany(exact.rows[0]);
	}

	const companies = await searchCompaniesByName(normalizedSlug.replace(/-/g, ' '));
	const exactName = companies.find((company) => slugify(company.nome) === normalizedSlug);
	if (exactName) {
		return exactName;
	}

	return companies[0] || null;
}

async function getPublicVitrine(companyId) {
	const companyResult = await query(`
		SELECT id, nome, slug, telefone, email, endereco, status
		FROM venus.empresas
		WHERE id = $1 AND status = 'Ativa'
		LIMIT 1
	`, [companyId]);

	if (!companyResult.rows[0]) {
		return {
			company: {},
			categories: [],
			services: [],
		};
	}

	const servicesResult = await query(`
		SELECT
			s.id,
			s.nome,
			s.preco,
			s.duracao_minutos,
			s.categoria_id,
			COALESCE(c.nome, 'Procedimentos') AS categoria_nome,
			c.id AS categoria_ref
		FROM venus.servicos s
		LEFT JOIN venus.categorias c ON c.id = s.categoria_id
		WHERE s.empresa_id = $1
		  AND s.ativo = true
		ORDER BY c.nome ASC NULLS LAST, s.nome ASC
	`, [companyId]);

	const services = servicesResult.rows
		.map((row) => ({
			...normalizeService(row),
			precoFormatado: formatMoney(row.preco),
		}))
		.filter((service) => service.id && service.nome);

	const categoriesMap = new Map();
	for (const service of services) {
		const key = service.categoriaId || 'sem-categoria';
		if (!categoriesMap.has(key)) {
			categoriesMap.set(key, {
				id: key === 'sem-categoria' ? '' : key,
				nome: service.categoriaNome || 'Procedimentos',
				servicos: [],
			});
		}
		categoriesMap.get(key).servicos.push(service);
	}

	const categories = [...categoriesMap.values()].map(normalizeCategoryGroup);

	return {
		company: normalizeCompany(companyResult.rows[0]),
		categories,
		services,
	};
}

async function getProfessionalsByService(serviceId) {
	const payload = await localProfessionalsService.getPublicProfessionalsByService(serviceId);
	return pickArray(payload.profissionais)
		.map(normalizeProfessional)
		.filter((professional) => professional.id && professional.nome && professional.ativo);
}

async function getProfessionalAvailability(professionalId, date) {
	const payload = await localProfessionalsService.getPublicProfessionalAvailability(professionalId, date);
	const horarios = Array.isArray(payload?.horarios) ? payload.horarios : [];
	const slots = horarios
		.filter((slot) => slot && slot.disponivel !== false)
		.map(normalizeSlot)
		.filter(Boolean);

	return [...new Set(slots)];
}

async function confirmPublicBooking(input = {}) {
	const payload = {
		data_inicio: input.data_inicio,
		servico_id: input.servico_id,
		profissional_id: input.profissional_id,
		empresa_id: input.empresa_id,
		cliente_id: input.cliente_id,
	};

	return localAppointmentsService.createPublicAppointment(payload);
}

async function getPublicClientAppointments(input = {}) {
	const payload = {
		empresa_id: input.empresa_id,
		cliente_id: input.cliente_id,
	};

	return localAppointmentsService.listPublicClientAppointments(payload);
}

module.exports = {
	slugify,
	resolveCompanyBySlug,
	getPublicVitrine,
	getProfessionalsByService,
	getProfessionalAvailability,
	confirmPublicBooking,
	getPublicClientAppointments,
};
