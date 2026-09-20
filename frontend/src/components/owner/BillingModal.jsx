import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, QrCode, Receipt, Smartphone, X } from "lucide-react";
import { api } from "../../services/api";
import { printReceipt } from "../../utils/receiptPrinter";

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "online", label: "Online / UPI", icon: Smartphone },
  { id: "qr_pay", label: "QR Pay", icon: QrCode },
];

const money = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

export default function BillingModal({ order, isOpen, onClose, onPaymentComplete }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (["cash", "card", "online", "qr_pay"].includes(order?.paymentMethod)) {
      setPaymentMethod(order.paymentMethod);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const isPaid = order.paymentStatus === "paid";
  const canSettle = !isPaid && order?.kitchenStatus === "completed";

  const handlePayment = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const ids = order.orderIds && order.orderIds.length > 0 ? order.orderIds : [order.id];
      for (const id of ids) {
        await api.owner.updatePaymentStatus(id, "paid", paymentMethod);
        await api.owner.updateOrderStatus(id, "completed");
      }
      const paidOrder = { ...order, paymentStatus: "paid", paymentMethod, status: "completed" };
      printReceipt(paidOrder);
      onPaymentComplete?.(paidOrder);
      onClose();
    } catch (err) {
      setError(err.message || "Could not record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-900 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500"><Receipt className="h-5 w-5" /></div>
            <div><h2 className="text-base font-bold">Settle Bill</h2><p className="mt-0.5 text-xs text-slate-300">{order.orderNumber} · {order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"}</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-5">
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</div>}
          {!canSettle && !isPaid && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Mark the KOT status as completed before settling this bill.</div>}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
            <div className="mb-3 flex items-center justify-between font-semibold text-slate-700"><span>{(order.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0)} items</span><span>{order.customerName || "Guest Diner"}</span></div>
            <div className="space-y-1.5 text-slate-600"><div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div><div className="flex justify-between"><span>Tax / GST</span><span>{money(order.taxAmount)}</span></div>{Number(order.discountAmount || 0) > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{money(order.discountAmount)}</span></div>}</div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900"><span>Grand Total</span><span className="text-emerald-600">{money(order.totalAmount)}</span></div>
          </div>

          {!isPaid ? <><div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Payment method</p><div className="grid grid-cols-2 gap-2">{PAYMENT_METHODS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setPaymentMethod(id)} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition-colors ${paymentMethod === id ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><Icon className="h-4 w-4" />{label}</button>)}</div></div>
            <button type="button" disabled={!canSettle || submitting} onClick={handlePayment} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />{submitting ? "Recording payment..." : `Mark ${money(order.totalAmount)} as Paid & Print`}</button>
          </> : <div className="space-y-3"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700">This bill has already been paid.</div><button type="button" onClick={() => printReceipt(order)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-xs font-bold text-white hover:bg-slate-900"><Receipt className="h-4 w-4" />Print Paid Receipt</button></div>}
        </div>
      </div>
    </div>
  );
}
