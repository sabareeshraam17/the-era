const { neon } = require("@neondatabase/serverless");

const PRODUCTS = {
  "baggy-combo": { name: "Baggy Combo", price: 1480 },
  "baggy-black-denim": { name: "Baggy Black Light Washed Denim", price: 899 },
  "slim-yellow-stripe-shirt": { name: "Slim Fit Yellow Stripe Shirt", price: 599 }
};

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
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body || {};
    const customer = body.customer || {};
    const payment = body.payment;
    const upiId = body.upiId || "";
    const items = body.items;

    if (!customer.name || !customer.phone || !customer.email ||
        !customer.address || !customer.city || !/^\d{6}$/.test(String(customer.pin || ""))) {
      return res.status(400).json({ error: "Please complete all delivery details." });
    }

    if (!["cod", "upi"].includes(payment)) {
      return res.status(400).json({ error: "Invalid payment method." });
    }

    if (payment === "upi" && !upiId) {
      return res.status(400).json({ error: "UPI ID is required." });
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    let total = 0;
    const cleanItems = [];

    for (const item of items) {
      const product = PRODUCTS[item.id];
      const qty = Math.max(1, Math.min(20, parseInt(item.qty, 10) || 0));
      if (!product) return res.status(400).json({ error: "Invalid product." });

      total += product.price * qty;
      cleanItems.push({
        id: item.id,
        name: product.name,
        price: product.price,
        qty
      });
    }

    const db = getDb();
    await ensureSchema(db);

    const orderId = "ERA" + Date.now().toString().slice(-8);

    const rows = await db`
      INSERT INTO orders
      (order_id, name, phone, email, address, city, pin, payment, upi_id, items_json, total, status)
      VALUES
      (${orderId}, ${String(customer.name).trim()}, ${String(customer.phone).trim()},
       ${String(customer.email).trim()}, ${String(customer.address).trim()},
       ${String(customer.city).trim()}, ${String(customer.pin).trim()},
       ${payment}, ${upiId}, ${JSON.stringify(cleanItems)}, ${total}, 'NEW')
      RETURNING order_id, total, payment, status, created_at
    `;

    return res.status(201).json({
      order: {
        orderId: rows[0].order_id,
        items: cleanItems,
        total: rows[0].total,
        payment: rows[0].payment,
        status: rows[0].status,
        createdAt: rows[0].created_at
      }
    });
  } catch (err) {
    console.error("ORDER ERROR:", err);
    return res.status(500).json({ error: "A server error occurred while placing the order." });
  }
};
