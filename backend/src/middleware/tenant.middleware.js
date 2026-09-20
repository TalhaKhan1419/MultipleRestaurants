const db = require("../config/database");

async function requireTenant(req, res, next) {
  try {
    // If user is super_admin, they can specify a restaurantId via header or query, or fallback to active restaurant
    if (req.user?.role === "super_admin") {
      let targetId = Number(req.headers["x-restaurant-id"] || req.query.restaurantId || req.user?.restaurantId);
      if (!Number.isInteger(targetId) || targetId <= 0) {
        const [rows] = await db.query("SELECT id FROM restaurants WHERE is_active = 1 ORDER BY id DESC LIMIT 1");
        if (rows.length > 0) {
          targetId = rows[0].id;
        }
      }
      if (Number.isInteger(targetId) && targetId > 0) {
        req.tenant = { restaurantId: targetId };
        req.tenantId = targetId;
        return next();
      }
    }

    // Tenant identity is part of the signed JWT for an admin.
    const restaurantId = Number(req.user?.restaurantId);
    if (!Number.isInteger(restaurantId) || restaurantId < 1) {
      return res.status(403).json({ success: false, message: "Restaurant tenant access is required" });
    }
    req.tenant = { restaurantId };
    req.tenantId = restaurantId;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireTenant };
