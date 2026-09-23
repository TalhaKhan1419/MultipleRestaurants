const db = require("../config/database");

async function findCategories(restaurantId) {
  const [rows] = await db.query(
    "SELECT id, name, description, display_order AS displayOrder FROM categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY display_order, name",
    [restaurantId],
  );
  return rows;
}

async function findItemsWithCategories(restaurantId) {
  const [items] = await db.query(
    "SELECT id, restaurant_id AS restaurantId, name, description, price, image_url AS imageUrl, image_public_id AS imagePublicId, is_available AS isAvailable FROM menu_items WHERE restaurant_id = ? ORDER BY name",
    [restaurantId],
  );
  if (!items.length) return [];

  const [assignments] = await db.query(
    "SELECT mic.menu_item_id AS menuItemId, c.id, c.name FROM menu_item_categories mic INNER JOIN categories c ON c.id = mic.category_id WHERE c.restaurant_id = ? ORDER BY c.display_order, c.name",
    [restaurantId],
  );
  const categoryMap = new Map();
  for (const assignment of assignments) {
    const categories = categoryMap.get(assignment.menuItemId) || [];
    categories.push({ id: assignment.id, name: assignment.name });
    categoryMap.set(assignment.menuItemId, categories);
  }
  return items.map((item) => ({ ...item, categories: categoryMap.get(item.id) || [] }));
}

async function categoriesBelongToRestaurant(connection, restaurantId, categoryIds) {
  const placeholders = categoryIds.map(() => "?").join(", ");
  const [rows] = await connection.query(
    `SELECT id FROM categories WHERE restaurant_id = ? AND is_active = 1 AND id IN (${placeholders})`,
    [restaurantId, ...categoryIds],
  );
  return rows.length === categoryIds.length;
}

async function replaceCategories(connection, restaurantId, menuItemId, categoryIds) {
  await connection.query("DELETE FROM menu_item_categories WHERE menu_item_id = ?", [menuItemId]);
  const values = categoryIds.map((categoryId) => [restaurantId, menuItemId, categoryId]);
  await connection.query("INSERT INTO menu_item_categories (restaurant_id, menu_item_id, category_id) VALUES ?", [values]);
}

async function createMenuItem(data) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (!data.categoryIds || !data.categoryIds.length) {
      const [existingCats] = await connection.query(
        "SELECT id FROM categories WHERE restaurant_id = ? AND is_active = 1 LIMIT 1",
        [data.restaurantId]
      );
      if (existingCats.length) {
        data.categoryIds = [existingCats[0].id];
      } else {
        const [newCat] = await connection.query(
          "INSERT INTO categories (restaurant_id, name, description, display_order) VALUES (?, 'Main Menu', 'General menu dishes', 1)",
          [data.restaurantId]
        );
        data.categoryIds = [newCat.insertId];
      }
    }

    if (!(await categoriesBelongToRestaurant(connection, data.restaurantId, data.categoryIds))) {
      const error = new Error("One or more selected categories do not belong to this restaurant");
      error.status = 400;
      throw error;
    }

    const isAvail = data.isAvailable !== false && data.isAvailable !== 0 && data.isAvailable !== "0" && data.isAvailable !== "false";
    const [result] = await connection.query(
      "INSERT INTO menu_items (restaurant_id, name, description, price, image_url, image_public_id, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [data.restaurantId, data.name, data.description || null, data.price, data.imageUrl || null, data.imagePublicId || null, isAvail ? 1 : 0],
    );
    await replaceCategories(connection, data.restaurantId, result.insertId, data.categoryIds);
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateMenuItem(id, data) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query("SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?", [id, data.restaurantId]);
    if (!existing.length) {
      const error = new Error("Menu item not found");
      error.status = 404;
      throw error;
    }
    if (!(await categoriesBelongToRestaurant(connection, data.restaurantId, data.categoryIds))) {
      const error = new Error("One or more categories do not belong to this restaurant");
      error.status = 400;
      throw error;
    }
    const isAvail = data.isAvailable !== false && data.isAvailable !== 0 && data.isAvailable !== "0" && data.isAvailable !== "false";
    await connection.query(
      "UPDATE menu_items SET name = ?, description = ?, price = ?, image_url = ?, image_public_id = ?, is_available = ? WHERE id = ?",
      [data.name, data.description || null, data.price, data.imageUrl || null, data.imagePublicId || null, isAvail ? 1 : 0, id],
    );
    await replaceCategories(connection, data.restaurantId, id, data.categoryIds);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findItemById(restaurantId, id) {
  const [items] = await db.query(
    "SELECT id, restaurant_id AS restaurantId, name, description, price, image_url AS imageUrl, image_public_id AS imagePublicId, is_available AS isAvailable FROM menu_items WHERE id = ? AND restaurant_id = ?",
    [id, restaurantId],
  );
  if (!items.length) return null;
  const item = items[0];
  const [categories] = await db.query(
    "SELECT c.id, c.name FROM menu_item_categories mic INNER JOIN categories c ON c.id = mic.category_id AND c.restaurant_id = mic.restaurant_id WHERE mic.menu_item_id = ? AND mic.restaurant_id = ? ORDER BY c.display_order, c.name",
    [id, restaurantId],
  );
  return { ...item, categories };
}

