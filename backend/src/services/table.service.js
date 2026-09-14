const crypto = require("crypto");
const QRCode = require("qrcode");
const tableRepo = require("../repositories/table.repository");
const { getEnv } = require("../config/env");

async function listTables(restaurantId) {
  return tableRepo.findAll(restaurantId);
}

async function getTable(restaurantId, id) {
  const table = await tableRepo.findById(restaurantId, id);
  if (!table) {
    const error = new Error("Table not found");
    error.status = 404;
    throw error;
  }
  return table;
}

async function createTable(restaurantId, data) {
  const qrToken = crypto.randomUUID();
  const id = await tableRepo.create(restaurantId, {
    ...data,
    qrToken,
  });
  return { id, qrToken };
}

async function updateTable(restaurantId, id, data) {
  const updated = await tableRepo.update(restaurantId, id, data);
  if (!updated) {
    const error = new Error("Table not found or not modified");
    error.status = 404;
    throw error;
  }
  return true;
}

async function updateTableStatus(restaurantId, id, status) {
  const updated = await tableRepo.updateStatus(restaurantId, id, status);
  if (!updated) {
    const error = new Error("Table not found");
    error.status = 404;
    throw error;
  }
  return true;
}

async function deleteTable(restaurantId, id) {
  const deleted = await tableRepo.remove(restaurantId, id);
  if (!deleted) {
    const error = new Error("Table not found");
    error.status = 404;
    throw error;
  }
  return true;
}

async function getTableQRCode(restaurantId, id) {
  const table = await tableRepo.findById(restaurantId, id);
  if (!table) {
    const error = new Error("Table not found");
    error.status = 404;
    throw error;
  }

  const clientOrigin = getEnv().clientOrigin || "http://localhost:5173";
  const targetUrl = `${clientOrigin}/table/${table.qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: 360,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return {
    tableNumber: table.tableNumber,
    qrToken: table.qrToken,
    url: targetUrl,
    qrDataUrl,
  };
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
