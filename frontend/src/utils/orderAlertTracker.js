import { playOrderChime } from "./audioAlert";

// In-memory set of order state keys that have already been alerted
const alertedKeys = new Set();

/**
 * Generates a unique state key for an order based on ID, total item quantity, and timestamp.
 */
export function getOrderAlertKey(order) {
  if (!order || !order.id) return "";
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const timeKey = order.updatedAt || order.createdAt || "";
  return `${order.id}_qty${itemCount}_t${timeKey}`;
}

/**
 * Checks if an order state key has already been alerted.
 */
export function hasBeenAlerted(order) {
  const key = getOrderAlertKey(order);
  return !key || alertedKeys.has(key);
}

/**
 * Marks initial list of existing orders as already alerted (without sound or popup)
 * so that navigating to the Order Dashboard or KOT screen does NOT fire alerts for old orders.
 */
export function markOrdersAsSeen(ordersList = []) {
  if (!Array.isArray(ordersList)) return;
  for (const order of ordersList) {
    const key = getOrderAlertKey(order);
    if (key) alertedKeys.add(key);
  }
}

/**
 * Triggers sound and returns true ONLY IF the order state has not been alerted before.
 */
export function triggerOrderAlertOnce(order, playSound = true) {
  if (!order || !order.id) return false;
  const key = getOrderAlertKey(order);
  if (alertedKeys.has(key)) return false;

  alertedKeys.add(key);

  if (playSound) {
    playOrderChime();
  }

  return true;
}