async function deleteMenuItem(restaurantId, id) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(
      "SELECT image_public_id AS imagePublicId FROM menu_items WHERE id = ? AND restaurant_id = ? FOR UPDATE",
      [id, restaurantId],
    );
    if (!existing.length) {
      await connection.rollback();
      return null;
    }
    await connection.query("DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?", [id, restaurantId]);
    await connection.commit();
    return existing[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findPublicMenu(qrToken) {
  let [tables] = await db.query(
    `SELECT rt.id AS tableId, rt.table_number AS tableNumber, rt.capacity,
            CASE
              WHEN (SELECT COUNT(*) FROM orders o WHERE o.table_id = rt.id AND o.status NOT IN ('cancelled', 'completed') AND (o.payment_status IS NULL OR o.payment_status <> 'paid')) = 0 THEN 'available'
              ELSE rt.status
            END AS status,
            rt.qr_token AS qrToken, r.id AS restaurantId, r.name AS restaurantName
     FROM restaurant_tables rt
     INNER JOIN restaurants r ON r.id = rt.restaurant_id
     WHERE rt.qr_token = ? AND r.is_active = 1`,
    [qrToken],
  );

  const isGeneric = !tables.length || qrToken === "default" || qrToken === "menu";

  if (!tables.length) {
    [tables] = await db.query(
      `SELECT rt.id AS tableId, rt.table_number AS tableNumber, rt.capacity,
              CASE
                WHEN (SELECT COUNT(*) FROM orders o WHERE o.table_id = rt.id AND o.status NOT IN ('cancelled', 'completed') AND (o.payment_status IS NULL OR o.payment_status <> 'paid')) = 0 THEN 'available'
                ELSE rt.status
              END AS status,
              rt.qr_token AS qrToken, r.id AS restaurantId, r.name AS restaurantName
       FROM restaurant_tables rt
       INNER JOIN restaurants r ON r.id = rt.restaurant_id
       WHERE r.is_active = 1 ORDER BY r.id DESC LIMIT 1`
    );
  }

  if (!tables.length) return null;
  const currentTable = tables[0];

  const [allTables, rooms, categories, items] = await Promise.all([
    db.query(
      `SELECT rt.id AS tableId, rt.table_number AS tableNumber, rt.capacity,
              CASE
                WHEN (SELECT COUNT(*) FROM orders o WHERE o.table_id = rt.id AND o.status NOT IN ('cancelled', 'completed') AND (o.payment_status IS NULL OR o.payment_status <> 'paid')) = 0 THEN 'available'
                ELSE rt.status
              END AS status,
              rt.qr_token AS qrToken
       FROM restaurant_tables rt
       WHERE rt.restaurant_id = ?
       ORDER BY CAST(rt.table_number AS UNSIGNED), rt.table_number ASC`,
      [currentTable.restaurantId],
    ).then(([r]) => r),
    db.query(
      `SELECT r.id AS roomId, r.room_number AS roomNumber, r.room_type AS type, r.floor, r.capacity, r.price,
              CASE
                WHEN b.id IS NOT NULL THEN 'occupied'
                ELSE r.status
              END AS status
       FROM guest_rooms r
       LEFT JOIN room_bookings b ON r.id = b.room_id AND b.status = 'active'
       WHERE r.restaurant_id = ?
       ORDER BY CAST(r.room_number AS UNSIGNED), r.room_number ASC`,
      [currentTable.restaurantId],
    ).then(([r]) => r.map((room) => ({
      ...room,
      price: room.price != null ? Number(room.price) : null,
      status: (room.status || "available").toLowerCase(),
    }))),
    findCategories(currentTable.restaurantId),
    findItemsWithCategories(currentTable.restaurantId),
  ]);

  return {
    ...currentTable,
    isGenericAccess: isGeneric,
    tables: allTables,
    rooms: rooms,
    categories: categories.map((category) => ({
      ...category,
      items: items.filter((item) => item.isAvailable && item.categories.some(({ id }) => id === category.id)),
    })),
  };
}

module.exports = { findCategories, findItemsWithCategories, findItemById, createMenuItem, updateMenuItem, deleteMenuItem, findPublicMenu };
