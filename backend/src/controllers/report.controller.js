const reportService = require("../services/report.service");
const { success } = require("../utils/response");

const getRestaurantId = (req) => {
  return req.tenant?.restaurantId || req.tenantId || req.user?.restaurantId || req.restaurantId;
};

async function getReportDashboard(req, res, next) {
  try {
    const { filter, startDate, endDate } = req.query;
    const restaurantId = getRestaurantId(req);
    const data = await reportService.getReportDashboardData(
      restaurantId,
      filter || "this_month",
      startDate,
      endDate
    );
    return success(res, data);
  } catch (error) {
    return next(error);
  }
}

async function listExpenses(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const restaurantId = getRestaurantId(req);
    const expenses = await reportService.listExpenses(restaurantId, startDate, endDate);
    return success(res, expenses);
  } catch (error) {
    return next(error);
  }
}

async function createExpense(req, res, next) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = await reportService.createExpense(restaurantId, req.body);
    return success(res, { id }, "Expense logged successfully", 201);
  } catch (error) {
    return next(error);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const restaurantId = getRestaurantId(req);
    await reportService.deleteExpense(restaurantId, Number(req.params.id));
    return success(res, null, "Expense deleted");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getReportDashboard,
  listExpenses,
  createExpense,
  deleteExpense,
};
