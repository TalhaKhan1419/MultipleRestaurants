export function combineTableOrders(table, ordersList) {
  if (!ordersList || ordersList.length === 0) return null;
  if (ordersList.length === 1) return ordersList[0];

  const allItems = ordersList.flatMap((o) =>
    (o.items || []).map((item) => ({
      ...item,
      itemName: item.itemName || item.name || "Dish Item",
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || item.price || 0),
      lineTotal: Number(item.lineTotal || (Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1))),
    }))
  );

  const subtotal = ordersList.reduce((sum, o) => sum + Number(o.subtotal || o.totalAmount || 0), 0);
  const taxAmount = ordersList.reduce((sum, o) => sum + Number(o.taxAmount || 0), 0);
  const discountAmount = ordersList.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);
  const totalAmount = ordersList.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const allCompleted = ordersList.every((o) => o.kitchenStatus === "completed");

  const tableNum = table?.tableNumber || ordersList[0].tableNumber;

  return {
    id: ordersList[0].id,
    orderIds: ordersList.map((o) => o.id),
    orderNumber: tableNum ? `Table ${tableNum} (${ordersList.length} Orders)` : `Combined (${ordersList.length} Orders)`,
    tableNumber: tableNum,
    customerName: ordersList[0].customerName || "Guest Diner",
    customerPhone: ordersList[0].customerPhone || "",
    paymentStatus: "unpaid",
    paymentMethod: ordersList[0].paymentMethod || "cash",
    kitchenStatus: allCompleted ? "completed" : "preparing",
    items: allItems,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    createdAt: ordersList[0].createdAt,
    isCombined: true,
  };
}
