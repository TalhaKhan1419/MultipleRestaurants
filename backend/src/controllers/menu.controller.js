const menuService = require("../services/menu.service");
const { menuSchema } = require("../validators/menu.validator");
const { success } = require("../utils/response");

async function listMenu(req, res, next) {
  try {
    return success(res, await menuService.listMenu(req.tenant.restaurantId));
  } catch (error) { return next(error); }
}

async function createMenuItem(req, res, next) {
  try {
    const data = menuSchema.parse(req.body);
    const id = await menuService.createMenuItem(req.tenant.restaurantId, data, req.file);
    return success(res, { id }, "Menu item created", 201);
  } catch (error) { return next(error); }
}

async function updateMenuItem(req, res, next) {
  try {
    const data = menuSchema.parse(req.body);
    await menuService.updateMenuItem(req.tenant.restaurantId, Number(req.params.id), data, req.file);
    return success(res, null, "Menu item updated");
  } catch (error) { return next(error); }
}

async function getMenuItem(req, res, next) {
  try {
    const item = await menuService.getMenuItem(req.tenant.restaurantId, Number(req.params.id));
    if (!item) return res.status(404).json({ success: false, message: "Menu item not found" });
    return success(res, item);
  } catch (error) { return next(error); }
}

async function deleteMenuItem(req, res, next) {
  try {
    await menuService.deleteMenuItem(req.tenant.restaurantId, Number(req.params.id));
    return success(res, null, "Menu item deleted");
  } catch (error) { return next(error); }
}

async function getPublicMenu(req, res, next) {
  try {
    const menu = await menuService.getPublicMenu(req.params.qrToken);
    if (!menu) return res.status(404).json({ success: false, message: "Menu not found" });
    return success(res, menu);
  } catch (error) { return next(error); }
}

async function getPublicAvailableTables(req, res, next) {
  try {
    const tables = await menuService.getPublicAvailableTables(req.params.qrToken);
    return success(res, tables);
  } catch (error) { return next(error); }
}

module.exports = { listMenu, createMenuItem, updateMenuItem, getMenuItem, deleteMenuItem, getPublicMenu, getPublicAvailableTables };

