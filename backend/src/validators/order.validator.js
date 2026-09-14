const { z } = require("zod");

const createOrderSchema = z.object({
  tableId: z.coerce.number().int().positive().optional().nullable(),
  qrToken: z.string().optional().nullable(),
  customerName: z.string().min(1, "Customer name is required").default("Guest Customer"),
  customerPhone: z.string().min(1, "Customer phone is required").default("0000000000"),
  orderType: z.enum(["dine_in", "takeaway"]).default("dine_in"),
  discountAmount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["cash", "card", "online", "qr_pay", "unassigned"]).default("unassigned"),
  items: z.array(
    z.object({
      menuItemId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().positive().min(1),
    })
  ).min(1, "At least one item is required"),
  notes: z.string().optional().nullable(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]),
});

const updateKitchenStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]),
});

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]),
  paymentMethod: z.enum(["cash", "card", "online", "qr_pay", "unassigned"]).optional(),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  updateKitchenStatusSchema,
  updatePaymentStatusSchema,
};
