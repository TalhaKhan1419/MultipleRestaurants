const { z } = require("zod");

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullable(),
  displayOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

module.exports = { categorySchema };
