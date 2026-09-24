const db = require("../config/database");

async function findAll(restaurantId, filters = {}) {
  // Auto-cancel any uncompleted KOTs/orders from previous days (older than today)
  try {
    await db.query(
      `UPDATE orders 
       SET status = 'cancelled', kitchen_status = 'cancelled' 
       WHERE restaurant_id = ? 
         AND kitchen_status IN ('confirmed', 'pending', 'preparing') 
         AND status <> 'completed'
         AND DATE(created_at) < CURRENT_DATE()`,
      [restaurantId]
    );
    await db.query(
      `UPDATE restaurant_tables rt
       SET rt.status = 'available'
       WHERE rt.restaurant_id = ?
         AND rt.status = 'occupied'
         AND NOT EXISTS (
           SELECT 1 FROM orders o 
           WHERE o.table_id = rt.id 
             AND o.restaurant_id = rt.restaurant_id 
             AND o.status NOT IN ('cancelled', 'completed')
         )`,
      [restaurantId]
    );
  } catch (err) {
    console.warn("Stale KOT auto-cleanup warning:", err.message);
  }

  let query = `
    SELECT o.id, o.restaurant_id AS restaurantId, o.table_id AS tableId,
           o.user_id AS userId, o.order_number AS orderNumber, o.status, o.kitchen_status AS kitchenStatus,
           o.order_type AS orderType, o.subtotal, o.discount_amount AS discountAmount,
           o.tax_amount AS taxAmount, o.total_amount AS totalAmount,
           o.payment_status AS paymentStatus, o.payment_method AS paymentMethod, o.bill_requested_at AS billRequestedAt,
           o.notes, o.kitchen_notes AS kitchenNotes, o.created_at AS createdAt, o.updated_at AS updatedAt,
           rt.table_number AS tableNumber,
           u.full_name AS customerName, u.phone AS customerPhone,
           r.name AS restaurantName, r.address AS restaurantAddress, r.phone AS restaurantPhone
    FROM orders o
    LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.restaurant_id = ?
  `;
  const params = [restaurantId];

  if (filters.status) {
    query += " AND o.status = ?";
    params.push(filters.status);
  }

  if (filters.paymentStatus) {
    query += " AND o.payment_status = ?";
    params.push(filters.paymentStatus);
  }

  if (filters.tableId) {
    query += " AND o.table_id = ?";
    params.push(filters.tableId);
  }

  if (filters.today === "true" || filters.today === true) {
    query += " AND DATE(o.created_at) = CURRENT_DATE()";
  }

  query += " ORDER BY o.created_at DESC";

  if (filters.limit) {
    const limit = Number(filters.limit);
    const page = Math.max(1, Number(filters.page) || 1);
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
  }

  const [orders] = await db.query(query, params);
  if (!orders.length) return [];

  const orderIds = orders.map((o) => o.id);
  const placeholders = orderIds.map(() => "?").join(", ");
  const [items] = await db.query(
    `SELECT oi.id, oi.order_id AS orderId, oi.menu_item_id AS menuItemId,
            oi.item_name AS itemName, oi.unit_price AS unitPrice,
            oi.quantity, oi.line_total AS lineTotal, oi.notes AS notes,
            GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS categoryNames
     FROM order_items oi
     LEFT JOIN menu_item_categories mic ON mic.restaurant_id = oi.restaurant_id AND mic.menu_item_id = oi.menu_item_id
     LEFT JOIN categories c ON c.id = mic.category_id AND c.restaurant_id = oi.restaurant_id
     WHERE oi.order_id IN (${placeholders})
     GROUP BY oi.id, oi.order_id, oi.menu_item_id, oi.item_name, oi.unit_price, oi.quantity, oi.line_total, oi.notes
     ORDER BY oi.id ASC`,
    orderIds
  );

  const itemsByOrder = new Map();
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return orders.map((order) => {
    let cleanPhone = order.customerPhone || "";
    if (cleanPhone.startsWith("0000000000")) {
      cleanPhone = "0000000000";
    }
    let cleanName = order.customerName || "";
    if (!cleanName || cleanName.toLowerCase() === "walk-in guest" || cleanName.toLowerCase().startsWith("table ")) {
      cleanName = "Guest";
    }
    return {
      ...order,
      customerName: cleanName,
      customerPhone: cleanPhone,
      items: itemsByOrder.get(order.id) || [],
    };
  });
}

