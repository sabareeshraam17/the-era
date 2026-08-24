
const crypto = require("crypto");
const { setAuthCookie } = require("./_lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const password = String((req.body || {}).password || "");
  const configured = process.env.ADMIN_PASSWORD || "";
  const a = Buffer.from(password);
  const b = Buffer.from(configured);
  const ok = configured && a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return res.status(401).json({ error: "Incorrect owner password." });
  setAuthCookie(res);
  res.status(200).json({ ok: true });
};
