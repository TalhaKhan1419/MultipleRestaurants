import { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { playOrderChime } from "../../utils/audioAlert";
import {
  Bell,
  UtensilsCrossed,
  X,
  ChevronRight,
  Flame,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function NewOrderNotifier({ onOpenOrder, onPendingCountChange }) {
  const [activeAlert, setActiveAlert] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const seenOrderIdsRef = useRef(new Set());
  const isInitializedRef = useRef(false);

  const handleNewOrderReceived = (order) => {
    if (!order || !order.id) return;
    if (seenOrderIdsRef.current.has(order.id)) return;

    seenOrderIdsRef.current.add(order.id);

    // Play POS audio chime
    playOrderChime();

    // Trigger Popup alert
    setActiveAlert(order);
    setPendingCount((prev) => prev + 1);
  };

  // Safely notify parent component of pending count changes after React render phase
  useEffect(() => {
    if (onPendingCountChange && pendingCount > 0) {
      onPendingCountChange(pendingCount);
    }
  }, [pendingCount, onPendingCountChange]);


  // 1. Initial fetch to populate already existing orders (so they don't trigger alerts on refresh)
  useEffect(() => {
    let isMounted = true;

    async function initExistingOrders() {
      try {
        const orders = await api.owner.getOrders({ limit: 20 });
        if (orders && Array.isArray(orders)) {
          orders.forEach((o) => {
            if (o?.id) seenOrderIdsRef.current.add(o.id);
          });
        }
      } catch (err) {
        console.warn("Could not fetch initial orders for notifier:", err);
      } finally {
        if (isMounted) isInitializedRef.current = true;
      }
    }

    initExistingOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Setup BroadcastChannel and storage listeners for instant local tab detection
  useEffect(() => {
    let bc = null;
    try {
      bc = new BroadcastChannel("pos_orders");
      bc.onmessage = (event) => {
        if (event.data?.type === "NEW_ORDER" && event.data?.order) {
          handleNewOrderReceived(event.data.order);
        }
      };
    } catch (e) {}

    const handleStorageChange = (e) => {
      if (e.key === "last_pos_order_data" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleNewOrderReceived(parsed);
        } catch (err) {}
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 3. Periodic polling every 3 seconds for real-time backend updates across different devices
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!isInitializedRef.current) return;
      try {
        const recentOrders = await api.owner.getOrders({ limit: 10 });
        if (recentOrders && Array.isArray(recentOrders)) {
          // Identify any orders not seen yet
          for (const ord of recentOrders) {
            if (ord?.id && !seenOrderIdsRef.current.has(ord.id)) {
              handleNewOrderReceived(ord);
              break; // Trigger alert for newest order
            }
          }
        }
      } catch (err) {
        // Silent poll error (e.g. temporary network blip)
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  // Auto-dismiss alert popup after 12 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 12000);

    return () => clearTimeout(timer);
  }, [activeAlert]);

  if (!activeAlert) return null;

  const items = activeAlert.items || [];
  const itemsCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const itemsSummary = items
    .slice(0, 2)
    .map((i) => `${i.itemName} x${i.quantity}`)
    .join(", ");
  const hasMoreItems = items.length > 2;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-bounce-short pointer-events-auto">
      <div
        onClick={() => {
          if (onOpenOrder) onOpenOrder(activeAlert);
          setActiveAlert(null);
        }}
        className="bg-white rounded-2xl p-4 shadow-2xl border-2 border-orange-500 hover:border-orange-600 transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden ring-4 ring-orange-500/10"
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 shrink-0 relative">
              <Bell className="w-5 h-5 animate-wiggle" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900 tracking-tight">
                  New Order Received!
                </h4>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  {activeAlert.tableNumber ? `Table ${activeAlert.tableNumber}` : "Takeaway"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Order #{activeAlert.orderNumber} • Just now
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveAlert(null);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items preview */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 flex flex-col gap-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-slate-500 flex items-center gap-1">
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
              <span>{itemsCount} item{itemsCount > 1 ? "s" : ""}:</span>
            </span>
            <span className="font-bold text-emerald-600 text-sm">
              ₹{Number(activeAlert.totalAmount || 0).toFixed(2)}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 truncate">
            {itemsSummary}
            {hasMoreItems && ` +${items.length - 2} more`}
          </div>
        </div>

        {/* Action button row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-orange-600 font-semibold flex items-center gap-1 group-hover:underline">
            <span>Click to view order details & send to kitchen</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>

          <span className="text-[10px] text-slate-400 font-medium">
            Tap to open
          </span>
        </div>
      </div>
    </div>
  );
}

