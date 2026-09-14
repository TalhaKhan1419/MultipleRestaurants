const restaurantService = require("../services/restaurant.service");
const {
  restaurantProfileSchema,
  createRestaurantWithAdminSchema,
  updateRestaurantStatusSchema,
} = require("../validators/restaurant.validator");
const { success } = require("../utils/response");

async function getMyRestaurant(req, res, next) {
  try {
    const restaurant = await restaurantService.getRestaurantProfile(req.tenant.restaurantId);
    return success(res, restaurant);
  } catch (error) {
    return next(error);
  }
}

async function updateMyRestaurant(req, res, next) {
  try {
    const data = restaurantProfileSchema.parse(req.body);
    await restaurantService.updateRestaurantProfile(req.tenant.restaurantId, data);
    return success(res, null, "Restaurant profile updated");
  } catch (error) {
    return next(error);
  }
}

async function listAllRestaurants(req, res, next) {
  try {
    const restaurants = await restaurantService.listAllRestaurants();
    return success(res, restaurants);
  } catch (error) {
    return next(error);
  }
}

async function createRestaurant(req, res, next) {
  try {
    const data = createRestaurantWithAdminSchema.parse(req.body);
    const result = await restaurantService.createRestaurantWithAdmin(data);
    return success(res, result, "Restaurant and Owner account created", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateRestaurantStatus(req, res, next) {
  try {
    const data = updateRestaurantStatusSchema.parse(req.body);
    await restaurantService.updateRestaurantStatus(Number(req.params.id), data.isActive);
    return success(res, null, `Restaurant status updated`);
  } catch (error) {
    return next(error);
  }
}

async function getPlatformStats(req, res, next) {
  try {
    const stats = await restaurantService.getPlatformStats();
    return success(res, stats);
  } catch (error) {
    return next(error);
  }
}

async function listAdmins(req, res, next) {
  try {
    const admins = await restaurantService.listAdmins();
    return success(res, admins);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyRestaurant,
  updateMyRestaurant,
  listAllRestaurants,
  createRestaurant,
  updateRestaurantStatus,
  getPlatformStats,
  listAdmins,
};
