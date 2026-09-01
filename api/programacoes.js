const {
  ensureProgramacaoTables,
  getDb,
  rowToComunidade,
  rowToProgramacao
} = require("./_lib/db");
const { sendJson, setAllowedMethods } = require("./_lib/http");

module.exports = async function handler(req, res) {
  setAllowedMethods(res, ["GET"]);
  if (req.method !== "GET") return sendJson(res, 405, { error: "Metodo nao permitido." });

  try {
    await ensureProgramacaoTables();
    const db = getDb();
    const [comunidadesResult, programacoesResult] = await Promise.all([
      db.execute(`SELECT id, slug, nome, endereco, ordem, ativo FROM comunidades
        WHERE ativo = 1 ORDER BY ordem, nome`),
      db.execute(`SELECT p.id, p.comunidade_id, p.atividade, p.recorrencia, p.dia_semana,
          p.semana_mes, p.data_especifica, p.recorrencia_texto, p.horario, p.observacao,
          p.ordem, p.ativo
        FROM programacoes p
        INNER JOIN comunidades c ON c.id = p.comunidade_id
        WHERE p.ativo = 1 AND c.ativo = 1
        ORDER BY c.ordem, p.ordem, p.horario, p.id`)
    ]);

    return sendJson(res, 200, {
      comunidades: comunidadesResult.rows.map(rowToComunidade),
      programacoes: programacoesResult.rows.map(rowToProgramacao)
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Erro ao carregar programacao." });
  }
};
