const db = require("../config/database");

function formatLocalDatetime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatLocalDateOnly(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Returns formatted start and end DATETIME strings for given filter/dates
 */
function getDateBoundaries(filter = "this_month", customStart = null, customEnd = null) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (filter) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;
    case "this_year":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
      break;
    case "custom":
      if (customStart) {
        const [y, m, d] = customStart.split("-").map(Number);
        start = new Date(y, m - 1, d, 0, 0, 0, 0);
      } else {
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        const [y, m, d] = customEnd.split("-").map(Number);
        end = new Date(y, m - 1, d, 23, 59, 59, 999);
      } else {
        end = new Date();
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
  }

  return {
    startStr: formatLocalDatetime(start),
    endStr: formatLocalDatetime(end),
    startDay: formatLocalDateOnly(start),
    endDay: formatLocalDateOnly(end),
    startDateObj: start,
    endDateObj: end,
    filter,
  };
}

async function getReportDashboardData(restaurantId, filter = "this_month", customStart = null, customEnd = null) {
  const { startStr, endStr, startDay, endDay, startDateObj, endDateObj } = getDateBoundaries(filter, customStart, customEnd);

  // 1. Restaurant Orders Metrics
  const [orderRows] = await db.query(
    `SELECT
       COUNT(*) AS totalOrders,
       COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) AS restaurantSales,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completedOrders,
       COALESCE(SUM(CASE WHEN status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 ELSE 0 END), 0) AS pendingOrders,
       COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelledOrders
     FROM orders
     WHERE restaurant_id = ? AND created_at BETWEEN ? AND ?`,
    [restaurantId, startStr, endStr]
  );
  const restOrderStats = orderRows[0] || {};

  // 2. Hotel / Room Revenue & Bookings Metrics
  const [hotelRows] = await db.query(
    `SELECT
       COUNT(*) AS totalBookings,
       COALESCE(SUM(CASE WHEN rb.status != 'cancelled' THEN COALESCE(gr.price, 0) ELSE 0 END), 0) AS hotelRevenue,
       COALESCE(SUM(CASE WHEN rb.status = 'active' THEN 1 ELSE 0 END), 0) AS activeBookings,
       COALESCE(SUM(CASE WHEN rb.status = 'completed' THEN 1 ELSE 0 END), 0) AS completedBookings,
       COALESCE(SUM(CASE WHEN rb.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelledBookings
     FROM room_bookings rb
     LEFT JOIN guest_rooms gr ON gr.id = rb.room_id
     WHERE rb.restaurant_id = ? AND rb.created_at BETWEEN ? AND ?`,
    [restaurantId, startStr, endStr]
  );
  const hotelStats = hotelRows[0] || {};

  // 3. Hotel Room Check-Ins / Check-Outs & Current Snapshot
  const [checkRows] = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN check_in_at BETWEEN ? AND ? THEN 1 ELSE 0 END), 0) AS checkIns,
       COALESCE(SUM(CASE WHEN status = 'completed' AND check_out_at BETWEEN ? AND ? THEN 1 ELSE 0 END), 0) AS checkOuts
     FROM room_bookings
     WHERE restaurant_id = ?`,
    [startStr, endStr, startStr, endStr, restaurantId]
  );
  const checkStats = checkRows[0] || {};

  const [roomSnapshotRows] = await db.query(
    `SELECT
       COUNT(*) AS totalRooms,
       COALESCE(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0) AS occupiedRooms,
       COALESCE(SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END), 0) AS availableRooms
     FROM guest_rooms
     WHERE restaurant_id = ?`,
    [restaurantId]
  );
  const roomSnapshot = roomSnapshotRows[0] || { totalRooms: 0, occupiedRooms: 0, availableRooms: 0 };

  // 4. Expenses (Direct Expenses + Inventory Purchases)
  const [expenseRows] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS directExpenses
     FROM expenses
     WHERE restaurant_id = ? AND expense_date BETWEEN ? AND ?`,
    [restaurantId, startDay, endDay]
  );
  const directExpenses = Number(expenseRows[0]?.directExpenses || 0);

  const [invCostRows] = await db.query(
    `SELECT COALESCE(SUM(it.quantity * COALESCE(ii.purchase_price, 0)), 0) AS inventoryCost
     FROM inventory_transactions it
     LEFT JOIN inventory_items ii ON ii.id = it.inventory_item_id
     WHERE it.restaurant_id = ? AND it.transaction_type = 'STOCK_IN' AND it.created_at BETWEEN ? AND ?`,
    [restaurantId, startStr, endStr]
  );
  const inventoryCost = Number(invCostRows[0]?.inventoryCost || 0);

  const totalExpenses = Number((directExpenses + inventoryCost).toFixed(2));

  // 5. Total Combined Metrics
  const restaurantSales = Number(restOrderStats.restaurantSales || 0);
  const hotelRevenue = Number(hotelStats.hotelRevenue || 0);
  const totalRevenue = Number((restaurantSales + hotelRevenue).toFixed(2));
  const totalOrdersCount = Number(restOrderStats.totalOrders || 0) + Number(hotelStats.totalBookings || 0);
  const netProfit = Number((totalRevenue - totalExpenses).toFixed(2));

  // 6. Payment Methods Breakdown (Orders + Bookings)
  const [paymentRows] = await db.query(
    `SELECT LOWER(COALESCE(payment_method, 'cash')) AS method,
            COUNT(*) AS count,
            COALESCE(SUM(total_amount), 0) AS amount
     FROM orders
     WHERE restaurant_id = ? AND status != 'cancelled' AND created_at BETWEEN ? AND ?
     GROUP BY LOWER(COALESCE(payment_method, 'cash'))`,
    [restaurantId, startStr, endStr]
  );

  const methodMap = { cash: { amount: 0, count: 0 }, upi: { amount: 0, count: 0 }, card: { amount: 0, count: 0 }, online: { amount: 0, count: 0 } };
  paymentRows.forEach((r) => {
    let m = (r.method || "cash").toLowerCase();
    if (m.includes("upi") || m.includes("gpay") || m.includes("paytm") || m.includes("phonepe")) m = "upi";
    else if (m.includes("card") || m.includes("credit") || m.includes("debit")) m = "card";
    else if (m.includes("cash")) m = "cash";
    else m = "online";

    methodMap[m].amount += Number(r.amount || 0);
    methodMap[m].count += Number(r.count || 0);
  });

  const paymentBreakdown = Object.keys(methodMap).map((key) => {
    const amt = Number(methodMap[key].amount.toFixed(2));
    const pct = totalRevenue > 0 ? Math.round((amt / totalRevenue) * 100) : 0;
    return {
      method: key.toUpperCase(),
      amount: amt,
      count: methodMap[key].count,
      percentage: pct,
    };
  });

  // 7. Top Selling Menu Items
  const [topItemsRows] = await db.query(
    `SELECT oi.item_name AS name,
            COALESCE(SUM(oi.quantity), 0) AS totalQty,
            COALESCE(SUM(oi.line_total), 0) AS totalRevenue
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE o.restaurant_id = ? AND o.status != 'cancelled' AND o.created_at BETWEEN ? AND ?
     GROUP BY oi.item_name
     ORDER BY totalQty DESC, totalRevenue DESC
     LIMIT 10`,
    [restaurantId, startStr, endStr]
  );
  const topSellingItems = topItemsRows.map((item) => ({
    name: item.name,
    totalQty: Number(item.totalQty || 0),
    totalRevenue: Number(item.totalRevenue || 0),
  }));

  // 8. Inventory Alerts
  const [lowStockRows] = await db.query(
    `SELECT id, item_name AS itemName, unit, current_stock AS currentStock, minimum_stock AS minimumStock, status
     FROM inventory_items
     WHERE restaurant_id = ? AND (status IN ('low_stock', 'out_of_stock') OR current_stock <= minimum_stock)
     ORDER BY current_stock ASC
     LIMIT 10`,
    [restaurantId]
  );
  const inventoryAlerts = lowStockRows.map((item) => ({
    id: item.id,
    itemName: item.itemName,
    unit: item.unit,
    currentStock: Number(item.currentStock || 0),
    minimumStock: Number(item.minimumStock || 0),
    status: item.currentStock <= 0 ? "out_of_stock" : "low_stock",
  }));

  // 9. Revenue Trend Timeline Data (Daily or Monthly)
  const isLongRange = filter === "this_year" || (startDateObj && endDateObj && (endDateObj - startDateObj) > 31 * 24 * 60 * 60 * 1000);
  const dateFormatSql = isLongRange ? "%b %Y" : "%d %b";
  const groupBySql = isLongRange ? "%Y-%m" : "%Y-%m-%d";

  const [orderTrendRows] = await db.query(
    `SELECT DATE_FORMAT(created_at, '${dateFormatSql}') AS dateLabel,
            DATE_FORMAT(created_at, '${groupBySql}') AS groupKey,
            COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) AS restaurantRevenue
     FROM orders
     WHERE restaurant_id = ? AND created_at BETWEEN ? AND ?
     GROUP BY groupKey, dateLabel
     ORDER BY groupKey ASC`,
    [restaurantId, startStr, endStr]
  );

  const [hotelTrendRows] = await db.query(
    `SELECT DATE_FORMAT(rb.created_at, '${dateFormatSql}') AS dateLabel,
            DATE_FORMAT(rb.created_at, '${groupBySql}') AS groupKey,
            COALESCE(SUM(CASE WHEN rb.status != 'cancelled' THEN COALESCE(gr.price, 0) ELSE 0 END), 0) AS hotelRevenue
     FROM room_bookings rb
     LEFT JOIN guest_rooms gr ON gr.id = rb.room_id
     WHERE rb.restaurant_id = ? AND rb.created_at BETWEEN ? AND ?
     GROUP BY groupKey, dateLabel
     ORDER BY groupKey ASC`,
    [restaurantId, startStr, endStr]
  );

  const trendMap = new Map();
  orderTrendRows.forEach((r) => {
    trendMap.set(r.groupKey, {
      dateLabel: r.dateLabel,
      groupKey: r.groupKey,
      restaurantRevenue: Number(r.restaurantRevenue || 0),
      hotelRevenue: 0,
      totalRevenue: Number(r.restaurantRevenue || 0),
    });
  });

  hotelTrendRows.forEach((r) => {
    const existing = trendMap.get(r.groupKey) || {
      dateLabel: r.dateLabel,
      groupKey: r.groupKey,
      restaurantRevenue: 0,
      hotelRevenue: 0,
      totalRevenue: 0,
    };
    existing.hotelRevenue += Number(r.hotelRevenue || 0);
    existing.totalRevenue = existing.restaurantRevenue + existing.hotelRevenue;
    trendMap.set(r.groupKey, existing);
  });

  const revenueTrend = Array.from(trendMap.values()).sort((a, b) => a.groupKey.localeCompare(b.groupKey));

  // 10. Recent Transactions / Orders
  const [recentRows] = await db.query(
    `SELECT o.id, o.order_number AS orderNumber, 'restaurant' AS type,
            o.total_amount AS amount, o.payment_method AS paymentMethod,
            o.status, o.created_at AS date, rt.table_number AS location,
            u.full_name AS customerName, u.phone AS customerPhone
     FROM orders o
     LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.restaurant_id = ? AND o.created_at BETWEEN ? AND ?
     ORDER BY o.created_at DESC
     LIMIT 10`,
    [restaurantId, startStr, endStr]
  );

  const recentTransactions = recentRows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    customerName: r.customerName || null,
    customerPhone: r.customerPhone || null,
    title: r.customerName ? `${r.customerName} (#${r.orderNumber})` : `Order #${r.orderNumber}`,
    type: r.type,
    amount: Number(r.amount || 0),
    paymentMethod: r.paymentMethod || "Cash",
    status: r.status,
    date: r.date,
    location: r.location ? `Table ${r.location}` : "Takeaway",
  }));

  return {
    dateFilter: filter,
    startDate: startDay,
    endDate: endDay,
    summary: {
      totalRevenue,
      totalOrders: totalOrdersCount,
      restaurantSales,
      hotelRevenue,
      totalExpenses,
      netProfit,
    },
    revenueComparison: {
      restaurantRevenue: restaurantSales,
      restaurantPercentage: totalRevenue > 0 ? Math.round((restaurantSales / totalRevenue) * 100) : 0,
      hotelRevenue,
      hotelPercentage: totalRevenue > 0 ? Math.round((hotelRevenue / totalRevenue) * 100) : 0,
    },
    ordersOverview: {
      totalOrders: Number(restOrderStats.totalOrders || 0),
      completedOrders: Number(restOrderStats.completedOrders || 0),
      pendingOrders: Number(restOrderStats.pendingOrders || 0),
      cancelledOrders: Number(restOrderStats.cancelledOrders || 0),
    },
    paymentBreakdown,
    topSellingItems,
    hotelSummary: {
      totalRooms: Number(roomSnapshot.totalRooms || 0),
      occupiedRooms: Number(roomSnapshot.occupiedRooms || 0),
      availableRooms: Number(roomSnapshot.availableRooms || 0),
      checkIns: Number(checkStats.checkIns || 0),
      checkOuts: Number(checkStats.checkOuts || 0),
      occupancyPercentage: Number(roomSnapshot.totalRooms) > 0 ? Math.round((Number(roomSnapshot.occupiedRooms) / Number(roomSnapshot.totalRooms)) * 100) : 0,
    },
    inventoryAlerts,
    revenueTrend,
    recentTransactions,
  };
}

async function listExpenses(restaurantId, startDay, endDay) {
  const [rows] = await db.query(
    `SELECT id, title, amount, category, expense_date AS expenseDate, notes, created_at AS createdAt
     FROM expenses
     WHERE restaurant_id = ? AND expense_date BETWEEN ? AND ?
     ORDER BY expense_date DESC, id DESC`,
    [restaurantId, startDay || "2000-01-01", endDay || "2099-12-31"]
  );
  return rows.map((r) => ({ ...r, amount: Number(r.amount || 0) }));
}

async function createExpense(restaurantId, { title, amount, category = "General", expenseDate, notes }) {
  const dateToUse = expenseDate || new Date().toISOString().slice(0, 10);
  const [result] = await db.query(
    `INSERT INTO expenses (restaurant_id, title, amount, category, expense_date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [restaurantId, title, Number(amount || 0), category, dateToUse, notes || null]
  );
  return result.insertId;
}

async function deleteExpense(restaurantId, id) {
  const [result] = await db.query(
    `DELETE FROM expenses WHERE id = ? AND restaurant_id = ?`,
    [id, restaurantId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getReportDashboardData,
  listExpenses,
  createExpense,
  deleteExpense,
};
