const db = require("../config/database");

async function findByEmail(email) {
  const [rows] = await db.query(
    `SELECT a.id, a.restaurant_id AS restaurantId, a.full_name AS fullName, a.phone, a.email,
            a.password_hash AS passwordHash, a.role, a.is_active AS isActive,
            r.name AS restaurantName, r.slug AS restaurantSlug
     FROM admins a
     LEFT JOIN restaurants r ON r.id = a.restaurant_id
     WHERE a.email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT a.id, a.restaurant_id AS restaurantId, a.full_name AS fullName, a.phone, a.email,
            a.role, a.is_active AS isActive, a.created_at AS createdAt,
            r.name AS restaurantName, r.slug AS restaurantSlug, r.logo_url AS restaurantLogoUrl
     FROM admins a
     LEFT JOIN restaurants r ON r.id = a.restaurant_id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function createAdmin({ restaurantId, fullName, phone, email, passwordHash, role = "admin" }) {
  const [result] = await db.query(
    `INSERT INTO admins (restaurant_id, full_name, phone, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [restaurantId || null, fullName, phone, email, passwordHash, role]
  );
  return result.insertId;
}

async function updatePassword(id, passwordHash) {
  await db.query("UPDATE admins SET password_hash = ? WHERE id = ?", [passwordHash, id]);
}

async function listAllAdmins() {
  const [rows] = await db.query(
    `SELECT a.id, a.restaurant_id AS restaurantId, a.full_name AS fullName, a.phone, a.email,
            a.role, a.is_active AS isActive, a.created_at AS createdAt,
            r.name AS restaurantName
     FROM admins a
     LEFT JOIN restaurants r ON r.id = a.restaurant_id
     ORDER BY a.created_at DESC`
  );
  return rows;
}

module.exports = {
  findByEmail,
  findById,
  createAdmin,
  updatePassword,
  listAllAdmins,
};
