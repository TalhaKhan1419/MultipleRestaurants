import { useEffect } from "react";
import { BellRing, ChefHat, Flame, X } from "lucide-react";
import { triggerOrderAlertOnce } from "../../utils/orderAlertTracker";

export default function KOTConfirmationNotifier({ order, onStartCooking, onDismiss }) {
  useEffect(() => {
    if (order) {
      triggerOrderAlertOnce(order, true);
    }
  }, [order]);

  if (!order) return null;

  const itemCount = (order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0);
  const itemsSummary = (order.items || []).slice(0, 2).map((item) => `${item.quantity}× ${item.itemName}`).join(", ");

  return (
    <div className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))] animate-bounce-short">
      <div className="overflow-hidden rounded-2xl border-2 border-orange-500 bg-white p-4 shadow-2xl ring-4 ring-orange-500/10">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white"><BellRing className="h-5 w-5 animate-wiggle" /><span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-500" /></div>
            <div><h3 className="text-sm font-black text-slate-900">New KOT Confirmed</h3><p className="mt-0.5 text-[11px] font-medium text-slate-500">{order.orderNumber} · {order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"}</p></div>
          </div>
          <button type="button" onClick={onDismiss} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss kitchen notification"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-3 rounded-xl border border-orange-100 bg-orange-50 p-2.5 text-xs text-slate-700"><span className="font-bold text-orange-700">{itemCount} items: </span>{itemsSummary}{(order.items || []).length > 2 ? " + more" : ""}</div>
        <button type="button" onClick={() => onStartCooking(order)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-orange-600"><ChefHat className="h-4 w-4" /><span>Accept & Start Cooking</span><Flame className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
