const orderRepo = require("../repositories/order.repository");
const db = require("../config/database");

async function listOrders(restaurantId, filters) {
  return orderRepo.findAll(restaurantId, filters);
}

async function getOrder(restaurantId, id) {
  const order = await orderRepo.findById(restaurantId, id);
  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }
  return order;
}

async function createOrder(restaurantId, data) {
  return orderRepo.createOrder(restaurantId, data);
}

async function createPublicOrder(data) {
  if (!data.qrToken) {
    const error = new Error("QR token is required to place an order");
    error.status = 400;
    throw error;
  }

  let tableId = data.tableId || null;
  let restaurantId = null;

  if (data.qrToken && data.qrToken !== "default" && data.qrToken !== "menu") {
    const [tables] = await db.query(
      "SELECT id, restaurant_id AS restaurantId FROM restaurant_tables WHERE qr_token = ?",
      [data.qrToken]
    );
    if (tables.length) {
      restaurantId = tables[0].restaurantId;
      if (!tableId) tableId = tables[0].id;
    }
  }

  if (!restaurantId && data.tableId) {
    const [tables] = await db.query(
      "SELECT id, restaurant_id AS restaurantId FROM restaurant_tables WHERE id = ?",
      [data.tableId]
    );
    if (tables.length) {
      restaurantId = tables[0].restaurantId;
    }
  }

  if (!restaurantId && data.roomId) {
    const [rooms] = await db.query(
      "SELECT id, restaurant_id AS restaurantId FROM guest_rooms WHERE id = ?",
      [data.roomId]
    );
    if (rooms.length) {
      restaurantId = rooms[0].restaurantId;
    }
  }

  if (!restaurantId) {
    const [tables] = await db.query("SELECT restaurant_id AS restaurantId FROM restaurant_tables LIMIT 1");
    if (tables.length) {
      restaurantId = tables[0].restaurantId;
    }
  }

  if (!restaurantId) {
    const error = new Error("Invalid QR code or dining token");
    error.status = 404;
    throw error;
  }

  return orderRepo.createOrder(restaurantId, {
    ...data,
    tableId: tableId,
  });
}

async function updateOrderStatus(restaurantId, id, status) {
  const updated = await orderRepo.updateStatus(restaurantId, id, status);
  if (!updated) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }
  return true;
}

async function updateKitchenNotes(restaurantId, id, kitchenNotes) {
  const updated = await orderRepo.updateKitchenNotes(restaurantId, id, kitchenNotes);
  if (!updated) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }
  return true;
}

async function updateKitchenStatus(restaurantId, id, status) {
  const updated = await orderRepo.updateKitchenStatus(restaurantId, id, status);
  if (!updated) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }
  return true;
}

async function updatePaymentStatus(restaurantId, id, paymentStatus, paymentMethod = null) {
  if (paymentStatus === "paid") {
    const order = await getOrder(restaurantId, id);
    if (order.kitchenStatus !== "completed") {
      const error = new Error("KOT status must be marked as 'completed' before payment can be settled");
      error.status = 400;
      throw error;
    }
  }
  const updated = await orderRepo.updatePaymentStatus(restaurantId, id, paymentStatus, paymentMethod);
  if (!updated) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }
  return true;
}

async function requestPublicBill(orderId, qrToken, paymentMethod = "cash") {
  if (!orderId || !qrToken) {
    const error = new Error("orderId and qrToken are required");
    error.status = 400;
    throw error;
  }
  const supportedPaymentMethods = ["cash", "card", "online", "qr_pay"];
  if (!supportedPaymentMethods.includes(paymentMethod)) {
    const error = new Error("Please select a valid payment method");
    error.status = 400;
    throw error;
  }
  const order = await orderRepo.requestBillByQr(Number(orderId), qrToken, paymentMethod);
  if (!order) {
    const error = new Error("Order not found for this table");
    error.status = 404;
    throw error;
  }
  return order;
}

async function confirmPublicPayment(orderId, qrToken, paymentMethod = "cash") {
  const order = await requestPublicBill(orderId, qrToken, paymentMethod);
  await updatePaymentStatus(order.restaurantId, Number(orderId), "paid", paymentMethod);
  return getOrder(order.restaurantId, Number(orderId));
}

async function getDashboardStats(restaurantId) {
  return orderRepo.getDashboardStats(restaurantId);
}

async function getPublicOrderStatus(orderId, qrToken) {
  if (!orderId || !qrToken) {
    const error = new Error("orderId and qrToken are required");
    error.status = 400;
    throw error;
  }

  // Resolve restaurant from QR token
  const [tables] = await db.query(
    "SELECT id, restaurant_id AS restaurantId FROM restaurant_tables WHERE qr_token = ?",
    [qrToken]
  );
  if (!tables.length) {
    const error = new Error("Invalid QR token");
    error.status = 404;
    throw error;
  }

  const restaurantId = tables[0].restaurantId;
  const order = await orderRepo.findById(restaurantId, Number(orderId));
  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }
  const customerStatus = order.status === "cancelled" ? "cancelled" : order.status === "pending" ? "pending" : order.kitchenStatus;
  return { ...order, status: customerStatus };
}

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  createPublicOrder,
  updateOrderStatus,
  updateKitchenNotes,
  updateKitchenStatus,
  updatePaymentStatus,
  requestPublicBill,
  confirmPublicPayment,
  getDashboardStats,
  getPublicOrderStatus,
};
