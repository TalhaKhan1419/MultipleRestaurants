import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  Mail,
  Phone,
  DollarSign,
  UtensilsCrossed,
  QrCode,
  ShoppingBag,
  X,
  AlertCircle,
  Lock,
} from "lucide-react";

export default function RestaurantsDirectory({ onInspectTenant }) {
  const { setSelectedRestaurantId } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Onboard Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: "",
    address: "",
    adminName: "",
    adminPhone: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.superAdmin.getRestaurants();
      setRestaurants(data || []);
    } catch (err) {
      setError(err.message || "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleToggleStatus = async (restaurantId, currentStatus) => {
    try {
      await api.superAdmin.updateRestaurantStatus(restaurantId, !currentStatus);
      fetchRestaurants();
    } catch (err) {
      alert(err.message || "Failed to update restaurant status");
    }
  };

  const handleInspect = (restaurant) => {
    setSelectedRestaurantId(restaurant.id);
    onInspectTenant(restaurant);
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      await api.superAdmin.createRestaurant(formData);
      setIsModalOpen(false);
      setFormData({
        restaurantName: "",
        address: "",
        adminName: "",
        adminPhone: "",
        adminEmail: "",
        adminPassword: "",
      });
      fetchRestaurants();
    } catch (err) {
      setModalError(err.message || "Failed to onboard restaurant");
    } finally {
      setModalLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      (r.adminName && r.adminName.toLowerCase().includes(term)) ||
      (r.adminEmail && r.adminEmail.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Restaurant Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage tenant accounts, live metrics, and restaurant provisioning</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Restaurant</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by restaurant name, admin, or email..."
          className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Restaurant Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Restaurants Found</h3>
          <p className="text-xs text-slate-400 mt-1">No restaurants match your current search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRestaurants.map((r) => (
            <div
              key={r.id}
              className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div>
                    <h3 className="text-base font-bold text-white">{r.name}</h3>
                    <div className="text-[11px] text-indigo-400 font-medium">/{r.slug}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(r.id, r.isActive === 1 || r.isActive === true)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                      r.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30"
                    }`}
                  >
                    {r.isActive ? "Active" : "Disabled"}
                  </button>
                </div>

                {/* Owner details */}
                <div className="py-3 space-y-1.5 text-xs border-b border-slate-800/60">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{r.adminName || "No admin assigned"}</span>
                  </div>
                  {r.adminEmail && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{r.adminEmail}</span>
                    </div>
                  )}
                  {r.adminPhone && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{r.adminPhone}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Badges */}
                <div className="grid grid-cols-4 gap-2 py-3 text-center">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <div className="text-xs font-bold text-white">{r.menuItemsCount || 0}</div>
                    <div className="text-[9px] text-slate-500">Dishes</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <div className="text-xs font-bold text-white">{r.tablesCount || 0}</div>
                    <div className="text-[9px] text-slate-500">Tables</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <div className="text-xs font-bold text-white">{r.ordersCount || 0}</div>
                    <div className="text-[9px] text-slate-500">Orders</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <div className="text-xs font-bold text-emerald-400">
                      ₹{Number(r.totalRevenue || 0).toFixed(0)}
                    </div>
                    <div className="text-[9px] text-slate-500">Revenue</div>
                  </div>
                </div>
              </div>

              {/* Inspect Button */}
              <div className="pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleInspect(r)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Inspect Restaurant Operations</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboard Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-lg w-full p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Onboard New Restaurant & Owner</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                1. Restaurant Details
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  placeholder="e.g. Bella Italia Trattoria"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Address / Location</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="MG Road, Bengaluru, India"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                2. Admin Account Credentials
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  placeholder="e.g. Marco Rossi"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Admin Email (Login)</label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="marco@bellaitalia.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Admin Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.adminPhone}
                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                    placeholder="0509876543"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {modalLoading ? "Creating..." : "Complete Onboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
