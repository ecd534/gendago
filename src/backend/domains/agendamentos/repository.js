const { randomUUID } = require('crypto');
const { query } = require('../../db/pool');

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

async function findClientById(clientId) {
	const sql = `
		SELECT id, telefone, nome, email, empresa_id, cpf, data_nascimento, genero, endereco, cidade, estado, cep, ativo, ultimo_login, criado_em, atualizado_em
		FROM clientes
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [clientId]);
	return result.rows[0] || null;
}

async function findClientByPhoneAndCompany(phone, companyId) {
	const sql = `
		SELECT id, telefone, nome, email, empresa_id, cpf, data_nascimento, genero, endereco, cidade, estado, cep, ativo, ultimo_login, criado_em, atualizado_em
		FROM clientes
		WHERE telefone = $1 AND empresa_id = $2
		LIMIT 1
	`;
	const result = await query(sql, [phone, companyId]);
	return result.rows[0] || null;
}

async function createClient({ nome, telefone, empresaId, email = null, senha = null, cpf = null }) {
	const sql = `
		INSERT INTO clientes (id, nome, telefone, email, empresa_id, senha, cpf, ativo, criado_em, atualizado_em)
		VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
		RETURNING id, telefone, nome, email, empresa_id, cpf, data_nascimento, genero, endereco, cidade, estado, cep, ativo, ultimo_login, criado_em, atualizado_em
	`;
	const result = await query(sql, [randomUUID(), nome, telefone, email, empresaId, senha, cpf]);
	return result.rows[0] || null;
}

async function updateClientLastContact(clientId) {
	const sql = `
		UPDATE clientes
		SET atualizado_em = NOW()
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
			a.data_hora,
			a.duracao_minutos,
			a.status,
			a.criado_em,
			c.nome AS nome
		FROM agendamentos a
		INNER JOIN clientes c ON c.id = a.cliente_id
		WHERE a.empresa_id = $1
		  AND a.data_hora >= $2::timestamptz
		  AND a.data_hora <= $3::timestamptz
		ORDER BY a.data_hora ASC
	`;
	const result = await query(sql, [companyId, startDateTime, endDateTime]);
	return result.rows;
}

async function listDetailedAppointmentsByDate(companyId, startDateTime, endDateTime) {
	const sql = `
		SELECT
			a.id,
			a.data_hora AS inicio,
			(a.data_hora + make_interval(mins => a.duracao_minutos)) AS fim,
			c.nome AS cliente,
			c.telefone,
			s.nome AS servico,
			p.nome AS profissional,
			COALESCE(NULLIF(a.preco, 0), s.preco, 0) AS valor,
			a.status
		FROM agendamentos a
		INNER JOIN clientes c ON c.id = a.cliente_id
		INNER JOIN servicos s ON s.id = a.servico_id
		INNER JOIN profissionais p ON p.id = a.profissional_id
		WHERE a.empresa_id = $1
		  AND a.data_hora >= $2::timestamptz
		  AND a.data_hora <= $3::timestamptz
		ORDER BY a.data_hora ASC
	`;
	const result = await query(sql, [companyId, startDateTime, endDateTime]);
	return result.rows;
}

async function listDetailedAppointmentsByCompany(companyId) {
	const sql = `
		SELECT
			a.id,
			a.data_hora AS inicio,
			(a.data_hora + make_interval(mins => a.duracao_minutos)) AS fim,
			c.nome AS cliente,
			c.telefone,
			s.nome AS servico,
			p.nome AS profissional,
			COALESCE(NULLIF(a.preco, 0), s.preco, 0) AS valor,
			a.status
		FROM agendamentos a
		INNER JOIN clientes c ON c.id = a.cliente_id
		INNER JOIN servicos s ON s.id = a.servico_id
		INNER JOIN profissionais p ON p.id = a.profissional_id
		WHERE a.empresa_id = $1
		ORDER BY a.data_hora ASC
	`;
	const result = await query(sql, [companyId]);
	return result.rows;
}

async function listPublicAppointmentsByClient(companyId, clientId, limit = 5) {
	const sql = `
		SELECT
			a.id,
			a.status,
			a.data_hora,
			(a.data_hora + make_interval(mins => a.duracao_minutos)) AS data_hora_fim,
			s.nome AS servico,
			COALESCE(NULLIF(a.preco, 0), s.preco, 0) AS valor,
			p.nome AS profissional
		FROM agendamentos a
		INNER JOIN servicos s ON s.id = a.servico_id
		INNER JOIN profissionais p ON p.id = a.profissional_id
		WHERE a.empresa_id = $1
		  AND a.cliente_id = $2
		ORDER BY a.data_hora DESC
		LIMIT $3
	`;
	const result = await query(sql, [companyId, clientId, limit]);
	return result.rows;
}

async function listOverlappingAppointments(professionalId, startDateTime, endDateTime) {
	const sql = `
		SELECT id, profissional_id, data_hora, duracao_minutos, status
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

async function createAppointment({ companyId, professionalId, clientId, serviceId, startDateTime, duracaoMinutos = 60, preco = null, criadoPor = null }) {
	const sql = `
		INSERT INTO agendamentos (
			id,
			empresa_id,
			profissional_id,
			cliente_id,
			servico_id,
			data_hora,
			duracao_minutos,
			preco,
			status,
			criado_em,
			criado_por
		)
		VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8, 'agendado', NOW(), $9)
		RETURNING id, empresa_id, profissional_id, cliente_id, servico_id, data_hora, duracao_minutos, preco, status, criado_em
	`;
	const result = await query(sql, [
		randomUUID(),
		companyId,
		professionalId,
		clientId,
		serviceId,
		startDateTime,
		duracaoMinutos,
		preco,
		criadoPor,
	]);
	return result.rows[0] || null;
}

async function findAppointmentById(appointmentId) {
	const sql = `
		SELECT id, empresa_id, profissional_id, cliente_id, servico_id, data_hora, duracao_minutos, preco, status, motivo_cancelamento, notas, criado_em, atualizado_em, criado_por
		FROM agendamentos
		WHERE id = $1
		LIMIT 1
	`;
	const result = await query(sql, [appointmentId]);
	return result.rows[0] || null;
}

async function updateAppointmentStatus(appointmentId, status) {
	const sql = `
		UPDATE agendamentos
		SET status = $1, atualizado_em = NOW()
		WHERE id = $2
		RETURNING id, empresa_id, profissional_id, cliente_id, servico_id, data_hora, duracao_minutos, preco, status, motivo_cancelamento, notas, criado_em, atualizado_em, criado_por
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