async function findById(restaurantId, id) {
  const [orders] = await db.query(
    `SELECT o.id, o.restaurant_id AS restaurantId, o.table_id AS tableId,
            o.user_id AS userId, o.order_number AS orderNumber, o.status, o.kitchen_status AS kitchenStatus,
            o.order_type AS orderType, o.subtotal, o.discount_amount AS discountAmount,
            o.tax_amount AS taxAmount, o.total_amount AS totalAmount,
            o.payment_status AS paymentStatus, o.payment_method AS paymentMethod, o.bill_requested_at AS billRequestedAt,
            o.notes, o.kitchen_notes AS kitchenNotes, o.created_at AS createdAt, o.updated_at AS updatedAt,
            rt.table_number AS tableNumber,
            u.full_name AS customerName, u.phone AS customerPhone,
            r.name AS restaurantName, r.address AS restaurantAddress, r.phone AS restaurantPhone
     FROM orders o
     LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.id = ? AND o.restaurant_id = ?`,
    [id, restaurantId]
  );
  if (!orders.length) return null;

  const order = orders[0];
  const [items] = await db.query(
    `SELECT oi.id, oi.order_id AS orderId, oi.menu_item_id AS menuItemId,
            oi.item_name AS itemName, oi.unit_price AS unitPrice,
            oi.quantity, oi.line_total AS lineTotal, oi.notes AS notes,
            GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS categoryNames
     FROM order_items oi
     LEFT JOIN menu_item_categories mic ON mic.restaurant_id = oi.restaurant_id AND mic.menu_item_id = oi.menu_item_id
     LEFT JOIN categories c ON c.id = mic.category_id AND c.restaurant_id = oi.restaurant_id
     WHERE oi.order_id = ?
     GROUP BY oi.id, oi.order_id, oi.menu_item_id, oi.item_name, oi.unit_price, oi.quantity, oi.line_total, oi.notes
     ORDER BY oi.id ASC`,
    [id]
  );

  let cleanPhone = order.customerPhone || "";
  if (cleanPhone.startsWith("0000000000")) {
    cleanPhone = "0000000000";
  }
  let cleanName = order.customerName || "";
  if (!cleanName || cleanName.toLowerCase() === "walk-in guest" || cleanName.toLowerCase().startsWith("table ")) {
    cleanName = "Guest";
  }

  return {
    ...order,
    customerName: cleanName,
    customerPhone: cleanPhone,
    items,
  };
}

