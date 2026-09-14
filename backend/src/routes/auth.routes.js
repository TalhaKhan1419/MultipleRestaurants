const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/login", authController.login);
router.get("/me", authenticate, authController.getMe);
router.post("/change-password", authenticate, authController.changePassword);

module.exports = router;
