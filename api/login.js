const crypto = require("crypto");

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const password = String((req.body || {}).password || "");
    const configured = String(process.env.ADMIN_PASSWORD || "");
    const secret = String(process.env.SESSION_SECRET || "");

    if (!configured || !secret) {
      console.error("Missing ADMIN_PASSWORD or SESSION_SECRET environment variable.");
      return res.status(500).json({ error: "Owner login is not configured on the server." });
    }

    const a = Buffer.from(password);
    const b = Buffer.from(configured);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!ok) {
      return res.status(401).json({ error: "Incorrect owner password." });
    }

    const exp = Date.now() + 1000 * 60 * 60 * 12;
    const body = String(exp);
    const token = body + "." + sign(body, secret);

    res.setHeader(
      "Set-Cookie",
      `era_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=43200`
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "A server error occurred during owner login." });
  }
};