async function findOrCreateUser(connection, restaurantId, fullName, phone) {
  const cleanPhone = phone ? phone.trim() : "";
  const rawName = fullName ? fullName.trim() : "";
  const isGuest = !rawName || ["guest", "walk-in guest", "walk-in"].includes(rawName.toLowerCase());
  const finalName = isGuest ? "Guest" : rawName;

  const isDummyPhone =
    !cleanPhone ||
    ["0000000000", "9999999999", "1234567890", "0"].includes(cleanPhone) ||
    /^(.)\1+$/.test(cleanPhone);

  if (isDummyPhone) {
    const uniquePhone = `0000000000-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const [result] = await connection.query(
      "INSERT INTO users (restaurant_id, full_name, phone) VALUES (?, ?, ?)",
      [restaurantId, finalName, uniquePhone]
    );
    return result.insertId;
  }

  const [existing] = await connection.query(
    "SELECT id, full_name FROM users WHERE restaurant_id = ? AND phone = ?",
    [restaurantId, cleanPhone]
  );
  if (existing.length) {
    if (!isGuest && existing[0].full_name !== finalName) {
      await connection.query(
        "UPDATE users SET full_name = ? WHERE id = ?",
        [finalName, existing[0].id]
      );
    }
    return existing[0].id;
  }

  const [result] = await connection.query(
    "INSERT INTO users (restaurant_id, full_name, phone) VALUES (?, ?, ?)",
    [restaurantId, finalName, cleanPhone]
  );
  return result.insertId;
}

async function createOrder(restaurantId, { tableId, customerName, customerPhone, orderType = "dine_in", discountAmount = 0, paymentMethod = "unassigned", items, notes, isPublic = false }) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const userId = await findOrCreateUser(connection, restaurantId, customerName, customerPhone);

    const menuItemIds = items.map((i) => i.menuItemId);
    const placeholders = menuItemIds.map(() => "?").join(", ");
    const [menuRows] = await connection.query(
      `SELECT id, name, price, is_available FROM menu_items WHERE restaurant_id = ? AND id IN (${placeholders})`,
      [restaurantId, ...menuItemIds]
    );

    const menuMap = new Map(menuRows.map((m) => [m.id, m]));
    let subtotal = 0;
    const orderItemsToInsert = [];

    for (const item of items) {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item #${item.menuItemId} not found for this restaurant`);
      }
      const unitPrice = Number(menuItem.price);
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
      subtotal += lineTotal;
      orderItemsToInsert.push({
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        notes: item.notes || null,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const discount = Math.min(Number(discountAmount || 0), subtotal);
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxAmount = Number((taxableAmount * 0.05).toFixed(2)); // 5% Standard VAT
    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

    let existingOrderId = null;
    let existingNotes = null;

    if (tableId) {
      const [tableRows] = await connection.query(
        "SELECT id, table_number AS tableNumber, status FROM restaurant_tables WHERE id = ? AND restaurant_id = ? FOR UPDATE",
        [tableId, restaurantId]
      );
      if (!tableRows.length) {
        throw new Error("Selected dining table was not found");
      }
      if (tableRows[0].status === "unavailable") {
        throw new Error(`Table ${tableRows[0].tableNumber} is currently unavailable for ordering.`);
      }

      // Check if there is already an active (unpaid & incomplete) order for this table
      const [activeOrders] = await connection.query(
        `SELECT id, notes FROM orders
         WHERE table_id = ? AND restaurant_id = ?
           AND status NOT IN ('cancelled', 'completed')
           AND (payment_status IS NULL OR payment_status <> 'paid')
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [tableId, restaurantId]
      );

      // Validate stale table availability for public customer menu orders
      if (isPublic && (tableRows[0].status === "occupied" || activeOrders.length > 0)) {
        throw new Error(`Table ${tableRows[0].tableNumber} is currently occupied. Please select an available table.`);
      }

      if (activeOrders.length) {
        existingOrderId = activeOrders[0].id;
        existingNotes = activeOrders[0].notes;
      }
    }

    let finalOrderId;

    if (existingOrderId) {
      finalOrderId = existingOrderId;

      // Insert new items into existing order
      for (const oi of orderItemsToInsert) {
        await connection.query(
          `INSERT INTO order_items (order_id, restaurant_id, menu_item_id, item_name, unit_price, quantity, line_total, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [finalOrderId, restaurantId, oi.menuItemId, oi.itemName, oi.unitPrice, oi.quantity, oi.lineTotal, oi.notes]
        );
      }

      // Recalculate total subtotal across all items for this order
      const [sumRows] = await connection.query(
        "SELECT SUM(line_total) AS totalSubtotal FROM order_items WHERE order_id = ?",
        [finalOrderId]
      );
      const combinedSubtotal = Number(sumRows[0].totalSubtotal || 0);
      const combinedDiscount = Math.min(Number(discountAmount || 0), combinedSubtotal);
      const combinedTaxable = Math.max(0, combinedSubtotal - combinedDiscount);
      const combinedTax = Number((combinedTaxable * 0.05).toFixed(2));
      const combinedTotal = Number((combinedTaxable + combinedTax).toFixed(2));

      let mergedNotes = existingNotes;
      if (notes && notes.trim()) {
        mergedNotes = mergedNotes ? `${mergedNotes}; ${notes.trim()}` : notes.trim();
      }

      // Update existing order with recalculated totals and set kitchen_status to 'confirmed' for kitchen notification
      await connection.query(
        `UPDATE orders
         SET subtotal = ?,
             discount_amount = ?,
             tax_amount = ?,
             total_amount = ?,
             status = CASE WHEN status = 'completed' OR status = 'cancelled' THEN 'confirmed' ELSE status END,
             kitchen_status = 'confirmed',
             notes = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND restaurant_id = ?`,
        [combinedSubtotal, combinedDiscount, combinedTax, combinedTotal, mergedNotes || null, finalOrderId, restaurantId]
      );
    } else {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

      const [orderResult] = await connection.query(
        `INSERT INTO orders (restaurant_id, table_id, user_id, order_number, status, kitchen_status, order_type, subtotal, discount_amount, tax_amount, total_amount, payment_status, payment_method, notes)
         VALUES (?, ?, ?, ?, 'confirmed', 'confirmed', ?, ?, ?, ?, ?, 'unpaid', ?, ?)`,
        [restaurantId, tableId || null, userId, orderNumber, orderType, subtotal, discount, taxAmount, totalAmount, paymentMethod, notes || null]
      );

      finalOrderId = orderResult.insertId;

      for (const oi of orderItemsToInsert) {
        await connection.query(
          `INSERT INTO order_items (order_id, restaurant_id, menu_item_id, item_name, unit_price, quantity, line_total, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [finalOrderId, restaurantId, oi.menuItemId, oi.itemName, oi.unitPrice, oi.quantity, oi.lineTotal, oi.notes]
        );
      }
    }

    if (tableId) {
      await connection.query(
        "UPDATE restaurant_tables SET status = 'occupied' WHERE id = ? AND restaurant_id = ?",
        [tableId, restaurantId]
      );
    }

    await connection.commit();
    return findById(restaurantId, finalOrderId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateStatus(restaurantId, id, status) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query(
      "SELECT table_id AS tableId FROM orders WHERE id = ? AND restaurant_id = ? FOR UPDATE",
      [id, restaurantId]
    );
    if (!orders.length) {
      await connection.rollback();
      return false;
    }

    await connection.query(
      `UPDATE orders
       SET status = ?, kitchen_status = CASE
         WHEN ? = 'confirmed' THEN 'confirmed'
         WHEN ? = 'cancelled' THEN 'cancelled'
         ELSE kitchen_status
       END
       WHERE id = ? AND restaurant_id = ?`,
      [status, status, status, id, restaurantId]
    );

    const tableId = orders[0].tableId;
    if (tableId && (status === "completed" || status === "cancelled")) {
      const [remainingActive] = await connection.query(
        "SELECT COUNT(*) AS count FROM orders WHERE table_id = ? AND restaurant_id = ? AND status NOT IN ('cancelled', 'completed') AND (payment_status IS NULL OR payment_status <> 'paid')",
        [tableId, restaurantId]
      );
      if (remainingActive[0].count === 0) {
        await connection.query(
          "UPDATE restaurant_tables SET status = 'available' WHERE id = ? AND restaurant_id = ?",
          [tableId, restaurantId]
        );
      }
    }
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateKitchenStatus(restaurantId, id, status) {
  const [result] = await db.query(
    "UPDATE orders SET kitchen_status = ? WHERE id = ? AND restaurant_id = ?",
    [status, id, restaurantId]
  );
  return result.affectedRows > 0;
}

async function updateKitchenNotes(restaurantId, id, kitchenNotes) {
  const [result] = await db.query(
    "UPDATE orders SET kitchen_notes = ? WHERE id = ? AND restaurant_id = ?",
    [kitchenNotes || null, id, restaurantId]
  );
  return result.affectedRows > 0;
}

async function updatePaymentStatus(restaurantId, id, paymentStatus, paymentMethod = null) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query(
      "SELECT table_id AS tableId FROM orders WHERE id = ? AND restaurant_id = ? FOR UPDATE",
      [id, restaurantId]
    );
    if (!orders.length) {
      await connection.rollback();
      return false;
    }

    let query = "UPDATE orders SET payment_status = ?";
    const params = [paymentStatus];
    if (paymentMethod) {
      query += ", payment_method = ?";
      params.push(paymentMethod);
    }
    if (paymentStatus === "paid") query += ", status = 'completed'";
    query += " WHERE id = ? AND restaurant_id = ?";
    params.push(id, restaurantId);
    await connection.query(query, params);

    const tableId = orders[0].tableId;
    if (paymentStatus === "paid" && tableId) {
      const [remainingUnpaid] = await connection.query(
        "SELECT COUNT(*) AS count FROM orders WHERE table_id = ? AND restaurant_id = ? AND status <> 'cancelled' AND (payment_status IS NULL OR payment_status <> 'paid')",
        [tableId, restaurantId]
      );
      if (remainingUnpaid[0].count === 0) {
        await connection.query(
          "UPDATE restaurant_tables SET status = 'available' WHERE id = ? AND restaurant_id = ?",
          [tableId, restaurantId]
        );
      }
    }
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function requestBillByQr(orderId, qrToken, paymentMethod) {
  const [orders] = await db.query(
    `SELECT o.restaurant_id AS restaurantId, o.payment_status AS paymentStatus, o.status,
            o.kitchen_status AS kitchenStatus
     FROM orders o
     INNER JOIN restaurant_tables rt ON rt.id = o.table_id AND rt.restaurant_id = o.restaurant_id
     WHERE o.id = ? AND rt.qr_token = ?`,
    [orderId, qrToken]
  );

  if (!orders.length) return null;
  const order = orders[0];
  if (order.paymentStatus === "paid") {
    const error = new Error("This bill has already been paid");
    error.status = 400;
    throw error;
  }
  if (order.status === "cancelled") {
    const error = new Error("A cancelled order cannot request a bill");
    error.status = 400;
    throw error;
  }
  if (order.kitchenStatus !== "completed") {
    const error = new Error("You can request the bill once KOT status is completed");
    error.status = 400;
    throw error;
  }

  await db.query(
    "UPDATE orders SET bill_requested_at = COALESCE(bill_requested_at, CURRENT_TIMESTAMP), payment_method = ? WHERE id = ? AND restaurant_id = ?",
    [paymentMethod, orderId, order.restaurantId]
  );
  return findById(order.restaurantId, orderId);
}

async function getDashboardStats(restaurantId) {
  const [todayRows] = await db.query(
    `SELECT COUNT(*) AS todayOrders,
            COALESCE(SUM(total_amount), 0) AS todayRevenue,
            COALESCE(SUM(tax_amount), 0) AS todayTaxCollected,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS todayPaidRevenue
     FROM orders
     WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()`,
    [restaurantId]
  );

  const [stats30DaysRows] = await db.query(
    `SELECT COUNT(*) AS ordersCount30,
            COALESCE(SUM(total_amount), 0) AS revenue30
     FROM orders
     WHERE restaurant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
    [restaurantId]
  );

  const [roomService30Rows] = await db.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS roomServiceRevenue30
     FROM orders
     WHERE restaurant_id = ? AND (order_type = 'room_service' OR table_id IS NULL) AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
    [restaurantId]
  );

  const [totalStats] = await db.query(
    `SELECT COUNT(*) AS totalOrders,
            COALESCE(SUM(total_amount), 0) AS totalRevenue,
            COALESCE(SUM(tax_amount), 0) AS totalTaxCollected
     FROM orders
     WHERE restaurant_id = ?`,
    [restaurantId]
  );

  const [paymentBreakdown] = await db.query(
    `SELECT payment_method AS method, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total
     FROM orders
     WHERE restaurant_id = ? AND payment_status = 'paid'
     GROUP BY payment_method`,
    [restaurantId]
  );

  const [statusCounts] = await db.query(
    `SELECT status, COUNT(*) AS count
     FROM orders
     WHERE restaurant_id = ?
     GROUP BY status`,
    [restaurantId]
  );

  const [tableStats] = await db.query(
    `SELECT COUNT(*) AS totalTables,
            COALESCE(SUM(CASE WHEN (SELECT COUNT(*) FROM orders o WHERE o.table_id = rt.id AND o.status <> 'cancelled' AND (o.payment_status IS NULL OR o.payment_status <> 'paid')) > 0 OR rt.status = 'occupied' THEN 1 ELSE 0 END), 0) AS occupiedTables,
            COALESCE(SUM(CASE WHEN (SELECT COUNT(*) FROM orders o WHERE o.table_id = rt.id AND o.status <> 'cancelled' AND (o.payment_status IS NULL OR o.payment_status <> 'paid')) = 0 AND rt.status <> 'occupied' THEN 1 ELSE 0 END), 0) AS availableTables
     FROM restaurant_tables rt
     WHERE rt.restaurant_id = ?`,
    [restaurantId]
  );

  const [counts] = await db.query(
    `SELECT (SELECT COUNT(*) FROM menu_items WHERE restaurant_id = ?) AS totalMenuItems,
            (SELECT COUNT(*) FROM categories WHERE restaurant_id = ? AND is_active = 1) AS totalCategories`,
    [restaurantId, restaurantId]
  );

  const [recentOrders] = await db.query(
    `SELECT o.id, o.order_number AS orderNumber, o.status, o.order_type AS orderType,
            o.subtotal, o.discount_amount AS discountAmount, o.tax_amount AS taxAmount,
            o.total_amount AS totalAmount, o.payment_status AS paymentStatus, o.payment_method AS paymentMethod,
            o.created_at AS createdAt, rt.table_number AS tableNumber,
            u.full_name AS customerName
     FROM orders o
     LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.restaurant_id = ?
     ORDER BY o.created_at DESC
     LIMIT 7`,
    [restaurantId]
  );

  const [salesTrendRows] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%d %b') AS dateLabel,
            DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
            COUNT(*) AS ordersCount,
            COALESCE(SUM(total_amount), 0) AS revenue
     FROM orders
     WHERE restaurant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d'), DATE_FORMAT(created_at, '%d %b')
     ORDER BY date ASC`,
    [restaurantId]
  );

  // Build complete 30-day date map
  const salesMap = new Map();
  salesTrendRows.forEach((r) => {
    salesMap.set(r.date, {
      dateLabel: r.dateLabel,
      ordersCount: Number(r.ordersCount || 0),
      revenue: Number(r.revenue || 0),
    });
  });

  const salesTrend = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dateLabel = d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });

    if (salesMap.has(dateStr)) {
      const existing = salesMap.get(dateStr);
      salesTrend.push({
        date: dateStr,
        dateLabel: existing.dateLabel || dateLabel,
        ordersCount: existing.ordersCount,
        revenue: existing.revenue,
      });
    } else {
      salesTrend.push({
        date: dateStr,
        dateLabel,
        ordersCount: 0,
        revenue: 0,
      });
    }
  }

  const [popularItems] = await db.query(
    `SELECT oi.item_name AS name, SUM(oi.quantity) AS totalQty
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.restaurant_id = ? AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY oi.item_name
     ORDER BY totalQty DESC
     LIMIT 5`,
    [restaurantId]
  );

  const [kitchenQueue] = await db.query(
    `SELECT o.id, o.order_number AS orderNumber, o.status, o.kitchen_status AS kitchenStatus,
            o.order_type AS orderType, o.total_amount AS totalAmount, o.created_at AS createdAt,
            rt.table_number AS tableNumber,
            COALESCE((SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = o.id), 0) AS itemCount
     FROM orders o
     LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
     WHERE o.restaurant_id = ? AND o.status NOT IN ('cancelled', 'completed')
     ORDER BY o.created_at ASC
     LIMIT 10`,
    [restaurantId]
  );

  const [restaurantRows] = await db.query(
    `SELECT id, name, slug FROM restaurants WHERE id = ?`,
    [restaurantId]
  );

  const [roomStats] = await db.query(
    `SELECT COUNT(*) AS totalRooms,
            COALESCE(SUM(CASE WHEN b.id IS NOT NULL OR r.status = 'occupied' THEN 1 ELSE 0 END), 0) AS occupiedRooms,
            COALESCE(SUM(CASE WHEN b.id IS NULL AND (r.status IS NULL OR r.status = 'available') THEN 1 ELSE 0 END), 0) AS availableRooms
     FROM guest_rooms r
     LEFT JOIN room_bookings b ON r.id = b.room_id AND b.status = 'active'
     WHERE r.restaurant_id = ?`,
    [restaurantId]
  );

  return {
    today: todayRows[0] || { todayOrders: 0, todayRevenue: 0, todayPaidRevenue: 0, todayTaxCollected: 0 },
    stats30Days: stats30DaysRows[0] || { ordersCount30: 0, revenue30: 0 },
    roomService30: roomService30Rows[0] || { roomServiceRevenue30: 0 },
    overall: totalStats[0] || { totalOrders: 0, totalRevenue: 0, totalTaxCollected: 0 },
    paymentBreakdown,
    statusBreakdown: statusCounts,
    tables: tableStats[0] || { totalTables: 0, occupiedTables: 0, availableTables: 0 },
    rooms: roomStats[0] || { totalRooms: 0, occupiedRooms: 0, availableRooms: 0 },
    menu: counts[0] || { totalMenuItems: 0, totalCategories: 0 },
    recentOrders,
    salesTrend,
    popularItems,
    kitchenQueue,
    restaurant: restaurantRows[0] || { name: "UP 65 restaurant & Buffet", slug: "up65" },
  };
}

module.exports = {
  findAll,
  findById,
  createOrder,
  updateStatus,
  updateKitchenStatus,
  updateKitchenNotes,
  updatePaymentStatus,
  requestBillByQr,
  getDashboardStats,
};
