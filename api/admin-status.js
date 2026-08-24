const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

function isAuthed(req) {
  const secret = String(process.env.SESSION_SECRET || "");
  if (!secret) return false;

  const raw = req.headers.cookie || "";
  const match = raw.match(/(?:^|;\s*)era_admin=([^;]+)/);
  if (!match) return false;

  const parts = match[1].split(".");
  if (parts.length !== 2) return false;

  const [exp, sig] = parts;
  if (!exp || !sig || Number(exp) < Date.now()) return false;

  const expected = crypto.createHmac("sha256", secret).update(exp).digest("base64url");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

function getDb() {
  const url = process.env.DATABASE_URL || process.env.STORAGE_DATABASE_URL;
  if (!url) throw new Error("Neon database connection is not configured.");
  return neon(url);
}

async function ensureSchema(db) {
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
}

module.exports = async (req, res) => {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const id = String((req.query && req.query.id) || "").trim();
    const status = String((req.body && req.body.status) || "").trim().toUpperCase();

    const allowed = ["NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

    if (!id) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid order status." });
    }

    const db = getDb();
    await ensureSchema(db);

    const rows = await db`
      UPDATE orders
      SET status=${status}
      WHERE order_id=${id}
      RETURNING order_id, status
    `;

    if (!rows.length) {
      return res.status(404).json({ error: "Order not found." });
    }

    return res.status(200).json({
      ok: true,
      orderId: rows[0].order_id,
      status: rows[0].status
    });
  } catch (err) {
    console.error("ADMIN STATUS ERROR:", err);
    return res.status(500).json({
      error: "Unable to update order.",
      detail: String(err && err.message || err)
    });
  }
};
