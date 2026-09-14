const router = require("express").Router();
const orderController = require("../controllers/order.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireTenant } = require("../middleware/tenant.middleware");

router.use(authenticate, requireTenant);

router.get("/stats", orderController.getDashboardStats);
router.get("/", orderController.listOrders);
router.post("/", orderController.createOrder);
router.get("/:id", orderController.getOrder);
router.patch("/:id/status", orderController.updateOrderStatus);
router.patch("/:id/kitchen-note", orderController.updateKitchenNotes);
router.patch("/:id/kitchen-status", orderController.updateKitchenStatus);
router.patch("/:id/payment", orderController.updatePaymentStatus);

module.exports = router;
