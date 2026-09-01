const { isAdminRequest } = require("../_lib/auth");
const {
  ensureProgramacaoTables,
  getDb,
  rowToComunidade,
  rowToProgramacao
} = require("../_lib/db");
const { readJsonBody, sendJson, setAllowedMethods } = require("../_lib/http");

const RECORRENCIAS = new Set(["semanal", "mensal", "data_especifica", "personalizada"]);

function text(value, max, label, required = true) {
  const normalized = String(value || "").trim();
  if (required && !normalized) throw new Error(`Informe ${label}.`);
  if (normalized.length > max) throw new Error(`${label} deve ter ate ${max} caracteres.`);
  return normalized || null;
}

function integer(value, label, min = 0, max = 9999) {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < min || normalized > max) {
    throw new Error(`${label} invalido.`);
  }
  return normalized;
}

function normalizeComunidade(body) {
  return {
    nome: text(body.nome, 120, "o nome da comunidade"),
    endereco: text(body.endereco, 300, "o endereco"),
    ordem: integer(body.ordem ?? 0, "Ordem"),
    ativo: body.ativo === undefined ? 1 : body.ativo ? 1 : 0
  };
}

function normalizeProgramacao(body) {
  const recorrencia = String(body.recorrencia || "");
  if (!RECORRENCIAS.has(recorrencia)) throw new Error("Recorrencia invalida.");
  const comunidadeId = integer(body.comunidade_id, "Comunidade", 1);
  const horario = String(body.horario || "").trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) throw new Error("Informe um horario valido.");

  let diaSemana = null;
  let semanaMes = null;
  let dataEspecifica = null;
  let recorrenciaTexto = null;

  if (recorrencia === "semanal" || recorrencia === "mensal") {
    diaSemana = integer(body.dia_semana, "Dia da semana", 0, 6);
  }
  if (recorrencia === "mensal") semanaMes = integer(body.semana_mes, "Semana do mes", 1, 5);
  if (recorrencia === "data_especifica") {
    dataEspecifica = String(body.data_especifica || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataEspecifica)) throw new Error("Informe uma data valida.");
  }
  if (recorrencia === "personalizada") {
    recorrenciaTexto = text(body.recorrencia_texto, 120, "a recorrencia");
  }

  return {
    comunidadeId,
    atividade: text(body.atividade, 100, "a atividade"),
    recorrencia,
    diaSemana,
    semanaMes,
    dataEspecifica,
    recorrenciaTexto,
    horario,
    observacao: text(body.observacao, 300, "a observacao", false),
    ordem: integer(body.ordem ?? 0, "Ordem"),
    ativo: body.ativo === undefined ? 1 : body.ativo ? 1 : 0
  };
}

async function loadAll(db) {
  const [comunidades, programacoes] = await Promise.all([
    db.execute("SELECT id, slug, nome, endereco, ordem, ativo FROM comunidades ORDER BY ordem, nome"),
    db.execute(`SELECT id, comunidade_id, atividade, recorrencia, dia_semana, semana_mes,
      data_especifica, recorrencia_texto, horario, observacao, ordem, ativo
      FROM programacoes ORDER BY comunidade_id, ordem, horario, id`)
  ]);
  return {
    comunidades: comunidades.rows.map(rowToComunidade),
    programacoes: programacoes.rows.map(rowToProgramacao)
  };
}

