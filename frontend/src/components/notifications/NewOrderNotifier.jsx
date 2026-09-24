import { useState, useEffect, useRef, useCallback } from "react";
import { playOrderChime } from "../../utils/audioAlert";
import { api } from "../../services/api";
import {
  Bell,
  UtensilsCrossed,
  X,
  ChevronRight,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function NewOrderNotifier({ orders, onOpenOrder, onPendingCountChange }) {
  const [activeAlert, setActiveAlert] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const seenOrderIdsRef = useRef(new Set());
  const isInitializedRef = useRef(false);

  const handleNewOrderReceived = useCallback((order) => {
    if (!order || !order.id) return;
    if (seenOrderIdsRef.current.has(order.id)) return;

    seenOrderIdsRef.current.add(order.id);

    // Play POS audio chime
    playOrderChime();

    // Trigger Popup alert
    setActiveAlert(order);
    setAccepted(false);
    setPendingCount((prev) => prev + 1);
  }, []);

  // Safely notify parent component of pending count changes after React render phase
  useEffect(() => {
    if (onPendingCountChange && pendingCount > 0) {
      onPendingCountChange(pendingCount);
    }
  }, [pendingCount, onPendingCountChange]);

  // Process live orders passed from central polling loop in App.jsx
  useEffect(() => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) return;

    if (!isInitializedRef.current) {
      orders.forEach((o) => {
        if (o?.id) seenOrderIdsRef.current.add(o.id);
      });
      isInitializedRef.current = true;
      return;
    }

    for (const ord of orders) {
      if (ord?.id && !seenOrderIdsRef.current.has(ord.id)) {
        handleNewOrderReceived(ord);
        break; // Trigger alert for newest order
      }
    }
  }, [orders, handleNewOrderReceived]);

  // Setup BroadcastChannel and storage listeners for instant local tab detection
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
  }, [handleNewOrderReceived]);

  // Auto-dismiss alert popup after 16 seconds if not interacted with
  useEffect(() => {
    if (!activeAlert || accepted) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 16000);

    return () => clearTimeout(timer);
  }, [activeAlert, accepted]);

  const handleAcceptOrder = async (e) => {
    e.stopPropagation();
    if (!activeAlert || !activeAlert.id || accepting) return;
    setAccepting(true);
    try {
      // 1. Confirm order and move kitchen status to preparing
      await api.owner.updateOrderStatus(activeAlert.id, "confirmed");
      await api.owner.updateKitchenStatus(activeAlert.id, "preparing");

      // Broadcast event so KOT and orders tabs update instantly
      try {
        const bc = new BroadcastChannel("pos_orders");
        bc.postMessage({ type: "KOT_UPDATE", ticketId: activeAlert.id, newStatus: "preparing" });
        bc.close();
      } catch (err) {}

      localStorage.setItem("last_pos_order_ts", Date.now().toString());

      setAccepted(true);
      setTimeout(() => {
        setActiveAlert(null);
        setAccepted(false);
      }, 1000);
    } catch (err) {
      alert("Failed to accept order: " + (err.message || "Error"));
    } finally {
      setAccepting(false);
    }
  };

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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
          <div className="text-[11px] text-slate-600 truncate font-medium">
            {itemsSummary}
            {hasMoreItems && ` +${items.length - 2} more`}
          </div>
        </div>

        {/* Action button row */}
        <div className="flex items-center justify-between pt-1 gap-2">
          {accepted ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-full justify-center">
              <CheckCircle className="w-4 h-4" />
              <span>Order Accepted & Sent to KOT!</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAcceptOrder}
                disabled={accepting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs py-2 px-3 rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {accepting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Accept Order</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenOrder) onOpenOrder(activeAlert);
                  setActiveAlert(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
