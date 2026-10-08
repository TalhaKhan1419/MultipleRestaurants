const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/login", authController.login);
router.get("/me", authenticate, authController.getMe);
router.post("/change-password", authenticate, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-reset-otp", authController.verifyResetOtp);
router.post("/reset-password", authController.resetPassword);
router.post("/resend-reset-otp", authController.resendResetOtp);

module.exports = router;

