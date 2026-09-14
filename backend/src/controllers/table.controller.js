const tableService = require("../services/table.service");
const { tableSchema, tableStatusSchema } = require("../validators/table.validator");
const { success } = require("../utils/response");

async function listTables(req, res, next) {
  try {
    const tables = await tableService.listTables(req.tenant.restaurantId);
    return success(res, tables);
  } catch (error) {
    return next(error);
  }
}

async function getTable(req, res, next) {
  try {
    const table = await tableService.getTable(req.tenant.restaurantId, Number(req.params.id));
    return success(res, table);
  } catch (error) {
    return next(error);
  }
}

async function createTable(req, res, next) {
  try {
    const data = tableSchema.parse(req.body);
    const result = await tableService.createTable(req.tenant.restaurantId, data);
    return success(res, result, "Table created", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateTable(req, res, next) {
  try {
    const data = tableSchema.parse(req.body);
    await tableService.updateTable(req.tenant.restaurantId, Number(req.params.id), data);
    return success(res, null, "Table updated");
  } catch (error) {
    return next(error);
  }
}

async function updateTableStatus(req, res, next) {
  try {
    const data = tableStatusSchema.parse(req.body);
    await tableService.updateTableStatus(req.tenant.restaurantId, Number(req.params.id), data.status);
    return success(res, null, "Table status updated");
  } catch (error) {
    return next(error);
  }
}

async function deleteTable(req, res, next) {
  try {
    await tableService.deleteTable(req.tenant.restaurantId, Number(req.params.id));
    return success(res, null, "Table deleted");
  } catch (error) {
    return next(error);
  }
}

async function getTableQRCode(req, res, next) {
  try {
    const qrInfo = await tableService.getTableQRCode(req.tenant.restaurantId, Number(req.params.id));
    return success(res, qrInfo);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTables,
  getTable,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  getTableQRCode,
};
