const { z } = require("zod");

const restaurantProfileSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

const createRestaurantWithAdminSchema = z.object({
  restaurantName: z.string().min(1, "Restaurant name is required"),
  address: z.string().min(1, "Restaurant address is required"),
  adminName: z.string().min(1, "Admin full name is required"),
  adminPhone: z.string().min(1, "Admin phone is required"),
  adminEmail: z.string().email("Valid admin email is required"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const updateRestaurantStatusSchema = z.object({
  isActive: z.boolean(),
});

module.exports = {
  restaurantProfileSchema,
  createRestaurantWithAdminSchema,
  updateRestaurantStatusSchema,
};
