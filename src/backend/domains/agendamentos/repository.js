const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

async function findServiceById(serviceId) {
	const sql = `
		SELECT id, nome, preco, duracao_minutos, empresa_id, categoria_id, ativo
		FROM venus.servicos
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [serviceId]);
	return result.rows[0] || null;
}

async function findProfessionalById(professionalId) {
	const sql = `
		SELECT id, nome, ativo, empresa_id
		FROM venus.profissionais
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [professionalId]);
	return result.rows[0] || null;
}

async function findClientById(clientId) {
	const sql = `
		SELECT id, telefone, nome, ultimo_contato, status, datacadastro, idade, email, empresa_id
		FROM venus.clientes
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [clientId]);
	return result.rows[0] || null;
}

async function findClientByPhoneAndCompany(phone, companyId) {
	const sql = `
		SELECT id, telefone, nome, ultimo_contato, status, datacadastro, idade, email, empresa_id
		FROM venus.clientes
		WHERE telefone = $1 AND empresa_id = $2
		LIMIT 1
	`;
	const result = await query(sql, [phone, companyId]);
	return result.rows[0] || null;
}

async function createClient({ nome, telefone, empresaId }) {
	const sql = `
		INSERT INTO venus.clientes (id, nome, telefone, ultimo_contato, status, datacadastro, empresa_id)
		VALUES ($1, $2, $3, NOW(), 'Ativo', CURRENT_DATE, $4)
		RETURNING id, telefone, nome, ultimo_contato, status, datacadastro, idade, email, empresa_id
	`;
	const result = await query(sql, [randomUUID(), nome, telefone, empresaId]);
	return result.rows[0] || null;
}

async function updateClientLastContact(clientId) {
	const sql = `
		UPDATE venus.clientes
		SET ultimo_contato = NOW()
		WHERE id = $1
	`;
	await query(sql, [clientId]);
}

async function listAppointmentsByDate(companyId, startDateTime, endDateTime) {
	const sql = `
		SELECT
			a.id,
			a.empresa_id,
			a.profissional_id,
			a.cliente_id,
			a.servico_id,
			a.data_hora_inicio,
			a.data_hora_fim,
			a.status,
			a.created_at,
			c.nome AS nome
		FROM venus.agendamentos a
		INNER JOIN venus.clientes c ON c.id = a.cliente_id
		WHERE a.empresa_id = $1
		  AND a.data_hora_inicio >= $2::timestamptz
		  AND a.data_hora_inicio <= $3::timestamptz
		ORDER BY a.data_hora_inicio ASC
	`;
	const result = await query(sql, [companyId, startDateTime, endDateTime]);
	return result.rows;
}

async function listDetailedAppointmentsByDate(companyId, startDateTime, endDateTime) {
	const sql = `
		SELECT
			a.id,
			a.data_hora_inicio AS inicio,
			a.data_hora_fim AS fim,
			c.nome AS cliente,
			c.telefone,
			s.nome AS servico,
			p.nome AS profissional,
			s.preco AS valor,
			a.status
		FROM venus.agendamentos a
		INNER JOIN venus.clientes c ON c.id = a.cliente_id
		INNER JOIN venus.servicos s ON s.id = a.servico_id
		INNER JOIN venus.profissionais p ON p.id = a.profissional_id
		WHERE a.empresa_id = $1
		  AND a.data_hora_inicio >= $2::timestamptz
		  AND a.data_hora_inicio <= $3::timestamptz
		ORDER BY a.data_hora_inicio ASC
	`;
	const result = await query(sql, [companyId, startDateTime, endDateTime]);
	return result.rows;
}

async function listDetailedAppointmentsByCompany(companyId) {
	const sql = `
		SELECT
			a.id,
			a.data_hora_inicio AS inicio,
			a.data_hora_fim AS fim,
			c.nome AS cliente,
			c.telefone,
			s.nome AS servico,
			p.nome AS profissional,
			s.preco AS valor,
			a.status
		FROM venus.agendamentos a
		INNER JOIN venus.clientes c ON c.id = a.cliente_id
		INNER JOIN venus.servicos s ON s.id = a.servico_id
		INNER JOIN venus.profissionais p ON p.id = a.profissional_id
		WHERE a.empresa_id = $1
		ORDER BY a.data_hora_inicio ASC
	`;
	const result = await query(sql, [companyId]);
	return result.rows;
}

async function listPublicAppointmentsByClient(companyId, clientId, limit = 5) {
	const sql = `
		SELECT
			a.id,
			a.status,
			a.data_hora_inicio,
			a.data_hora_fim,
			s.nome AS servico,
			s.preco AS valor,
			p.nome AS profissional
		FROM venus.agendamentos a
		INNER JOIN venus.servicos s ON s.id = a.servico_id
		INNER JOIN venus.profissionais p ON p.id = a.profissional_id
		WHERE a.empresa_id = $1
		  AND a.cliente_id = $2
		ORDER BY a.data_hora_inicio DESC
		LIMIT $3
	`;
	const result = await query(sql, [companyId, clientId, limit]);
	return result.rows;
}

async function listOverlappingAppointments(professionalId, startDateTime, endDateTime) {
	const sql = `
		SELECT id, profissional_id, data_hora_inicio, data_hora_fim, status
		FROM venus.agendamentos
		WHERE profissional_id = $1
		  AND status = ANY($2)
		  AND data_hora_inicio < $3::timestamptz
		  AND data_hora_fim > $4::timestamptz
		ORDER BY data_hora_inicio ASC
	`;
	const result = await query(sql, [professionalId, ['agendado', 'confirmado'], endDateTime, startDateTime]);
	return result.rows;
}

async function createAppointment({ companyId, professionalId, clientId, serviceId, startDateTime, endDateTime }) {
	const sql = `
		INSERT INTO venus.agendamentos (
			id,
			empresa_id,
			profissional_id,
			cliente_id,
			servico_id,
			data_hora_inicio,
			data_hora_fim,
			status,
			created_at
		)
		VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz, 'agendado', NOW())
		RETURNING id, empresa_id, profissional_id, cliente_id, servico_id, data_hora_inicio, data_hora_fim, status, created_at
	`;
	const result = await query(sql, [
		randomUUID(),
		companyId,
		professionalId,
		clientId,
		serviceId,
		startDateTime,
		endDateTime,
	]);
	return result.rows[0] || null;
}

async function findAppointmentById(appointmentId) {
	const sql = `
		SELECT id, empresa_id, profissional_id, cliente_id, servico_id, data_hora_inicio, data_hora_fim, status, created_at
		FROM venus.agendamentos
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [appointmentId]);
	return result.rows[0] || null;
}

async function updateAppointmentStatus(appointmentId, status) {
	const sql = `
		UPDATE venus.agendamentos
		SET status = $1
		WHERE id = $2
		RETURNING id, empresa_id, profissional_id, cliente_id, servico_id, data_hora_inicio, data_hora_fim, status, created_at
	`;
	const result = await query(sql, [status, appointmentId]);
	return result.rows[0] || null;
}

module.exports = {
	findServiceById,
	findProfessionalById,
	findClientById,
	findClientByPhoneAndCompany,
	createClient,
	updateClientLastContact,
	listAppointmentsByDate,
	listDetailedAppointmentsByDate,
	listDetailedAppointmentsByCompany,
	listPublicAppointmentsByClient,
	listOverlappingAppointments,
	createAppointment,
	findAppointmentById,
	updateAppointmentStatus,
};