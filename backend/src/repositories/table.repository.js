const db = require("../config/database");

async function findAll(restaurantId) {
  const [rows] = await db.query(
    `SELECT rt.id, rt.restaurant_id AS restaurantId, rt.table_number AS tableNumber,
            rt.capacity,
            CASE
              WHEN rt.status = 'unavailable' THEN 'unavailable'
              WHEN rt.status = 'occupied' THEN 'occupied'
              WHEN (SELECT COUNT(*) FROM orders o WHERE o.table_id = rt.id AND o.status <> 'cancelled' AND (o.payment_status IS NULL OR o.payment_status <> 'paid')) > 0 THEN 'occupied'
              ELSE 'available'
            END AS status,
            rt.qr_token AS qrToken, rt.created_at AS createdAt,
            (SELECT COUNT(*) FROM orders o WHERE o.table_id = rt.id AND o.status IN ('pending', 'confirmed', 'preparing', 'ready')) AS activeOrdersCount
     FROM restaurant_tables rt
     WHERE rt.restaurant_id = ?
     ORDER BY CAST(rt.table_number AS UNSIGNED), rt.table_number ASC`,
    [restaurantId]
  );
  return rows;
}

async function findById(restaurantId, id) {
  const [rows] = await db.query(
    `SELECT id, restaurant_id AS restaurantId, table_number AS tableNumber,
            capacity, status, qr_token AS qrToken, created_at AS createdAt
     FROM restaurant_tables
     WHERE id = ? AND restaurant_id = ?`,
    [id, restaurantId]
  );
  return rows[0] || null;
}

async function create(restaurantId, { tableNumber, capacity, status = "available", qrToken }) {
  const [result] = await db.query(
    `INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, status, qr_token)
     VALUES (?, ?, ?, ?, ?)`,
    [restaurantId, tableNumber, capacity, status, qrToken]
  );
  return result.insertId;
}

async function update(restaurantId, id, { tableNumber, capacity, status }) {
  const [result] = await db.query(
    `UPDATE restaurant_tables
     SET table_number = ?, capacity = ?, status = ?
     WHERE id = ? AND restaurant_id = ?`,
    [tableNumber, capacity, status, id, restaurantId]
  );
  return result.affectedRows > 0;
}

async function updateStatus(restaurantId, id, status) {
  const [result] = await db.query(
    `UPDATE restaurant_tables
     SET status = ?
     WHERE id = ? AND restaurant_id = ?`,
    [status, id, restaurantId]
  );
  return result.affectedRows > 0;
}

async function remove(restaurantId, id) {
  const [result] = await db.query(
    `DELETE FROM restaurant_tables WHERE id = ? AND restaurant_id = ?`,
    [id, restaurantId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateStatus,
  remove,
};
