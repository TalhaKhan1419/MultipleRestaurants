const inventoryRepo = require("../repositories/inventory.repository");

async function listCategories(restaurantId) {
  return inventoryRepo.listCategories(restaurantId);
}

async function createCategory(restaurantId, categoryData) {
  if (!categoryData.name || !categoryData.name.trim()) {
    throw new Error("Category name is required");
  }
  return inventoryRepo.createCategory(restaurantId, categoryData);
}

async function updateCategory(restaurantId, id, categoryData) {
  if (!categoryData.name || !categoryData.name.trim()) {
    throw new Error("Category name is required");
  }
  return inventoryRepo.updateCategory(restaurantId, id, categoryData);
}

async function deleteCategory(restaurantId, id) {
  return inventoryRepo.deleteCategory(restaurantId, id);
}

async function listSuppliers(restaurantId) {
  return inventoryRepo.listSuppliers(restaurantId);
}

async function createSupplier(restaurantId, supplierData) {
  if (!supplierData.name || !supplierData.name.trim()) {
    throw new Error("Supplier name is required");
  }
  return inventoryRepo.createSupplier(restaurantId, supplierData);
}

async function getSummary(restaurantId) {
  return inventoryRepo.getSummary(restaurantId);
}

async function listItems(restaurantId, filters) {
  return inventoryRepo.listItems(restaurantId, filters);
}

async function getLowStockItems(restaurantId) {
  return inventoryRepo.getLowStockItems(restaurantId);
}

async function getItemById(restaurantId, id) {
  const item = await inventoryRepo.getItemById(restaurantId, id);
  if (!item) {
    throw new Error("Inventory item not found");
  }
  return item;
}

async function createItem(restaurantId, itemData, user) {
  if (!itemData.itemName || !itemData.itemName.trim()) {
    throw new Error("Item name is required");
  }
  if (!itemData.unit || !itemData.unit.trim()) {
    throw new Error("Unit is required");
  }
  const createdBy = user?.name || user?.fullName || user?.role || "Admin";
  return inventoryRepo.createItem(restaurantId, itemData, createdBy);
}

async function updateItem(restaurantId, id, itemData) {
  return inventoryRepo.updateItem(restaurantId, id, itemData);
}

async function deleteItem(restaurantId, id) {
  return inventoryRepo.deleteItem(restaurantId, id);
}

async function stockIn(restaurantId, id, payload, user) {
  const createdBy = user?.name || user?.fullName || user?.role || "Admin";
  return inventoryRepo.stockIn(restaurantId, id, payload, createdBy);
}

async function stockOut(restaurantId, id, payload, user) {
  const createdBy = user?.name || user?.fullName || user?.role || "Admin";
  return inventoryRepo.stockOut(restaurantId, id, payload, createdBy);
}

async function adjustStock(restaurantId, id, payload, user) {
  const createdBy = user?.name || user?.fullName || user?.role || "Admin";
  return inventoryRepo.adjustStock(restaurantId, id, payload, createdBy);
}

async function getHistory(restaurantId, filters) {
  return inventoryRepo.getHistory(restaurantId, filters);
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
