const categoryService = require("../services/category.service");
const { categorySchema } = require("../validators/category.validator");
const { success } = require("../utils/response");

async function listCategories(req, res, next) {
  try {
    const categories = await categoryService.listCategories(req.tenant.restaurantId);
    return success(res, categories);
  } catch (error) {
    return next(error);
  }
}

async function getCategory(req, res, next) {
  try {
    const category = await categoryService.getCategory(req.tenant.restaurantId, Number(req.params.id));
    return success(res, category);
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const data = categorySchema.parse(req.body);
    const id = await categoryService.createCategory(req.tenant.restaurantId, data);
    return success(res, { id }, "Category created", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const data = categorySchema.parse(req.body);
    await categoryService.updateCategory(req.tenant.restaurantId, Number(req.params.id), data);
    return success(res, null, "Category updated");
  } catch (error) {
    return next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await categoryService.deleteCategory(req.tenant.restaurantId, Number(req.params.id));
    return success(res, null, "Category deleted");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
