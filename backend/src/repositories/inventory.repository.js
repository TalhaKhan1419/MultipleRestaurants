const db = require("../config/database");

function computeStatus(currentStock, minimumStock) {
  const stock = Number(currentStock || 0);
  const minStock = Number(minimumStock || 0);
  if (stock <= 0) return "out_of_stock";
  if (stock <= minStock) return "low_stock";
  return "in_stock";
}

// --- CATEGORIES ---
async function listCategories(restaurantId) {
  const [rows] = await db.query(
    `SELECT c.id, c.restaurant_id AS restaurantId, c.name, c.description,
            (SELECT COUNT(*) FROM inventory_items i WHERE i.category_id = c.id) AS itemCount,
            c.created_at AS createdAt, c.updated_at AS updatedAt
     FROM inventory_categories c
     WHERE c.restaurant_id = ?
     ORDER BY c.name ASC`,
    [restaurantId]
  );
  return rows;
}

async function createCategory(restaurantId, { name, description }) {
  const [result] = await db.query(
    `INSERT INTO inventory_categories (restaurant_id, name, description) VALUES (?, ?, ?)`,
    [restaurantId, name.trim(), description ? description.trim() : null]
  );
  return { id: result.insertId, restaurantId, name: name.trim(), description };
}

async function updateCategory(restaurantId, id, { name, description }) {
  const [existing] = await db.query(
    `SELECT id FROM inventory_categories WHERE id = ? AND restaurant_id = ?`,
    [id, restaurantId]
  );
  if (!existing.length) {
    throw new Error("Inventory category not found");
  }

  await db.query(
    `UPDATE inventory_categories SET name = ?, description = ? WHERE id = ? AND restaurant_id = ?`,
    [name.trim(), description ? description.trim() : null, id, restaurantId]
  );
  return { id, restaurantId, name: name.trim(), description };
}

async function deleteCategory(restaurantId, id) {
  const [result] = await db.query(
    `DELETE FROM inventory_categories WHERE id = ? AND restaurant_id = ?`,
    [id, restaurantId]
  );
  if (result.affectedRows === 0) {
    throw new Error("Inventory category not found");
  }
  return { success: true };
}

// --- SUPPLIERS ---
async function listSuppliers(restaurantId) {
  const [rows] = await db.query(
    `SELECT s.id, s.restaurant_id AS restaurantId, s.name, s.phone, s.email, s.address,
            s.created_at AS createdAt, s.updated_at AS updatedAt
     FROM suppliers s
     WHERE s.restaurant_id = ?
     ORDER BY s.name ASC`,
    [restaurantId]
  );
  return rows;
}

async function createSupplier(restaurantId, { name, phone, email, address }) {
  const [result] = await db.query(
    `INSERT INTO suppliers (restaurant_id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
    [restaurantId, name.trim(), phone ? phone.trim() : null, email ? email.trim() : null, address ? address.trim() : null]
  );
  return { id: result.insertId, restaurantId, name: name.trim(), phone, email, address };
}

// --- SUMMARY & METRICS ---
async function getSummary(restaurantId) {
  const [rows] = await db.query(
    `SELECT
       COUNT(*) AS totalItems,
       COALESCE(SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END), 0) AS inStockCount,
       COALESCE(SUM(CASE WHEN status = 'low_stock' THEN 1 ELSE 0 END), 0) AS lowStockCount,
       COALESCE(SUM(CASE WHEN status = 'out_of_stock' THEN 1 ELSE 0 END), 0) AS outOfStockCount
     FROM inventory_items
     WHERE restaurant_id = ?`,
    [restaurantId]
  );
  return rows[0] || { totalItems: 0, inStockCount: 0, lowStockCount: 0, outOfStockCount: 0 };
}

// --- ITEMS LIST & SEARCH ---
async function listItems(restaurantId, { page = 1, limit = 20, search = "", categoryId = "", status = "", unit = "" }) {
  const offset = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const parsedLimit = Math.max(1, Number(limit));

  let whereClauses = ["i.restaurant_id = ?"];
  let params = [restaurantId];

  if (search && search.trim()) {
    whereClauses.push("(i.item_name LIKE ? OR i.description LIKE ?)");
    const q = `%${search.trim()}%`;
    params.push(q, q);
  }

  if (categoryId && Number(categoryId) > 0) {
    whereClauses.push("i.category_id = ?");
    params.push(Number(categoryId));
  }

  if (status && status.trim()) {
    whereClauses.push("i.status = ?");
    params.push(status.trim());
  }

  if (unit && unit.trim()) {
    whereClauses.push("i.unit = ?");
    params.push(unit.trim());
  }

  const whereSql = whereClauses.join(" AND ");

  // Count total matching
  const [countResult] = await db.query(
    `SELECT COUNT(*) AS total FROM inventory_items i WHERE ${whereSql}`,
    params
  );
  const total = countResult[0]?.total || 0;

  // Query paginated items
  const [items] = await db.query(
    `SELECT i.id, i.restaurant_id AS restaurantId, i.category_id AS categoryId,
            c.name AS categoryName, i.item_name AS itemName, i.unit,
            i.current_stock AS currentStock, i.minimum_stock AS minimumStock,
            i.maximum_stock AS maximumStock, i.purchase_price AS purchasePrice,
            i.supplier_id AS supplierId, s.name AS supplierName,
            i.description, i.status, i.created_at AS createdAt, i.updated_at AS updatedAt
     FROM inventory_items i
     LEFT JOIN inventory_categories c ON c.id = i.category_id
     LEFT JOIN suppliers s ON s.id = i.supplier_id
     WHERE ${whereSql}
     ORDER BY i.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parsedLimit, offset]
  );

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
  };
}

