const { ensureSchema } = require("./_lib/db");
const { isAuthed } = require("../lib/auth");

module.exports = async (req, res) => {
  if (!isAuthed(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const db = await ensureSchema();
    const { search = "", date = "", status = "" } = req.query || {};

    let rows;
    const q = search ? `%${search}%` : "";

    if (status && date && search) {
      rows = await db`SELECT * FROM orders
        WHERE status=${status} AND DATE(created_at)=${date}
        AND (order_id ILIKE ${q} OR name ILIKE ${q} OR phone ILIKE ${q} OR email ILIKE ${q} OR items_json::text ILIKE ${q})
        ORDER BY created_at DESC`;
    } else if (status && date) {
      rows = await db`SELECT * FROM orders
        WHERE status=${status} AND DATE(created_at)=${date}
        ORDER BY created_at DESC`;
    } else if (status && search) {
      rows = await db`SELECT * FROM orders
        WHERE status=${status}
        AND (order_id ILIKE ${q} OR name ILIKE ${q} OR phone ILIKE ${q} OR email ILIKE ${q} OR items_json::text ILIKE ${q})
        ORDER BY created_at DESC`;
    } else if (date && search) {
      rows = await db`SELECT * FROM orders
        WHERE DATE(created_at)=${date}
        AND (order_id ILIKE ${q} OR name ILIKE ${q} OR phone ILIKE ${q} OR email ILIKE ${q} OR items_json::text ILIKE ${q})
        ORDER BY created_at DESC`;
    } else if (status) {
      rows = await db`SELECT * FROM orders
        WHERE status=${status}
        ORDER BY created_at DESC`;
    } else if (date) {
      rows = await db`SELECT * FROM orders
        WHERE DATE(created_at)=${date}
        ORDER BY created_at DESC`;
    } else if (search) {
      rows = await db`SELECT * FROM orders
        WHERE order_id ILIKE ${q} OR name ILIKE ${q} OR phone ILIKE ${q} OR email ILIKE ${q} OR items_json::text ILIKE ${q}
        ORDER BY created_at DESC`;
    } else {
      rows = await db`SELECT * FROM orders ORDER BY created_at DESC`;
    }

    const statsRows = await db`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status='NEW')::int AS new,
        COUNT(*) FILTER (WHERE status='DELIVERED')::int AS delivered,
        COALESCE(SUM(total) FILTER (WHERE status <> 'CANCELLED'),0)::int AS revenue
      FROM orders
    `;

    return res.status(200).json({
      orders: rows.map(r => ({
        orderId: r.order_id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        address: r.address,
        city: r.city,
        pin: r.pin,
        payment: r.payment,
        upiId: r.upi_id,
        items: Array.isArray(r.items_json) ? r.items_json : JSON.parse(r.items_json || "[]"),
        total: r.total,
        status: r.status,
        createdAt: r.created_at
      })),
      stats: statsRows[0]
    });
  } catch (err) {
    console.error("ADMIN ORDERS ERROR:", err);
    return res.status(500).json({ error: "Could not load orders." });
  }
};
