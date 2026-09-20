const db = require("../config/database");

async function findById(id) {
  const [rows] = await db.query(
    `SELECT id, name, slug, phone, email, address, logo_url AS logoUrl,
            is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
     FROM restaurants
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function updateProfile(id, { name, phone, email, address, logoUrl }) {
  const [result] = await db.query(
    `UPDATE restaurants
     SET name = ?, phone = ?, email = ?, address = ?, logo_url = ?
     WHERE id = ?`,
    [name, phone || null, email || null, address || null, logoUrl || null, id]
  );
  return result.affectedRows > 0;
}

async function listAllWithDetails() {
  const [rows] = await db.query(
    `SELECT r.id, r.name, r.slug, r.phone, r.email, r.address, r.logo_url AS logoUrl,
            r.is_active AS isActive, r.created_at AS createdAt,
            a.id AS adminId, a.full_name AS adminName, a.email AS adminEmail, a.phone AS adminPhone,
            (SELECT COUNT(*) FROM menu_items m WHERE m.restaurant_id = r.id) AS menuItemsCount,
            (SELECT COUNT(*) FROM restaurant_tables t WHERE t.restaurant_id = r.id) AS tablesCount,
            (SELECT COUNT(*) FROM orders o WHERE o.restaurant_id = r.id) AS ordersCount,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.restaurant_id = r.id AND o.payment_status = 'paid') AS totalRevenue
     FROM restaurants r
     LEFT JOIN admins a ON a.restaurant_id = r.id AND a.role = 'admin'
     ORDER BY r.created_at DESC`
  );
  return rows;
}

async function createRestaurantWithAdmin(restaurantData, adminData, passwordHash) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let slug = restaurantData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const [existingSlug] = await connection.query("SELECT id FROM restaurants WHERE slug = ?", [slug]);
    if (existingSlug.length) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const [restResult] = await connection.query(
      `INSERT INTO restaurants (name, slug, phone, email, address, logo_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        restaurantData.name,
        slug,
        null,
        null,
        restaurantData.address || null,
        null,
      ]
    );

    const restaurantId = restResult.insertId;

    const [adminResult] = await connection.query(
      `INSERT INTO admins (restaurant_id, full_name, phone, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'admin', 1)`,
      [restaurantId, adminData.adminName, adminData.adminPhone, adminData.adminEmail, passwordHash]
    );

    // Seed standard default categories for new restaurant
    const defaultCats = [
      ['Starters', 'Light dishes, soup & appetizers', 1],
      ['Main Course', 'Curries, biryanis & rich mains', 2],
      ['Beverages', 'Hot & cold drinks, juices, shakes', 3],
      ['Non-Veg', 'Chicken, mutton, fish & egg specials', 4],
      ['Chinese & Fast Food', 'Noodles, fried rice, rolls & burgers', 5],
      ['Desserts & Sweets', 'Ice cream, sweets & dessert treats', 6],
    ];
    for (const [name, desc, order] of defaultCats) {
      await connection.query(
        "INSERT INTO categories (restaurant_id, name, description, display_order, is_active) VALUES (?, ?, ?, ?, 1)",
        [restaurantId, name, desc, order]
      );
    }

    await connection.commit();
    return {
      restaurantId,
      slug,
      adminId: adminResult.insertId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateStatus(id, isActive) {
  const [result] = await db.query(
    "UPDATE restaurants SET is_active = ? WHERE id = ?",
    [isActive ? 1 : 0, id]
  );
  return result.affectedRows > 0;
}

async function getPlatformStats() {
  const [totals] = await db.query(
    `SELECT (SELECT COUNT(*) FROM restaurants) AS totalRestaurants,
            (SELECT COUNT(*) FROM restaurants WHERE is_active = 1) AS activeRestaurants,
            (SELECT COUNT(*) FROM admins WHERE role = 'admin') AS totalAdmins,
            (SELECT COUNT(*) FROM orders) AS totalOrders,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid') AS totalPlatformRevenue`
  );

  const [recentRestaurants] = await db.query(
    `SELECT r.id, r.name, r.slug, r.is_active AS isActive, r.created_at AS createdAt,
            a.full_name AS adminName, a.email AS adminEmail
     FROM restaurants r
     LEFT JOIN admins a ON a.restaurant_id = r.id AND a.role = 'admin'
     ORDER BY r.created_at DESC
     LIMIT 5`
  );

  return {
    ...totals[0],
    recentRestaurants,
  };
}

module.exports = {
  findById,
  updateProfile,
  listAllWithDetails,
  createRestaurantWithAdmin,
  updateStatus,
  getPlatformStats,
};
