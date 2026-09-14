import { useState, useEffect, useMemo } from "react";
import { api } from "../../services/api";
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  DollarSign,
  User,
  Phone,
  X,
  AlertCircle,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  Globe,
  Receipt,
  LayoutGrid,
  ListOrdered,
  Users,
} from "lucide-react";

export default function OrderManager({ onSelectOrder, refreshKey = 0 }) {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'table_view' or 'tickets_view'
  const [viewMode, setViewMode] = useState("table_view");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTableFilter, setSelectedTableFilter] = useState("all");

  const fetchOrdersAndTables = async () => {
    try {
      const [ordersData, tablesData] = await Promise.all([
        api.owner.getOrders(statusFilter === "all" ? {} : { status: statusFilter }),
        api.owner.getTables(),
      ]);
      setOrders(ordersData || []);
      setTables(tablesData || []);
    } catch (err) {
      setError(err.message || "Failed to load orders and tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrdersAndTables();
    const interval = setInterval(fetchOrdersAndTables, 4000);
    return () => clearInterval(interval);
  }, [statusFilter, refreshKey]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.owner.updateOrderStatus(orderId, newStatus);
      fetchOrdersAndTables();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  // Group orders by table
  const tableOrderMap = useMemo(() => {
    const map = new Map();
    for (const table of tables) {
      const activeTableOrders = orders.filter(
        (o) => o.tableId === table.id && o.status !== "cancelled"
      );
      const unpaidOrders = activeTableOrders.filter((o) => o.paymentStatus === "unpaid");
      const runningBill = unpaidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      map.set(table.id, {
        table,
        orders: activeTableOrders,
        unpaidOrders,
        runningBill,
      });
    }
    return map;
  }, [tables, orders]);

  const statusColors = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-sky-50 text-sky-700 border-sky-200",
    preparing: "bg-blue-50 text-blue-700 border-blue-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-slate-100 text-slate-600 border-slate-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Orders & POS</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-bold uppercase">
              Table & Room Billing
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage table occupancies, running bills, kitchen tickets, and instant bill settlement
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle between Table View & Tickets View */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode("table_view")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table_view"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tickets_view")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "tickets_view"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>All Tickets</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchOrdersAndTables}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all cursor-pointer shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
          {error}
        </div>
      )}

      {/* VIEW MODE 1: TABLE FLOOR VIEW */}
      {viewMode === "table_view" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tables.map((table) => {
            const data = tableOrderMap.get(table.id) || { table, orders: [], unpaidOrders: [], runningBill: 0 };
            const isOccupied = table.status === "occupied" || data.unpaidOrders.length > 0;

            return (
              <div
                key={table.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                  isOccupied ? "border-amber-300 bg-amber-50/10" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base border ${
                          isOccupied
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}
                      >
                        {table.tableNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">
                            Table {table.tableNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                              isOccupied
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isOccupied ? "Occupied" : "Available"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Capacity: {table.capacity} Persons</span>
                        </div>
                      </div>
                    </div>

                    {isOccupied && (
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Running Bill</span>
                        <div className="text-sm font-bold text-emerald-600">
                          ₹{data.runningBill.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="py-3 space-y-2">
                    {data.orders.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs font-medium">
                        No active tickets for this table.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                        {data.orders.map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => onSelectOrder && onSelectOrder(ord)}
                            className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 text-xs space-y-1.5 cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{ord.orderNumber}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusColors[ord.status]}`}>
                                {ord.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>{ord.items?.length || 0} items</span>
                              <span className="font-semibold text-slate-800">₹{Number(ord.totalAmount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: ALL TICKETS */}
      {viewMode === "tickets_view" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder && onSelectOrder(order)}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-orange-400 shadow-xs hover:shadow-md space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors text-xs">{order.orderNumber}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"} • {order.items?.length || 0} items</span>
                <span className="font-bold text-emerald-600">₹{Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
