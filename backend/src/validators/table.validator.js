const { z } = require("zod");

const tableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.coerce.number().int().positive("Capacity must be at least 1"),
  status: z.enum(["available", "occupied", "reserved", "unavailable"]).optional().default("available"),
});

const tableStatusSchema = z.object({
  status: z.enum(["available", "occupied", "reserved", "unavailable"]),
});

module.exports = { tableSchema, tableStatusSchema };