module.exports = async function handler(req, res) {
  setAllowedMethods(res, ["GET", "POST", "PUT", "DELETE"]);
  if (!isAdminRequest(req)) return sendJson(res, 401, { error: "Sessao invalida ou expirada." });

  try {
    await ensureProgramacaoTables();
    const db = getDb();
    if (req.method === "GET") return sendJson(res, 200, await loadAll(db));

    const body = await readJsonBody(req);
    const resource = body.resource;
    if (!new Set(["comunidade", "programacao"]).has(resource)) {
      return sendJson(res, 400, { error: "Tipo de registro invalido." });
    }

    if (req.method === "POST" && resource === "comunidade") {
      const item = normalizeComunidade(body);
      const result = await db.execute({
        sql: `INSERT INTO comunidades (slug, nome, endereco, ordem, ativo)
          VALUES ('comunidade-' || lower(hex(randomblob(8))), ?, ?, ?, ?)
          RETURNING id, slug, nome, endereco, ordem, ativo`,
        args: [item.nome, item.endereco, item.ordem, item.ativo]
      });
      return sendJson(res, 201, { comunidade: rowToComunidade(result.rows[0]) });
    }

    if (req.method === "POST") {
      const item = normalizeProgramacao(body);
      const result = await db.execute({
        sql: `INSERT INTO programacoes
          (comunidade_id, atividade, recorrencia, dia_semana, semana_mes, data_especifica,
           recorrencia_texto, horario, observacao, ordem, ativo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id, comunidade_id, atividade, recorrencia, dia_semana, semana_mes,
            data_especifica, recorrencia_texto, horario, observacao, ordem, ativo`,
        args: [item.comunidadeId, item.atividade, item.recorrencia, item.diaSemana, item.semanaMes,
          item.dataEspecifica, item.recorrenciaTexto, item.horario, item.observacao, item.ordem, item.ativo]
      });
      return sendJson(res, 201, { programacao: rowToProgramacao(result.rows[0]) });
    }

    const id = integer(body.id, "Registro", 1);
    if (req.method === "PUT" && resource === "comunidade") {
      const item = normalizeComunidade(body);
      const result = await db.execute({
        sql: `UPDATE comunidades SET nome = ?, endereco = ?, ordem = ?, ativo = ?,
          atualizado_em = CURRENT_TIMESTAMP WHERE id = ?
          RETURNING id, slug, nome, endereco, ordem, ativo`,
        args: [item.nome, item.endereco, item.ordem, item.ativo, id]
      });
      if (!result.rows.length) return sendJson(res, 404, { error: "Comunidade nao encontrada." });
      return sendJson(res, 200, { comunidade: rowToComunidade(result.rows[0]) });
    }

    if (req.method === "PUT") {
      const item = normalizeProgramacao(body);
      const result = await db.execute({
        sql: `UPDATE programacoes SET comunidade_id = ?, atividade = ?, recorrencia = ?,
          dia_semana = ?, semana_mes = ?, data_especifica = ?, recorrencia_texto = ?,
          horario = ?, observacao = ?, ordem = ?, ativo = ?, atualizado_em = CURRENT_TIMESTAMP
          WHERE id = ? RETURNING id, comunidade_id, atividade, recorrencia, dia_semana,
          semana_mes, data_especifica, recorrencia_texto, horario, observacao, ordem, ativo`,
        args: [item.comunidadeId, item.atividade, item.recorrencia, item.diaSemana, item.semanaMes,
          item.dataEspecifica, item.recorrenciaTexto, item.horario, item.observacao,
          item.ordem, item.ativo, id]
      });
      if (!result.rows.length) return sendJson(res, 404, { error: "Atividade nao encontrada." });
      return sendJson(res, 200, { programacao: rowToProgramacao(result.rows[0]) });
    }

    if (req.method === "DELETE" && resource === "comunidade") {
      const linked = await db.execute({ sql: "SELECT COUNT(*) AS total FROM programacoes WHERE comunidade_id = ?", args: [id] });
      if (Number(linked.rows[0].total) > 0) {
        return sendJson(res, 409, { error: "Exclua primeiro as atividades desta comunidade." });
      }
      await db.execute({ sql: "DELETE FROM comunidades WHERE id = ?", args: [id] });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      await db.execute({ sql: "DELETE FROM programacoes WHERE id = ?", args: [id] });
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 405, { error: "Metodo nao permitido." });
  } catch (error) {
    const status = /FOREIGN KEY/.test(error.message) ? 400 : 500;
    return sendJson(res, status, { error: error.message || "Erro ao gerenciar programacao." });
  }
};