async function getLowStockItems(restaurantId) {
  const [rows] = await db.query(
    `SELECT i.id, i.restaurant_id AS restaurantId, i.item_name AS itemName,
            i.unit, i.current_stock AS currentStock, i.minimum_stock AS minimumStock,
            i.status, c.name AS categoryName
     FROM inventory_items i
     LEFT JOIN inventory_categories c ON c.id = i.category_id
     WHERE i.restaurant_id = ? AND i.status IN ('low_stock', 'out_of_stock')
     ORDER BY i.current_stock ASC`,
    [restaurantId]
  );
  return rows;
}

async function getItemById(restaurantId, id) {
  const [rows] = await db.query(
    `SELECT i.id, i.restaurant_id AS restaurantId, i.category_id AS categoryId,
            c.name AS categoryName, i.item_name AS itemName, i.unit,
            i.current_stock AS currentStock, i.minimum_stock AS minimumStock,
            i.maximum_stock AS maximumStock, i.purchase_price AS purchasePrice,
            i.supplier_id AS supplierId, s.name AS supplierName,
            i.description, i.status, i.created_at AS createdAt, i.updated_at AS updatedAt
     FROM inventory_items i
     LEFT JOIN inventory_categories c ON c.id = i.category_id
     LEFT JOIN suppliers s ON s.id = i.supplier_id
     WHERE i.id = ? AND i.restaurant_id = ?`,
    [id, restaurantId]
  );

  if (!rows.length) return null;
  return rows[0];
}

