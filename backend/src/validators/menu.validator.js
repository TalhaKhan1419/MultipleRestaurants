const { z } = require("zod");

const booleanFromForm = z.preprocess((value) => {
  if (value === "true" || value === "1" || value === 1 || value === true) return true;
  if (value === "false" || value === "0" || value === 0 || value === false) return false;
  return value;
}, z.boolean().optional());

const categoryIdsFromForm = z.preprocess((value) => {
  if (value === undefined || value === null) return [];
  if (typeof value === "number") return [value];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return value;
}, z.array(z.coerce.number().int().positive()).min(1, "At least one category is required"));

const menuSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.coerce.number().nonnegative(),
  isAvailable: booleanFromForm,
  categoryIds: categoryIdsFromForm,
});

module.exports = { menuSchema };
