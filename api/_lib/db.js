const { createClient } = require("@libsql/client");

let client;
let setupPromise;
let programacaoSetupPromise;

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

const COMUNIDADES_INICIAIS = [
  ["santa-teresinha", "Santa Teresinha do Menino Jesus", "Rua Alemanha, 219, Baronesa, Santa Luzia - MG", 1],
  ["sao-francisco", "São Francisco Xavier", "Rua China, 328, Baronesa, Santa Luzia - MG", 2],
  ["nossa-senhora-do-rosario", "Nossa Senhora do Rosário", "Rua Líbia, 1229, Morro Santo Antônio, Baronesa, Santa Luzia - MG", 3],
  ["sao-jose", "São José", "Rua Ouro Preto, 86, Luxemburgo, Santa Luzia - MG", 4],
  ["santo-antonio", "Santo Antônio", "Beco Santo Antônio, 13, Morro Santo Antônio, Baronesa, Santa Luzia - MG", 5],
  ["nossa-senhora-de-guadalupe", "Nossa Senhora de Guadalupe", "Av. Raimundo Diniz Lima, 411, Liberdade, Santa Luzia - MG (Residência de Kécia e Éric)", 6]
];

const PROGRAMACOES_INICIAIS = [
  ["santa-teresinha", "Celebração das Famílias", "semanal", 3, null, null, null, "20:00", null, 1],
  ["santa-teresinha", "Missa", "mensal", 5, 1, null, null, "19:00", null, 2],
  ["santa-teresinha", "Missa", "semanal", 6, null, null, null, "19:00", null, 3],
  ["santa-teresinha", "Missa", "semanal", 0, null, null, null, "08:00", null, 4],
  ["santa-teresinha", "Adoração e Bênção do Santíssimo", "semanal", 3, null, null, null, "19:30", null, 5],
  ["sao-francisco", "Missa", "semanal", 0, null, null, null, "09:30", null, 1],
  ["nossa-senhora-do-rosario", "Missa", "semanal", 0, null, null, null, "17:00", null, 1],
  ["sao-jose", "Missa", "semanal", 0, null, null, null, "18:30", null, 1],
  ["santo-antonio", "Missa", "semanal", 0, null, null, null, "18:30", null, 1],
  ["nossa-senhora-de-guadalupe", "Missa", "mensal", 6, 2, null, null, "18:00", null, 1]
];

async function ensureProgramacaoTables() {
  if (!programacaoSetupPromise) {
    programacaoSetupPromise = (async () => {
      const db = getDb();
      const existing = await db.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'programacoes'");
      const isFirstSetup = existing.rows.length === 0;

      await db.batch([
        `CREATE TABLE IF NOT EXISTS comunidades (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL UNIQUE,
          nome TEXT NOT NULL,
          endereco TEXT NOT NULL,
          ordem INTEGER NOT NULL DEFAULT 0,
          ativo INTEGER NOT NULL DEFAULT 1,
          criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS programacoes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comunidade_id INTEGER NOT NULL,
          atividade TEXT NOT NULL,
          recorrencia TEXT NOT NULL,
          dia_semana INTEGER,
          semana_mes INTEGER,
          data_especifica TEXT,
          recorrencia_texto TEXT,
          horario TEXT NOT NULL,
          observacao TEXT,
          ordem INTEGER NOT NULL DEFAULT 0,
          ativo INTEGER NOT NULL DEFAULT 1,
          criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE RESTRICT
        )`
      ]);

      for (const comunidade of COMUNIDADES_INICIAIS) {
        await db.execute({
          sql: "INSERT OR IGNORE INTO comunidades (slug, nome, endereco, ordem) VALUES (?, ?, ?, ?)",
          args: comunidade
        });
      }

      if (isFirstSetup) {
        for (const programacao of PROGRAMACOES_INICIAIS) {
          await db.execute({
            sql: `INSERT INTO programacoes
              (comunidade_id, atividade, recorrencia, dia_semana, semana_mes, data_especifica, recorrencia_texto, horario, observacao, ordem)
              SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM comunidades WHERE slug = ?`,
            args: [
              programacao[1], programacao[2], programacao[3], programacao[4], programacao[5],
              programacao[6], programacao[7], programacao[8], programacao[9], programacao[0]
            ]
          });
        }
      }
    })();
  }

  return programacaoSetupPromise;
}

function rowToComunidade(row) {
  return {
    id: Number(row.id),
    slug: row.slug,
    nome: row.nome,
    endereco: row.endereco,
    ordem: Number(row.ordem),
    ativo: Boolean(row.ativo)
  };
}

function rowToProgramacao(row) {
  return {
    id: Number(row.id),
    comunidade_id: Number(row.comunidade_id),
    atividade: row.atividade,
    recorrencia: row.recorrencia,
    dia_semana: row.dia_semana == null ? null : Number(row.dia_semana),
    semana_mes: row.semana_mes == null ? null : Number(row.semana_mes),
    data_especifica: row.data_especifica || null,
    recorrencia_texto: row.recorrencia_texto || null,
    horario: row.horario,
    observacao: row.observacao || null,
    ordem: Number(row.ordem),
    ativo: Boolean(row.ativo)
  };
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
  ensureProgramacaoTables,
  getDb,
  rowToComunidade,
  rowToProgramacao,
  rowToAviso
};
