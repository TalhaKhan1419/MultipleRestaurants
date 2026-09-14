const db = require("../config/database");

async function findAll(restaurantId) {
  const [rows] = await db.query(
    `SELECT c.id, c.restaurant_id AS restaurantId, c.name, c.description,
            c.display_order AS displayOrder, c.is_active AS isActive,
            c.created_at AS createdAt,
            (SELECT COUNT(*) FROM menu_item_categories mic WHERE mic.category_id = c.id) AS itemCount
     FROM categories c
     WHERE c.restaurant_id = ?
     ORDER BY c.display_order ASC, c.name ASC`,
    [restaurantId]
  );
  return rows;
}

async function findById(restaurantId, id) {
  const [rows] = await db.query(
    `SELECT id, restaurant_id AS restaurantId, name, description,
            display_order AS displayOrder, is_active AS isActive, created_at AS createdAt
     FROM categories
     WHERE id = ? AND restaurant_id = ?`,
    [id, restaurantId]
  );
  return rows[0] || null;
}

async function create(restaurantId, { name, description, displayOrder = 0, isActive = true }) {
  const [result] = await db.query(
    `INSERT INTO categories (restaurant_id, name, description, display_order, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [restaurantId, name, description || null, displayOrder, isActive ? 1 : 0]
  );
  return result.insertId;
}

async function update(restaurantId, id, { name, description, displayOrder = 0, isActive = true }) {
  const [result] = await db.query(
    `UPDATE categories
     SET name = ?, description = ?, display_order = ?, is_active = ?
     WHERE id = ? AND restaurant_id = ?`,
    [name, description || null, displayOrder, isActive ? 1 : 0, id, restaurantId]
  );
  return result.affectedRows > 0;
}

async function remove(restaurantId, id) {
  const [result] = await db.query(
    `DELETE FROM categories WHERE id = ? AND restaurant_id = ?`,
    [id, restaurantId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
