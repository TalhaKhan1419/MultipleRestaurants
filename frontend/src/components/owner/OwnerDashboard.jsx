import { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  UtensilsCrossed,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export default function OwnerDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.owner.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.owner.updateOrderStatus(orderId, newStatus);
      fetchStats();
    } catch (err) {
      alert(err.message || "Failed to update order status");
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading live analytics...</span>
        </div>
      </div>
    );
  }

  const todayRevenue = Number(stats?.today?.todayRevenue || 0);
  const todayOrders = Number(stats?.today?.todayOrders || 0);
  const occupiedTables = Number(stats?.tables?.occupiedTables || 0);
  const totalTables = Number(stats?.tables?.totalTables || 0);
  const totalMenuItems = Number(stats?.menu?.totalMenuItems || 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Restaurant Overview</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Live performance and incoming orders</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("orders")}
            className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-semibold text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Open Order Manager</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              ₹{todayRevenue.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Paid: ₹{Number(stats?.today?.todayPaidRevenue || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Orders</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">{todayOrders}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Total lifetime: {stats?.overall?.totalOrders || 0} orders
            </div>
          </div>
        </div>

        {/* Occupied Tables */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Tables</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {occupiedTables} <span className="text-sm font-normal text-slate-400">/ {totalTables}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              {stats?.tables?.availableTables || 0} tables available
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Menu Items</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-800 tracking-tight">{totalMenuItems}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Across {stats?.menu?.totalCategories || 0} categories
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Status Breakdown & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Status Breakdown & Actions */}
        <div className="space-y-6">
          {/* Order Status Cards */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Live Order Pipeline</h3>
            <div className="space-y-2.5">
              {["pending", "confirmed", "cancelled"].map((st) => {
                const count =
                  stats?.statusBreakdown?.find((s) => s.status === st)?.count || 0;
                const colors = {
                  pending: "bg-amber-50 text-amber-700 border-amber-200",
                  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
                  preparing: "bg-blue-50 text-blue-700 border-blue-200",
                  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  completed: "bg-slate-100 text-slate-600 border-slate-200",
                };
                return (
                  <div
                    key={st}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <span className="text-xs capitalize font-semibold text-slate-700">{st}</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${colors[st]}`}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate("menu")}
                className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-left transition-all cursor-pointer group"
              >
                <UtensilsCrossed className="w-4 h-4 text-orange-500 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Add Menu</div>
                <div className="text-[10px] text-slate-500 font-medium">Add dishes & categories</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("tables")}
                className="p-3 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-left transition-all cursor-pointer group"
              >
                <QrCode className="w-4 h-4 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Room & QR</div>
                <div className="text-[10px] text-slate-500 font-medium">Download QR</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Orders Stream</h3>
                <p className="text-[11px] text-slate-500 font-medium">Latest active orders from dining tables & guest rooms</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("orders")}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats?.recentOrders?.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
                No orders yet today. Open the customer view or create a manual order to start.
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentOrders?.map((order) => {
                  const statusColors = {
                    pending: "bg-amber-50 text-amber-700 border-amber-200",
                    confirmed: "bg-sky-50 text-sky-700 border-sky-200",
                    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
                  };

                  return (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs shrink-0 shadow-xs">
                          {order.tableNumber ? `T-${order.tableNumber}` : "TA"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {order.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                                statusColors[order.status] || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {order.customerName || "Guest"} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800">
                            ₹{Number(order.totalAmount).toFixed(2)}
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              order.paymentStatus === "paid"
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                                : "text-amber-700 bg-amber-50 border border-amber-200"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>

                        {/* Quick Status Action */}
                        {order.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-[11px] font-semibold text-white transition-colors cursor-pointer shadow-xs"
                          >
                            Confirm
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
