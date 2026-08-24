
const { neon } = require("@neondatabase/serverless");

function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  return neon(process.env.DATABASE_URL);
}

async function ensureSchema() {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pin TEXT NOT NULL,
      payment TEXT NOT NULL,
      upi_id TEXT DEFAULT '',
      items_json JSONB NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return db;
}

module.exports = { sql, ensureSchema };
