const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

async function listProfessionalsByCompany(companyId, onlyActive = false) {
	const params = [companyId];
	let sql = `
		SELECT id, nome, ativo, empresa_id
		FROM profissionais
		WHERE empresa_id = $1
	`;

	if (onlyActive) {
		params.push(true);
		sql += ' AND ativo = $2';
	}

	sql += ' ORDER BY nome ASC';
	const result = await query(sql, params);
	return result.rows;
}

async function findProfessionalById(professionalId) {
	const sql = `
		SELECT id, nome, ativo, empresa_id
		FROM profissionais
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [professionalId]);
	return result.rows[0] || null;
}

async function createProfessional({ nome, ativo, empresaId }) {
	const sql = `
		INSERT INTO profissionais (id, nome, ativo, empresa_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id, nome, ativo, empresa_id
	`;
	const result = await query(sql, [randomUUID(), nome, ativo, empresaId]);
	return result.rows[0] || null;
}

async function listScalesByProfessional(professionalId) {
	const sql = `
		SELECT id, profissional_id, dia_semana, hora_inicio, hora_fim
		FROM escalas
		WHERE profissional_id = $1
		ORDER BY dia_semana ASC, hora_inicio ASC
	`;
	const result = await query(sql, [professionalId]);
	return result.rows;
}

async function findScaleByProfessionalAndDay(professionalId, dayOfWeek) {
	const sql = `
		SELECT id, profissional_id, dia_semana, hora_inicio, hora_fim
		FROM escalas
		WHERE profissional_id = $1 AND dia_semana = $2
		LIMIT 1
	`;
	const result = await query(sql, [professionalId, dayOfWeek]);
	return result.rows[0] || null;
}

async function deleteScale(scaleId) {
	await query('DELETE FROM escalas WHERE id = $1', [scaleId]);
}

async function createScale({ professionalId, dayOfWeek, startTime, endTime }) {
	const sql = `
		INSERT INTO escalas (id, profissional_id, dia_semana, hora_inicio, hora_fim)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, profissional_id, dia_semana, hora_inicio, hora_fim
	`;
	const result = await query(sql, [randomUUID(), professionalId, dayOfWeek, startTime, endTime]);
	return result.rows[0] || null;
}

async function listBlocksByProfessional(professionalId) {
	const sql = `
		SELECT id, profissional_id, data, hora_inicio, hora_fim, motivo
		FROM bloqueios
		WHERE profissional_id = $1
		ORDER BY data ASC, hora_inicio ASC
	`;
	const result = await query(sql, [professionalId]);
	return result.rows;
}

async function listBlocksByProfessionalAndDate(professionalId, date) {
	const sql = `
		SELECT id, profissional_id, data, hora_inicio, hora_fim, motivo
		FROM bloqueios
		WHERE profissional_id = $1 AND data = $2
		ORDER BY hora_inicio ASC
	`;
	const result = await query(sql, [professionalId, date]);
	return result.rows;
}

async function createBlock({ professionalId, date, startTime, endTime, reason }) {
	const sql = `
		INSERT INTO bloqueios (id, profissional_id, data, hora_inicio, hora_fim, motivo)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, profissional_id, data, hora_inicio, hora_fim, motivo
	`;
	const result = await query(sql, [randomUUID(), professionalId, date, startTime, endTime, reason]);
	return result.rows[0] || null;
}

async function findServiceById(serviceId) {
	const sql = `
		SELECT id, nome, preco, duracao_minutos, empresa_id, categoria_id, ativo
		FROM servicos
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [serviceId]);
	return result.rows[0] || null;
}

async function listActiveProfessionalsByService(serviceId) {
	const sql = `
		SELECT p.id, p.nome, p.ativo, p.empresa_id
		FROM profissionais p
		INNER JOIN profissional_servico ps ON ps.profissional_id = p.id
		WHERE ps.servico_id = $1 AND p.ativo = true
		ORDER BY p.nome ASC
	`;
	const result = await query(sql, [serviceId]);
	return result.rows;
}

async function listProfessionalsByService(serviceId) {
	const sql = `
		SELECT p.id, p.nome, p.ativo, p.empresa_id
		FROM profissionais p
		INNER JOIN profissional_servico ps ON ps.profissional_id = p.id
		WHERE ps.servico_id = $1
		ORDER BY p.nome ASC
	`;
	const result = await query(sql, [serviceId]);
	return result.rows;
}

async function addProfessionalToService({ professionalId, serviceId }) {
	const sql = `
		INSERT INTO profissional_servico (profissional_id, servico_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`;
	await query(sql, [professionalId, serviceId]);
}

async function removeProfessionalFromService({ professionalId, serviceId }) {
	await query(
		'DELETE FROM profissional_servico WHERE profissional_id = $1 AND servico_id = $2',
		[professionalId, serviceId],
	);
}

async function listOverlappingAppointments(professionalId, startDateTime, endDateTime) {
	const sql = `
		SELECT id, profissional_id, servico_id, data_hora, duracao_minutos, status
		FROM agendamentos
		WHERE profissional_id = $1
		  AND lower(trim(coalesce(status, ''))) = ANY($2)
		  AND data_hora < $3::timestamptz
		  AND (data_hora + make_interval(mins => coalesce(duracao_minutos, 60))) > $4::timestamptz
		ORDER BY data_hora ASC
	`;
	const result = await query(sql, [professionalId, ['agendado', 'confirmado'], endDateTime, startDateTime]);
	return result.rows;
}

module.exports = {
	listProfessionalsByCompany,
	findProfessionalById,
	createProfessional,
	listScalesByProfessional,
	findScaleByProfessionalAndDay,
	deleteScale,
	createScale,
	listBlocksByProfessional,
	listBlocksByProfessionalAndDate,
	createBlock,
	findServiceById,
	listActiveProfessionalsByService,
	listProfessionalsByService,
	addProfessionalToService,
	removeProfessionalFromService,
	listOverlappingAppointments,
};
