const { z } = require("zod");

const booleanFromForm = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

const categoryIdsFromForm = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value.split(",").filter(Boolean); }
}, z.array(z.coerce.number().int().positive()).min(1));

const menuSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.coerce.number().nonnegative(),
  isAvailable: booleanFromForm,
  categoryIds: categoryIdsFromForm,
});

module.exports = { menuSchema };
