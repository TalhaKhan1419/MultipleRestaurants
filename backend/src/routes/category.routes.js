const router = require("express").Router();
const categoryController = require("../controllers/category.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireTenant } = require("../middleware/tenant.middleware");

router.use(authenticate, requireTenant);

router.get("/", categoryController.listCategories);
router.post("/", categoryController.createCategory);
router.get("/:id", categoryController.getCategory);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
