const { neon } = require("@neondatabase/serverless");

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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = getDb();
    await ensureSchema(db);

    const orderId = String((req.query && req.query.orderId) || "").trim();
    const email = String((req.query && req.query.email) || "").trim().toLowerCase();
    const phone = String((req.query && req.query.phone) || "").replace(/\D/g, "");

    if (!email || !phone) {
      return res.status(400).json({ error: "Enter the email and phone number used for the order." });
    }

    let rows;
    if (orderId) {
      rows = await db`
        SELECT order_id, name, email, phone, address, city, pin, payment, items_json, total, status, created_at
        FROM orders
        WHERE order_id=${orderId}
          AND LOWER(email)=${email}
          AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g')=${phone}
        ORDER BY created_at DESC
      `;
    } else {
      rows = await db`
        SELECT order_id, name, email, phone, address, city, pin, payment, items_json, total, status, created_at
        FROM orders
        WHERE LOWER(email)=${email}
          AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g')=${phone}
        ORDER BY created_at DESC
      `;
    }

    if (!rows.length) {
      return res.status(404).json({
        error: orderId
          ? "No matching order was found. Check the order ID, email and phone number."
          : "No orders were found for that email and phone number."
      });
    }

    const orders = rows.map(r => ({
      orderId: r.order_id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      address: r.address,
      city: r.city,
      pin: r.pin,
      payment: r.payment,
      items: Array.isArray(r.items_json) ? r.items_json : JSON.parse(r.items_json || "[]"),
      total: r.total,
      status: r.status,
      createdAt: r.created_at
    }));

    return res.status(200).json({ orders });
  } catch (err) {
    console.error("TRACK ORDER ERROR:", err);
    return res.status(500).json({ error: "Unable to load your orders right now." });
  }
};