// --- CREATE ITEM ---
async function createItem(restaurantId, { categoryId, itemName, unit, currentStock = 0, minimumStock = 0, maximumStock = null, purchasePrice = 0, supplierId = null, description = "" }, createdBy = "Admin") {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const stockVal = Math.max(0, Number(currentStock || 0));
    const minStockVal = Math.max(0, Number(minimumStock || 0));
    const maxStockVal = maximumStock !== null && maximumStock !== "" ? Number(maximumStock) : null;
    const priceVal = Math.max(0, Number(purchasePrice || 0));
    const statusVal = computeStatus(stockVal, minStockVal);

    const [result] = await connection.query(
      `INSERT INTO inventory_items (restaurant_id, category_id, item_name, unit, current_stock, minimum_stock, maximum_stock, purchase_price, supplier_id, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        restaurantId,
        categoryId ? Number(categoryId) : null,
        itemName.trim(),
        unit.trim().toUpperCase(),
        stockVal,
        minStockVal,
        maxStockVal,
        priceVal,
        supplierId ? Number(supplierId) : null,
        description ? description.trim() : null,
        statusVal,
      ]
    );

    const itemId = result.insertId;

    // Log initial transaction if stock > 0
    if (stockVal > 0) {
      await connection.query(
        `INSERT INTO inventory_transactions (restaurant_id, inventory_item_id, transaction_type, quantity, previous_stock, new_stock, reason, note, created_by)
         VALUES (?, ?, 'STOCK_IN', ?, 0.000, ?, 'Initial Stock', 'Item creation', ?)`,
        [restaurantId, itemId, stockVal, stockVal, createdBy]
      );
    }

    await connection.commit();
    return getItemById(restaurantId, itemId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// --- UPDATE ITEM ---
async function updateItem(restaurantId, id, { categoryId, itemName, unit, minimumStock, maximumStock, purchasePrice, supplierId, description }) {
  const existing = await getItemById(restaurantId, id);
  if (!existing) {
    throw new Error("Inventory item not found");
  }

  const minStockVal = minimumStock !== undefined ? Math.max(0, Number(minimumStock)) : Number(existing.minimumStock);
  const maxStockVal = maximumStock !== undefined ? (maximumStock !== null && maximumStock !== "" ? Number(maximumStock) : null) : existing.maximumStock;
  const priceVal = purchasePrice !== undefined ? Math.max(0, Number(purchasePrice)) : Number(existing.purchasePrice);
  const statusVal = computeStatus(existing.currentStock, minStockVal);

  await db.query(
    `UPDATE inventory_items
     SET category_id = ?, item_name = ?, unit = ?, minimum_stock = ?,
         maximum_stock = ?, purchase_price = ?, supplier_id = ?, description = ?, status = ?
     WHERE id = ? AND restaurant_id = ?`,
    [
      categoryId ? Number(categoryId) : null,
      itemName ? itemName.trim() : existing.itemName,
      unit ? unit.trim().toUpperCase() : existing.unit,
      minStockVal,
      maxStockVal,
      priceVal,
      supplierId ? Number(supplierId) : null,
      description !== undefined ? (description ? description.trim() : null) : existing.description,
      statusVal,
      id,
      restaurantId,
    ]
  );

  return getItemById(restaurantId, id);
}

// --- DELETE ITEM ---
async function deleteItem(restaurantId, id) {
  const [result] = await db.query(
    `DELETE FROM inventory_items WHERE id = ? AND restaurant_id = ?`,
    [id, restaurantId]
  );
  if (result.affectedRows === 0) {
    throw new Error("Inventory item not found");
  }
  return { success: true };
}

// --- STOCK TRANSACTIONS ---
async function stockIn(restaurantId, id, { quantity, reason = "Stock Purchase", note = "" }, createdBy = "Admin") {
  const qtyVal = Number(quantity);
  if (!qtyVal || qtyVal <= 0) {
    throw new Error("Quantity must be greater than 0 for Stock In");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, current_stock AS currentStock, minimum_stock AS minimumStock FROM inventory_items WHERE id = ? AND restaurant_id = ? FOR UPDATE`,
      [id, restaurantId]
    );

    if (!rows.length) {
      throw new Error("Inventory item not found");
    }

    const item = rows[0];
    const prevStock = Number(item.currentStock);
    const newStock = Number((prevStock + qtyVal).toFixed(3));
    const newStatus = computeStatus(newStock, item.minimumStock);

    await connection.query(
      `UPDATE inventory_items SET current_stock = ?, status = ? WHERE id = ? AND restaurant_id = ?`,
      [newStock, newStatus, id, restaurantId]
    );

    await connection.query(
      `INSERT INTO inventory_transactions (restaurant_id, inventory_item_id, transaction_type, quantity, previous_stock, new_stock, reason, note, created_by)
       VALUES (?, ?, 'STOCK_IN', ?, ?, ?, ?, ?, ?)`,
      [restaurantId, id, qtyVal, prevStock, newStock, reason ? reason.trim() : "Stock Purchase", note ? note.trim() : null, createdBy]
    );

    await connection.commit();
    return getItemById(restaurantId, id);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function stockOut(restaurantId, id, { quantity, reason = "Kitchen Usage", note = "" }, createdBy = "Admin") {
  const qtyVal = Number(quantity);
  if (!qtyVal || qtyVal <= 0) {
    throw new Error("Quantity must be greater than 0 for Stock Out");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, current_stock AS currentStock, minimum_stock AS minimumStock FROM inventory_items WHERE id = ? AND restaurant_id = ? FOR UPDATE`,
      [id, restaurantId]
    );

    if (!rows.length) {
      throw new Error("Inventory item not found");
    }

    const item = rows[0];
    const prevStock = Number(item.currentStock);

    if (qtyVal > prevStock) {
      throw new Error(`Cannot stock out ${qtyVal}. Only ${prevStock} available in stock.`);
    }

    const newStock = Number((prevStock - qtyVal).toFixed(3));
    const newStatus = computeStatus(newStock, item.minimumStock);

    await connection.query(
      `UPDATE inventory_items SET current_stock = ?, status = ? WHERE id = ? AND restaurant_id = ?`,
      [newStock, newStatus, id, restaurantId]
    );

    await connection.query(
      `INSERT INTO inventory_transactions (restaurant_id, inventory_item_id, transaction_type, quantity, previous_stock, new_stock, reason, note, created_by)
       VALUES (?, ?, 'STOCK_OUT', ?, ?, ?, ?, ?, ?)`,
      [restaurantId, id, qtyVal, prevStock, newStock, reason ? reason.trim() : "Kitchen Usage", note ? note.trim() : null, createdBy]
    );

    await connection.commit();
    return getItemById(restaurantId, id);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function adjustStock(restaurantId, id, { newQuantity, reason = "Stock Adjustment", note = "" }, createdBy = "Admin") {
  const newQtyVal = Number(newQuantity);
  if (isNaN(newQtyVal) || newQtyVal < 0) {
    throw new Error("New stock quantity cannot be negative");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, current_stock AS currentStock, minimum_stock AS minimumStock FROM inventory_items WHERE id = ? AND restaurant_id = ? FOR UPDATE`,
      [id, restaurantId]
    );

    if (!rows.length) {
      throw new Error("Inventory item not found");
    }

    const item = rows[0];
    const prevStock = Number(item.currentStock);
    const diffQty = Number((newQtyVal - prevStock).toFixed(3));
    const newStatus = computeStatus(newQtyVal, item.minimumStock);

    await connection.query(
      `UPDATE inventory_items SET current_stock = ?, status = ? WHERE id = ? AND restaurant_id = ?`,
      [newQtyVal, newStatus, id, restaurantId]
    );

    await connection.query(
      `INSERT INTO inventory_transactions (restaurant_id, inventory_item_id, transaction_type, quantity, previous_stock, new_stock, reason, note, created_by)
       VALUES (?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?)`,
      [restaurantId, id, Math.abs(diffQty), prevStock, newQtyVal, reason ? reason.trim() : "Stock Adjustment", note ? note.trim() : null, createdBy]
    );

    await connection.commit();
    return getItemById(restaurantId, id);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// --- TRANSACTION HISTORY ---
async function getHistory(restaurantId, { page = 1, limit = 50, itemId = null, transactionType = "", search = "" }) {
  const offset = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const parsedLimit = Math.max(1, Number(limit));

  let whereClauses = ["t.restaurant_id = ?"];
  let params = [restaurantId];

  if (itemId && Number(itemId) > 0) {
    whereClauses.push("t.inventory_item_id = ?");
    params.push(Number(itemId));
  }

  if (transactionType && transactionType.trim()) {
    whereClauses.push("t.transaction_type = ?");
    params.push(transactionType.trim().toUpperCase());
  }

  if (search && search.trim()) {
    whereClauses.push("(i.item_name LIKE ? OR t.reason LIKE ? OR t.note LIKE ?)");
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }

  const whereSql = whereClauses.join(" AND ");

  const [countResult] = await db.query(
    `SELECT COUNT(*) AS total
     FROM inventory_transactions t
     INNER JOIN inventory_items i ON i.id = t.inventory_item_id
     WHERE ${whereSql}`,
    params
  );
  const total = countResult[0]?.total || 0;

  const [rows] = await db.query(
    `SELECT t.id, t.restaurant_id AS restaurantId, t.inventory_item_id AS itemId,
            i.item_name AS itemName, i.unit,
            t.transaction_type AS transactionType, t.quantity,
            t.previous_stock AS previousStock, t.new_stock AS newStock,
            t.reason, t.note, t.created_by AS createdBy, t.created_at AS createdAt
     FROM inventory_transactions t
     INNER JOIN inventory_items i ON i.id = t.inventory_item_id
     WHERE ${whereSql}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, parsedLimit, offset]
  );

  return {
    transactions: rows,
    pagination: {
      total,
      page: Number(page),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
  };
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listSuppliers,
  createSupplier,
  getSummary,
  listItems,
  getLowStockItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  stockIn,
  stockOut,
  adjustStock,
  getHistory,
};
