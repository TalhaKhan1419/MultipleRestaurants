const reportRepo = require("../repositories/report.repository");

async function getReportDashboardData(restaurantId, filter, startDate, endDate) {
  return reportRepo.getReportDashboardData(restaurantId, filter, startDate, endDate);
}

async function listExpenses(restaurantId, startDate, endDate) {
  return reportRepo.listExpenses(restaurantId, startDate, endDate);
}

async function createExpense(restaurantId, data) {
  if (!data.title || !data.amount) {
    const error = new Error("Expense title and amount are required");
    error.status = 400;
    throw error;
  }
  return reportRepo.createExpense(restaurantId, data);
}

async function deleteExpense(restaurantId, id) {
  const deleted = await reportRepo.deleteExpense(restaurantId, id);
  if (!deleted) {
    const error = new Error("Expense not found");
    error.status = 404;
    throw error;
  }
  return true;
}

module.exports = {
  getReportDashboardData,
  listExpenses,
  createExpense,
  deleteExpense,
};
