const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

function isAuthed(req) {
  const secret = String(process.env.SESSION_SECRET || "");
  if (!secret) return false;

  const raw = req.headers.cookie || "";
  const match = raw.match(/(?:^|;\s*)era_admin=([^;]+)/);
  if (!match) return false;

  const [exp, sig] = match[1].split(".");
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
  if (!url) throw new Error("DATABASE_URL / STORAGE_DATABASE_URL is missing.");
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

  try {
    const db = getDb();
    await ensureSchema(db);

    const search = String((req.query && req.query.search) || "");
    const date = String((req.query && req.query.date) || "");
    const status = String((req.query && req.query.status) || "");
    const q = `%${search}%`;

    let rows;

    if (status && date && search) {
      rows = await db`
        SELECT * FROM orders
        WHERE status=${status}
          AND DATE(created_at)=${date}
          AND (
            order_id ILIKE ${q}
            OR name ILIKE ${q}
            OR phone ILIKE ${q}
            OR email ILIKE ${q}
            OR items_json::text ILIKE ${q}
          )
        ORDER BY created_at DESC
      `;
    } else if (status && date) {
      rows = await db`
        SELECT * FROM orders
        WHERE status=${status} AND DATE(created_at)=${date}
        ORDER BY created_at DESC
      `;
    } else if (status && search) {
      rows = await db`
        SELECT * FROM orders
        WHERE status=${status}
          AND (
            order_id ILIKE ${q}
            OR name ILIKE ${q}
            OR phone ILIKE ${q}
            OR email ILIKE ${q}
            OR items_json::text ILIKE ${q}
          )
        ORDER BY created_at DESC
      `;
    } else if (date && search) {
      rows = await db`
        SELECT * FROM orders
        WHERE DATE(created_at)=${date}
          AND (
            order_id ILIKE ${q}
            OR name ILIKE ${q}
            OR phone ILIKE ${q}
            OR email ILIKE ${q}
            OR items_json::text ILIKE ${q}
          )
        ORDER BY created_at DESC
      `;
    } else if (status) {
      rows = await db`
        SELECT * FROM orders
        WHERE status=${status}
        ORDER BY created_at DESC
      `;
    } else if (date) {
      rows = await db`
        SELECT * FROM orders
        WHERE DATE(created_at)=${date}
        ORDER BY created_at DESC
      `;
    } else if (search) {
      rows = await db`
        SELECT * FROM orders
        WHERE order_id ILIKE ${q}
           OR name ILIKE ${q}
           OR phone ILIKE ${q}
           OR email ILIKE ${q}
           OR items_json::text ILIKE ${q}
        ORDER BY created_at DESC
      `;
    } else {
      rows = await db`
        SELECT * FROM orders
        ORDER BY created_at DESC
      `;
    }

    const stats = await db`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status='NEW')::int AS new,
        COUNT(*) FILTER (WHERE status='DELIVERED')::int AS delivered,
        COALESCE(SUM(total) FILTER (WHERE status <> 'CANCELLED'), 0)::int AS revenue
      FROM orders
    `;

    const orders = rows.map(r => ({
      orderId: r.order_id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      address: r.address,
      city: r.city,
      pin: r.pin,
      payment: r.payment,
      upiId: r.upi_id || "",
      items: Array.isArray(r.items_json) ? r.items_json : JSON.parse(r.items_json || "[]"),
      total: r.total,
      status: r.status,
      createdAt: r.created_at
    }));

    return res.status(200).json({
      orders,
      stats: stats[0] || { total: 0, new: 0, delivered: 0, revenue: 0 }
    });
  } catch (err) {
    console.error("ADMIN ORDERS ERROR:", err);
    return res.status(500).json({
      error: "Could not load orders.",
      detail: String(err && err.message || err)
    });
  }
};
