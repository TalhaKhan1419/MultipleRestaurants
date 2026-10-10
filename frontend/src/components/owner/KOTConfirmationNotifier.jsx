import { useState, useEffect } from "react";
import { BellRing, ChefHat, Flame, XCircle, X, Loader2 } from "lucide-react";
import { triggerOrderAlertOnce } from "../../utils/orderAlertTracker";
import { api } from "../../services/api";

export default function KOTConfirmationNotifier({ order, onStartCooking, onCancelOrder, onDismiss }) {
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    if (order) {
      triggerOrderAlertOnce(order, true);
    }
  }, [order]);

  if (!order) return null;

  const itemCount = (order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0);
  const itemsSummary = (order.items || []).slice(0, 2).map((item) => `${item.quantity}× ${item.itemName}`).join(", ");

  const handleCancel = async () => {
    if (!order || !order.id) return;
    if (!window.confirm(`Are you sure you want to cancel order #${order.orderNumber || order.id}?`)) return;

    setLoadingAction("cancel");
    try {
      if (onCancelOrder) {
        await onCancelOrder(order);
      } else {
        await api.owner.updateOrderStatus(order.id, "cancelled");
        await api.owner.updateKitchenStatus(order.id, "cancelled");
        try {
          const bc = new BroadcastChannel("pos_orders");
          bc.postMessage({ type: "KOT_UPDATE", ticketId: order.id, newStatus: "cancelled" });
          bc.close();
        } catch (e) {}
      }
    } catch (err) {
      alert("Failed to cancel order: " + (err.message || "Error"));
    } finally {
      setLoadingAction(null);
      if (onDismiss) onDismiss();
    }
  };

  const handleAccept = async () => {
    if (!order || !order.id) return;
    setLoadingAction("accept");
    try {
      if (onStartCooking) {
        await onStartCooking(order);
      } else {
        await api.owner.updateKitchenStatus(order.id, "preparing");
        await api.owner.updateOrderStatus(order.id, "confirmed");
        try {
          const bc = new BroadcastChannel("pos_orders");
          bc.postMessage({ type: "KOT_UPDATE", ticketId: order.id, newStatus: "preparing" });
          bc.close();
        } catch (e) {}
      }
    } catch (err) {
      alert("Failed to accept order: " + (err.message || "Error"));
    } finally {
      setLoadingAction(null);
      if (onDismiss) onDismiss();
    }
  };

  return (
    <div className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))] animate-bounce-short">
      <div className="overflow-hidden rounded-2xl border-2 border-orange-500 bg-white p-4 shadow-2xl ring-4 ring-orange-500/10">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <BellRing className="h-5 w-5 animate-wiggle" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">New Order Alert</h3>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                #{order.orderNumber || order.id} · {order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-orange-100 bg-orange-50 p-2.5 text-xs text-slate-700">
          <span className="font-bold text-orange-700">{itemCount} items: </span>
          {itemsSummary}
          {(order.items || []).length > 2 ? " + more" : ""}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={Boolean(loadingAction)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-black text-white transition-colors hover:bg-orange-600 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loadingAction === "accept" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChefHat className="h-4 w-4" />
            )}
            <span>Accept & Cook</span>
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={Boolean(loadingAction)}
            className="flex items-center justify-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2.5 text-xs font-bold text-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loadingAction === "cancel" ? (
              <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
