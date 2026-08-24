
const { ensureSchema } = require("../lib/db");
const { isAuthed } = require("../lib/auth");

module.exports = async (req, res) => {
  if (!isAuthed(req)) return res.status(401).json({ error: "Unauthorized" });
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });
  const allowed = ["NEW","CONFIRMED","SHIPPED","DELIVERED","CANCELLED"];
  const status = req.body && req.body.status;
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
  try {
    const db = await ensureSchema();
    const rows = await db`UPDATE orders SET status=${status} WHERE order_id=${req.query.id} RETURNING order_id`;
    if (!rows.length) return res.status(404).json({ error: "Order not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to update order." });
  }
};
