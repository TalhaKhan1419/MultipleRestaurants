const inventoryService = require("../services/inventory.service");

async function listCategories(req, res, next) {
  try {
    const categories = await inventoryService.listCategories(req.tenant.restaurantId);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const category = await inventoryService.createCategory(req.tenant.restaurantId, req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const category = await inventoryService.updateCategory(req.tenant.restaurantId, req.params.id, req.body);
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const result = await inventoryService.deleteCategory(req.tenant.restaurantId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function listSuppliers(req, res, next) {
  try {
    const suppliers = await inventoryService.listSuppliers(req.tenant.restaurantId);
    res.json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
}

async function createSupplier(req, res, next) {
  try {
    const supplier = await inventoryService.createSupplier(req.tenant.restaurantId, req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const summary = await inventoryService.getSummary(req.tenant.restaurantId);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

async function listItems(req, res, next) {
  try {
    const result = await inventoryService.listItems(req.tenant.restaurantId, req.query);
    res.json({ success: true, data: { items: result.items, pagination: result.pagination } });
  } catch (err) {
    next(err);
  }
}

async function getLowStockItems(req, res, next) {
  try {
    const items = await inventoryService.getLowStockItems(req.tenant.restaurantId);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

async function getItemById(req, res, next) {
  try {
    const item = await inventoryService.getItemById(req.tenant.restaurantId, req.params.id);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  try {
    const item = await inventoryService.createItem(req.tenant.restaurantId, req.body, req.user);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const item = await inventoryService.updateItem(req.tenant.restaurantId, req.params.id, req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const result = await inventoryService.deleteItem(req.tenant.restaurantId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function stockIn(req, res, next) {
  try {
    const item = await inventoryService.stockIn(req.tenant.restaurantId, req.params.id, req.body, req.user);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function stockOut(req, res, next) {
  try {
    const item = await inventoryService.stockOut(req.tenant.restaurantId, req.params.id, req.body, req.user);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function adjustStock(req, res, next) {
  try {
    const item = await inventoryService.adjustStock(req.tenant.restaurantId, req.params.id, req.body, req.user);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const result = await inventoryService.getHistory(req.tenant.restaurantId, req.query);
    res.json({ success: true, data: { transactions: result.transactions, pagination: result.pagination } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listSuppliers,
  createSupplier,
  getSummary,
  listItems,
  getLowStockItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  stockIn,
  stockOut,
  adjustStock,
  getHistory,
};
