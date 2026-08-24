
const crypto = require("crypto");

function secret() {
  return process.env.SESSION_SECRET || "CHANGE_ME_BEFORE_PRODUCTION";
}
function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}
function makeToken() {
  const exp = Date.now() + 1000 * 60 * 60 * 12;
  const body = String(exp);
  return body + "." + sign(body);
}
function validToken(token) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
function setAuthCookie(res) {
  res.setHeader("Set-Cookie", `era_admin=${makeToken()}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=43200`);
}
function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", "era_admin=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0");
}
function isAuthed(req) {
  const raw = req.headers.cookie || "";
  const match = raw.match(/(?:^|;\s*)era_admin=([^;]+)/);
  return validToken(match && match[1]);
}
module.exports = { setAuthCookie, clearAuthCookie, isAuthed };
