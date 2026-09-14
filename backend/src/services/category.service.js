const categoryRepo = require("../repositories/category.repository");

async function listCategories(restaurantId) {
  return categoryRepo.findAll(restaurantId);
}

async function getCategory(restaurantId, id) {
  const category = await categoryRepo.findById(restaurantId, id);
  if (!category) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }
  return category;
}

async function createCategory(restaurantId, data) {
  return categoryRepo.create(restaurantId, data);
}

async function updateCategory(restaurantId, id, data) {
  const updated = await categoryRepo.update(restaurantId, id, data);
  if (!updated) {
    const error = new Error("Category not found or not modified");
    error.status = 404;
    throw error;
  }
  return true;
}

async function deleteCategory(restaurantId, id) {
  const deleted = await categoryRepo.remove(restaurantId, id);
  if (!deleted) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }
  return true;
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
