function generateQrPayload(restaurantId, tableId) {
  return JSON.stringify({ restaurantId, tableId });
}
module.exports = { generateQrPayload };
