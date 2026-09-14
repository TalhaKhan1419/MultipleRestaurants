const router = require("express").Router();
const { getPublicMenu } = require("../controllers/menu.controller");
const { createPublicOrder, getPublicOrder, requestPublicBill, confirmPublicPayment } = require("../controllers/order.controller");

router.get("/menu/:qrToken", getPublicMenu);
router.post("/orders", createPublicOrder);
router.get("/orders/:orderId", getPublicOrder);
router.post("/orders/:orderId/request-bill", requestPublicBill);
router.post("/orders/:orderId/payment", confirmPublicPayment);

module.exports = router;
