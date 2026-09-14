const restaurantRepo = require("../repositories/restaurant.repository");
const adminRepo = require("../repositories/admin.repository");
const { hashPassword } = require("../utils/password");

async function getRestaurantProfile(restaurantId) {
  const restaurant = await restaurantRepo.findById(restaurantId);
  if (!restaurant) {
    const error = new Error("Restaurant not found");
    error.status = 404;
    throw error;
  }
  return restaurant;
}

async function updateRestaurantProfile(restaurantId, data) {
  const updated = await restaurantRepo.updateProfile(restaurantId, data);
  if (!updated) {
    const error = new Error("Restaurant not found or no changes made");
    error.status = 404;
    throw error;
  }
  return true;
}

async function listAllRestaurants() {
  return restaurantRepo.listAllWithDetails();
}

async function createRestaurantWithAdmin(data) {
  const existingAdmin = await adminRepo.findByEmail(data.adminEmail);
  if (existingAdmin) {
    const error = new Error("An account with this email already exists");
    error.status = 409;
    throw error;
  }

  const passwordHash = await hashPassword(data.adminPassword);
  return restaurantRepo.createRestaurantWithAdmin(
    {
      name: data.restaurantName,
      address: data.address,
    },
    {
      adminName: data.adminName,
      adminPhone: data.adminPhone,
      adminEmail: data.adminEmail,
    },
    passwordHash
  );
}

async function updateRestaurantStatus(id, isActive) {
  const updated = await restaurantRepo.updateStatus(id, isActive);
  if (!updated) {
    const error = new Error("Restaurant not found");
    error.status = 404;
    throw error;
  }
  return true;
}

async function getPlatformStats() {
  return restaurantRepo.getPlatformStats();
}

async function listAdmins() {
  return adminRepo.listAllAdmins();
}

module.exports = {
  getRestaurantProfile,
  updateRestaurantProfile,
  listAllRestaurants,
  createRestaurantWithAdmin,
  updateRestaurantStatus,
  getPlatformStats,
  listAdmins,
};
