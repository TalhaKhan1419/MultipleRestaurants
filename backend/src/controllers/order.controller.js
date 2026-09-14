const orderService = require("../services/order.service");
const {
  createOrderSchema,
  updateOrderStatusSchema,
  updateKitchenStatusSchema,
  updatePaymentStatusSchema,
} = require("../validators/order.validator");
const { success } = require("../utils/response");

async function listOrders(req, res, next) {
  try {
    const orders = await orderService.listOrders(req.tenant.restaurantId, req.query);
    return success(res, orders);
  } catch (error) {
    return next(error);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await orderService.getOrder(req.tenant.restaurantId, Number(req.params.id));
    return success(res, order);
  } catch (error) {
    return next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const data = createOrderSchema.parse(req.body);
    const result = await orderService.createOrder(req.tenant.restaurantId, data);
    return success(res, result, "Order created", 201);
  } catch (error) {
    return next(error);
  }
}

async function createPublicOrder(req, res, next) {
  try {
    const data = createOrderSchema.parse(req.body);
    const result = await orderService.createPublicOrder(data);
    return success(res, result, "Order placed successfully", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const data = updateOrderStatusSchema.parse(req.body);
    await orderService.updateOrderStatus(req.tenant.restaurantId, Number(req.params.id), data.status);
    return success(res, null, "Order status updated");
  } catch (error) {
    return next(error);
  }
}

async function updateKitchenNotes(req, res, next) {
  try {
    const kitchenNotes = typeof req.body.kitchenNotes === "string" ? req.body.kitchenNotes.trim() : "";
    if (kitchenNotes.length > 1000) {
      return res.status(400).json({ success: false, message: "Kitchen note must be 1000 characters or fewer" });
    }
    await orderService.updateKitchenNotes(req.tenant.restaurantId, Number(req.params.id), kitchenNotes);
    return success(res, null, "Kitchen note updated");
  } catch (error) {
    return next(error);
  }
}

async function updateKitchenStatus(req, res, next) {
  try {
    const data = updateKitchenStatusSchema.parse(req.body);
    await orderService.updateKitchenStatus(req.tenant.restaurantId, Number(req.params.id), data.status);
    return success(res, null, "Kitchen status updated");
  } catch (error) {
    return next(error);
  }
}

async function updatePaymentStatus(req, res, next) {
  try {
    const data = updatePaymentStatusSchema.parse(req.body);
    await orderService.updatePaymentStatus(
      req.tenant.restaurantId,
      Number(req.params.id),
      data.paymentStatus,
      data.paymentMethod
    );
    return success(res, null, "Payment status updated");
  } catch (error) {
    return next(error);
  }
}

async function requestPublicBill(req, res, next) {
  try {
    const order = await orderService.requestPublicBill(req.params.orderId, req.body.qrToken, req.body.paymentMethod);
    return success(res, order, "Bill request sent to the restaurant");
  } catch (error) {
    return next(error);
  }
}

async function confirmPublicPayment(req, res, next) {
  try {
    const order = await orderService.confirmPublicPayment(req.params.orderId, req.body.qrToken, req.body.paymentMethod);
    return success(res, order, "Payment recorded successfully");
  } catch (error) {
    return next(error);
  }
}

async function getDashboardStats(req, res, next) {
  try {
    const stats = await orderService.getDashboardStats(req.tenant.restaurantId);
    return success(res, stats);
  } catch (error) {
    return next(error);
  }
}

async function getPublicOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { qrToken } = req.query;
    const order = await orderService.getPublicOrderStatus(orderId, qrToken);
    return success(res, order);
  } catch (error) {
    return next(error);
  }
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
  getPublicOrder,
};
