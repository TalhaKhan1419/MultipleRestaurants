import { useEffect, useRef, useState } from "react";
import { BellRing, Receipt, X } from "lucide-react";
import { api } from "../../services/api";
import { playOrderChime } from "../../utils/audioAlert";

export default function BillRequestNotifier({ onOpenBill }) {
  const [activeRequest, setActiveRequest] = useState(null);
  const seenRequestIds = useRef(new Set());

  useEffect(() => {
    let isMounted = true;

    const checkBillRequests = async () => {
      try {
        const orders = await api.owner.getOrders({ limit: 100 });
        if (!isMounted || !Array.isArray(orders)) return;

        const requestedBill = orders.find(
          (order) => order.billRequestedAt && order.paymentStatus !== "paid" && !seenRequestIds.current.has(order.id)
        );

        if (requestedBill) {
          seenRequestIds.current.add(requestedBill.id);
          playOrderChime();
          setActiveRequest(requestedBill);
        }
      } catch (_) {
        // Keep the POS usable during a temporary polling failure.
      }
    };

    checkBillRequests();
    const interval = setInterval(checkBillRequests, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!activeRequest) return null;

  return (
    <div className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))] animate-bounce-short">
      <div className="overflow-hidden rounded-2xl border-2 border-emerald-500 bg-white p-4 shadow-2xl ring-4 ring-emerald-500/10">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <BellRing className="h-5 w-5 animate-wiggle" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Bill Requested</h3>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                {activeRequest.orderNumber} · {activeRequest.tableNumber ? `Table ${activeRequest.tableNumber}` : "Takeaway"}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setActiveRequest(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss bill request">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-xs text-emerald-900">
          Customer is ready to pay <span className="font-black">₹{Number(activeRequest.totalAmount || 0).toFixed(2)}</span> by <span className="font-black">{String(activeRequest.paymentMethod || "cash").replace("_", " ").toUpperCase()}</span>.
        </div>
        <button
          type="button"
          onClick={() => {
            onOpenBill(activeRequest);
            setActiveRequest(null);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
        >
          <Receipt className="h-4 w-4" />
          Open Bill & Collect Payment
        </button>
      </div>
    </div>
  );
}
