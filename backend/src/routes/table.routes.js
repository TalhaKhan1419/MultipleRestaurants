const router = require("express").Router();
const tableController = require("../controllers/table.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireTenant } = require("../middleware/tenant.middleware");

router.use(authenticate, requireTenant);

router.get("/", tableController.listTables);
router.post("/", tableController.createTable);
router.get("/:id", tableController.getTable);
router.put("/:id", tableController.updateTable);
router.patch("/:id/status", tableController.updateTableStatus);
router.get("/:id/qrcode", tableController.getTableQRCode);
router.delete("/:id", tableController.deleteTable);

module.exports = router;
