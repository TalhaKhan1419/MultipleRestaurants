const router = require("express").Router();
const inventoryController = require("../controllers/inventory.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireTenant } = require("../middleware/tenant.middleware");

router.use(authenticate, requireTenant);

// Metrics & Analytics
router.get("/summary", inventoryController.getSummary);
router.get("/low-stock", inventoryController.getLowStockItems);
router.get("/history", inventoryController.getHistory);

// Categories
router.get("/categories", inventoryController.listCategories);
router.post("/categories", inventoryController.createCategory);
router.put("/categories/:id", inventoryController.updateCategory);
router.delete("/categories/:id", inventoryController.deleteCategory);

// Suppliers
router.get("/suppliers", inventoryController.listSuppliers);
router.post("/suppliers", inventoryController.createSupplier);

// Inventory Items
router.get("/", inventoryController.listItems);
router.post("/", inventoryController.createItem);

router.get("/:id", inventoryController.getItemById);
router.put("/:id", inventoryController.updateItem);
router.delete("/:id", inventoryController.deleteItem);

// Stock Actions
router.post("/:id/stock-in", inventoryController.stockIn);
router.post("/:id/stock-out", inventoryController.stockOut);
router.post("/:id/adjust", inventoryController.adjustStock);
router.get("/:id/history", (req, res, next) => {
  req.query.itemId = req.params.id;
  return inventoryController.getHistory(req, res, next);
});

module.exports = router;
