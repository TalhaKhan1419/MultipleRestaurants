const router = require("express").Router();
const restaurantController = require("../controllers/restaurant.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { requireTenant } = require("../middleware/tenant.middleware");
const { SUPER_ADMIN } = require("../constants/roles");

// Restaurant Owner Profile Routes
router.get("/me", authenticate, requireTenant, restaurantController.getMyRestaurant);
router.put("/me", authenticate, requireTenant, restaurantController.updateMyRestaurant);

// Super Admin Platform Management Routes
router.get("/platform-stats", authenticate, authorize(SUPER_ADMIN), restaurantController.getPlatformStats);
router.get("/admins", authenticate, authorize(SUPER_ADMIN), restaurantController.listAdmins);
router.get("/", authenticate, authorize(SUPER_ADMIN), restaurantController.listAllRestaurants);
router.post("/", authenticate, authorize(SUPER_ADMIN), restaurantController.createRestaurant);
router.patch("/:id/status", authenticate, authorize(SUPER_ADMIN), restaurantController.updateRestaurantStatus);

module.exports = router;
