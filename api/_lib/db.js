const { createClient } = require("@libsql/client");

let client;
let setupPromise;

function getDb() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.");
  }

  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  }

  return client;
}

async function ensureAvisosTable() {
  if (!setupPromise) {
    setupPromise = (async () => {
      const db = getDb();

      await db.execute(`
        CREATE TABLE IF NOT EXISTS avisos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titulo TEXT NOT NULL,
          descricao TEXT NOT NULL,
          imagem_url TEXT,
          imagem_pathname TEXT,
          ativo INTEGER NOT NULL DEFAULT 1,
          criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const tableInfo = await db.execute("PRAGMA table_info(avisos)");
      const columns = new Set(tableInfo.rows.map((row) => row.name));

      if (!columns.has("imagem_url")) {
        await db.execute("ALTER TABLE avisos ADD COLUMN imagem_url TEXT");
      }

      if (!columns.has("imagem_pathname")) {
        await db.execute("ALTER TABLE avisos ADD COLUMN imagem_pathname TEXT");
      }
    })();
  }

  return setupPromise;
}

function rowToAviso(row) {
  return {
    id: Number(row.id),
    titulo: row.titulo,
    descricao: row.descricao,
    imagem_url: row.imagem_url || null,
    imagem_pathname: row.imagem_pathname || null,
    ativo: Boolean(row.ativo),
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em
  };
}

module.exports = {
  ensureAvisosTable,
  getDb,
  rowToAviso
};
