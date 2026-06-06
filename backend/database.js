import pg from 'pg';
const { Pool } = pg;

let pool = null;

export async function getDb() {
  if (pool) return pool;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await initTables();
  return pool;
}

async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saidas (
      id SERIAL PRIMARY KEY,
      destinatario TEXT NOT NULL,
      valor NUMERIC(12,2) NOT NULL,
      data TEXT NOT NULL,
      origem TEXT NOT NULL,
      descricao TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documentos (
      id SERIAL PRIMARY KEY,
      saida_id INTEGER NOT NULL REFERENCES saidas(id) ON DELETE CASCADE,
      nome_original TEXT NOT NULL,
      nome_arquivo TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      tipo TEXT DEFAULT '',
      tamanho INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
