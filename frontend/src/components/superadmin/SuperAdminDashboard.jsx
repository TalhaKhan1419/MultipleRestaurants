import { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  Building2,
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Plus,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  Store,
} from "lucide-react";

export default function SuperAdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.superAdmin.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load platform stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalRestaurants = Number(stats?.totalRestaurants || 0);
  const activeRestaurants = Number(stats?.activeRestaurants || 0);
  const totalAdmins = Number(stats?.totalAdmins || 0);
  const totalOrders = Number(stats?.totalOrders || 0);
  const platformRevenue = Number(stats?.totalPlatformRevenue || 0);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Platform Control</h1>
          <p className="text-xs text-slate-400 mt-0.5">Global multi-tenant metrics, onboardings, and platform operations</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("super_restaurants")}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Restaurant</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Platform KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Restaurants */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Restaurants</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{totalRestaurants}</div>
            <div className="text-[11px] text-emerald-400 mt-1">
              {activeRestaurants} active tenants
            </div>
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Platform GMV (Paid)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              ₹{platformRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across all restaurants</div>
          </div>
        </div>

        {/* Total Platform Orders */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Processed Orders</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{totalOrders}</div>
            <div className="text-[11px] text-slate-400 mt-1">Global transactions</div>
          </div>
        </div>

        {/* Registered Owners */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Restaurant Admins</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{totalAdmins}</div>
            <div className="text-[11px] text-slate-400 mt-1">Active admin accounts</div>
          </div>
        </div>
      </div>

      {/* Main Section: Recent Restaurants & Platform Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Restaurants */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recently Onboarded Restaurants</h3>
              <p className="text-[11px] text-slate-400">New restaurants created on the platform</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("super_restaurants")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Directory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(stats?.recentRestaurants || []).map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{r.name}</span>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                          r.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {r.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Admin: {r.adminName || "Unassigned"} ({r.adminEmail})
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Info Box */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin Capabilities</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            As a Super Admin, you can provision new restaurant tenants with dedicated admin credentials, monitor overall transaction flow, and inspect or manage individual restaurant operations.
          </p>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate("super_restaurants")}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Manage All Restaurants</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("super_admins")}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View User Directory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
