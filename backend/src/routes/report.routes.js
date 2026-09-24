const router = require("express").Router();
const reportController = require("../controllers/report.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireTenant } = require("../middleware/tenant.middleware");

router.use(authenticate, requireTenant);

router.get("/dashboard", reportController.getReportDashboard);
router.get("/expenses", reportController.listExpenses);
router.post("/expenses", reportController.createExpense);
router.delete("/expenses/:id", reportController.deleteExpense);

module.exports = router;
