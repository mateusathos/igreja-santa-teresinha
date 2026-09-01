const { ensureAvisosTable, getDb, rowToAviso } = require("./_lib/db");
const { sendJson, setAllowedMethods } = require("./_lib/http");

module.exports = async function handler(req, res) {
  setAllowedMethods(res, ["GET"]);

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Metodo nao permitido." });
  }

  try {
    await ensureAvisosTable();

    const result = await getDb().execute(`
      SELECT id, titulo, descricao, imagem_url, imagem_pathname, ativo, criado_em, atualizado_em
      FROM avisos
      WHERE ativo = 1
      ORDER BY datetime(criado_em) DESC, id DESC
    `);

    const avisos = result.rows.map(rowToAviso).map(({ imagem_pathname, ...aviso }) => aviso);
    const ultimaAtualizacao = avisos.reduce((maisRecente, aviso) => {
      const data = aviso.atualizado_em || aviso.criado_em;
      return !maisRecente || data > maisRecente ? data : maisRecente;
    }, null);

    return sendJson(res, 200, { avisos, ultimaAtualizacao });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Erro ao carregar avisos." });
  }
};
