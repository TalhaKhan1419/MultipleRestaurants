import { useState } from "react";
import { api } from "../../services/api";
import {
  X,
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  Flame,
  ChefHat,
  Receipt,
  User,
  Phone,
  MessageSquare,
  UtensilsCrossed,
  Layers,
  CircleDollarSign,
} from "lucide-react";

export default function OrderDetailsModal({ order, isOpen, onClose, onStatusUpdated, onOpenBilling }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !order) return null;

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    setError(null);
    try {
      await api.owner.updateOrderStatus(order.id, newStatus);
      if (onStatusUpdated) onStatusUpdated(order.id, newStatus);
    } catch (err) {
      setError(err.message || "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintSlip = () => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const itemsHtml = (order.items || [])
      .map(
        (i) => `
        <tr style="border-bottom: 1px dashed #ddd; font-size: 13px;">
          <td style="padding: 6px 0;">${i.itemName}</td>
          <td style="padding: 6px 0; text-align: center;">x${i.quantity}</td>
          <td style="padding: 6px 0; text-align: right;">₹${Number(i.unitPrice).toFixed(2)}</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold;">₹${Number(i.lineTotal).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 15px; color: #000; }
            h2, h4, p { margin: 4px 0; text-align: center; }
            .dashed { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            .total-row { font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>${order.restaurantName || "RESTAURANT KOT"}</h2>
          <p style="font-size: 11px;">${new Date(order.createdAt || Date.now()).toLocaleString()}</p>
          <div class="dashed"></div>
          <p><strong>ORDER: ${order.orderNumber}</strong></p>
          <p><strong>TABLE: ${order.tableNumber || "Takeaway"}</strong></p>
          ${order.customerName ? `<p>Guest: ${order.customerName}</p>` : ""}
          <div class="dashed"></div>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000; font-size: 12px;">
                <th style="text-align: left;">Item</th>
                <th>Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="dashed"></div>
          <table>
            <tr style="font-size: 12px;"><td>Subtotal:</td><td style="text-align: right;">₹${Number(order.subtotal || 0).toFixed(2)}</td></tr>
            <tr style="font-size: 12px;"><td>Tax / GST:</td><td style="text-align: right;">₹${Number(order.taxAmount || 0).toFixed(2)}</td></tr>
            ${Number(order.discountAmount || 0) > 0 ? `<tr style="font-size: 12px;"><td>Discount:</td><td style="text-align: right;">-₹${Number(order.discountAmount).toFixed(2)}</td></tr>` : ""}
            <tr class="total-row"><td>Grand Total:</td><td style="text-align: right;">₹${Number(order.totalAmount || 0).toFixed(2)}</td></tr>
          </table>
          ${order.notes ? `<div class="dashed"></div><p style="font-size: 12px;"><strong>Chef Note:</strong> ${order.notes}</p>` : ""}
          <div class="dashed"></div>
          <p style="font-size: 11px;">Thank you for dining with us!</p>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusColors = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-sky-50 text-sky-700 border-sky-200",
    preparing: "bg-blue-50 text-blue-700 border-blue-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-slate-100 text-slate-600 border-slate-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const items = order.items || [];
  const totalItemsCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-bold text-lg shadow-sm">
              {order.tableNumber ? order.tableNumber : "TA"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway Order"}
                </h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusColors[order.status] || "bg-slate-800 text-white"}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Order #{order.orderNumber} • {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Details Pill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-orange-500" />
              <span className="font-semibold">Customer:</span>
              <span className="text-slate-900 font-bold">{order.customerName || "Guest Diner"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-orange-500" />
              <span className="font-semibold">Phone:</span>
              <span className="text-slate-900">{order.customerPhone || "N/A"}</span>
            </div>
            {order.notes && (
              <div className="sm:col-span-2 flex items-start gap-2 text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Special Note:</strong> {order.notes}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
                <span>Ordered Items ({totalItemsCount})</span>
              </h4>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.itemName}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-orange-600">
                        x{item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        ₹{Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                        ₹{Number(item.lineTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            {order.billRequestedAt && order.paymentStatus !== "paid" && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 font-semibold text-sky-700">Customer requested this bill{` ${new Date(order.billRequestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}.</div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">₹{Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax / GST (5%):</span>
              <span className="font-semibold text-slate-800">₹{Number(order.taxAmount || 0).toFixed(2)}</span>
            </div>
            {Number(order.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-semibold">-₹{Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-emerald-600 text-base">₹{Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Payment Status:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {order.paymentStatus || "unpaid"}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrintSlip}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Thermal Slip</span>
          </button>

          <div className="flex items-center gap-2">
            {order.paymentStatus !== "paid" && (
              <button
                type="button"
                onClick={() => onOpenBilling?.(order)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CircleDollarSign className="w-3.5 h-3.5" />
                <span>Open Bill</span>
              </button>
            )}
            {order.status === "pending" && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleUpdateStatus("confirmed")}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Order</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
