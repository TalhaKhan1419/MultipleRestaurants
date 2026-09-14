const router = require("express").Router();
const controller = require("../controllers/menu.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { requireTenant } = require("../middleware/tenant.middleware");
const { upload } = require("../middleware/upload.middleware");

router.use(authenticate, authorize("admin", "super_admin"), requireTenant);
router.get("/", controller.listMenu);
router.post("/", upload.single("image"), controller.createMenuItem);
router.get("/:id", controller.getMenuItem);
router.put("/:id", upload.single("image"), controller.updateMenuItem);
router.delete("/:id", controller.deleteMenuItem);

module.exports = router;
