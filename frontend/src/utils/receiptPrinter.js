const money = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function printReceipt(order) {
  const receiptWindow = window.open("", "_blank", "width=400,height=650");
  if (!receiptWindow) return false;

  const items = (order.items || []).map((item) => `
    <tr>
      <td>${escapeHtml(item.itemName)}</td>
      <td class="center">x${Number(item.quantity || 0)}</td>
      <td class="right">${money(item.lineTotal)}</td>
    </tr>`).join("");

  receiptWindow.document.write(`<!doctype html>
    <html><head><title>Receipt - ${escapeHtml(order.orderNumber)}</title>
    <style>
      body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 14px; color: #111; font-size: 12px; }
      h2, p { text-align: center; margin: 4px 0; } h2 { font-size: 16px; }
      .line { border-top: 1px dashed #222; margin: 10px 0; } table { width: 100%; border-collapse: collapse; }
      td { padding: 4px 0; vertical-align: top; } .right { text-align: right; } .center { text-align: center; }
      .total { font-size: 14px; font-weight: bold; } .muted { color: #444; font-size: 11px; }
    </style></head><body>
      <h2>${escapeHtml(order.restaurantName || "RESTAURANT")}</h2>
      ${order.restaurantAddress ? `<p class="muted">${escapeHtml(order.restaurantAddress)}</p>` : ""}
      ${order.restaurantPhone ? `<p class="muted">${escapeHtml(order.restaurantPhone)}</p>` : ""}
      <div class="line"></div>
      <p><strong>TAX INVOICE / RECEIPT</strong></p>
      <p>Order: ${escapeHtml(order.orderNumber)}</p>
      <p>${order.tableNumber ? `Table: ${escapeHtml(order.tableNumber)}` : "Takeaway"}</p>
      <p class="muted">${new Date(order.createdAt || Date.now()).toLocaleString()}</p>
      <div class="line"></div>
      <table>${items}</table>
      <div class="line"></div>
      <table>
        <tr><td>Subtotal</td><td class="right">${money(order.subtotal)}</td></tr>
        <tr><td>Tax / GST</td><td class="right">${money(order.taxAmount)}</td></tr>
        ${Number(order.discountAmount || 0) > 0 ? `<tr><td>Discount</td><td class="right">-${money(order.discountAmount)}</td></tr>` : ""}
        <tr class="total"><td>Total</td><td class="right">${money(order.totalAmount)}</td></tr>
      </table>
      <div class="line"></div>
      <p><strong>PAID • ${escapeHtml((order.paymentMethod || "cash").replace("_", " ").toUpperCase())}</strong></p>
      <p class="muted">Thank you for dining with us!</p>
      <script>window.onload = () => { window.print(); window.close(); };</script>
    </body></html>`);
  receiptWindow.document.close();
  return true;
}
