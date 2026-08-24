
const { ensureSchema } = require("./_lib/db");

const PRODUCTS = {
  "baggy-combo": { name: "Baggy Combo", price: 1480 },
  "baggy-black-denim": { name: "Baggy Black Light Washed Denim", price: 899 },
  "slim-yellow-stripe-shirt": { name: "Slim Fit Yellow Stripe Shirt", price: 599 }
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const db = await ensureSchema();
    const { customer, payment, upiId, items } = req.body || {};
    if (!customer || !customer.name || !customer.phone || !customer.email ||
        !customer.address || !customer.city || !/^\d{6}$/.test(customer.pin || "")) {
      return res.status(400).json({ error: "Please complete all delivery details." });
    }
    if (!["cod", "upi"].includes(payment)) return res.status(400).json({ error: "Invalid payment method." });
    if (payment === "upi" && !upiId) return res.status(400).json({ error: "UPI ID is required." });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Your cart is empty." });

    let total = 0;
    const cleanItems = [];
    for (const item of items) {
      const p = PRODUCTS[item.id];
      const qty = Math.max(1, Math.min(20, parseInt(item.qty, 10) || 0));
      if (!p) return res.status(400).json({ error: "Invalid product." });
      total += p.price * qty;
      cleanItems.push({ id: item.id, name: p.name, price: p.price, qty });
    }

    const orderId = "ERA" + Date.now().toString().slice(-8);
    const rows = await db`
      INSERT INTO orders
      (order_id,name,phone,email,address,city,pin,payment,upi_id,items_json,total,status)
      VALUES
      (${orderId},${customer.name},${customer.phone},${customer.email},${customer.address},
       ${customer.city},${customer.pin},${payment},${upiId || ""},${JSON.stringify(cleanItems)},
       ${total},'NEW')
      RETURNING order_id, items_json, total, payment, status, created_at
    `;
    const o = rows[0];
    res.status(201).json({
      order: {
        orderId: o.order_id,
        items: cleanItems,
        total: o.total,
        payment: o.payment,
        status: o.status,
        createdAt: o.created_at
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not place order." });
  }
};
