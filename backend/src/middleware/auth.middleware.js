const { verifyToken } = require("../utils/jwt");
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
  try { req.user = verifyToken(token); return next(); } catch { return res.status(401).json({ success: false, message: "Invalid or expired token" }); }
}
module.exports = { authenticate };
