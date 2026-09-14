import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Users, Shield, Store, Mail, Phone, Calendar, RefreshCw } from "lucide-react";

export default function AdminUsersList() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.superAdmin.getAdmins();
      setAdmins(data || []);
    } catch (err) {
      setError(err.message || "Failed to load admin list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin & Owner Accounts</h1>
          <p className="text-xs text-slate-400 mt-0.5">Global user registry for platform administrators and restaurant admins</p>
        </div>

        <button
          type="button"
          onClick={fetchAdmins}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : admins.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Users Found</h3>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{adm.fullName}</div>
                      <div className="text-[11px] text-slate-400">{adm.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          adm.role === "super_admin"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {adm.role === "super_admin" ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <Store className="w-3 h-3" />
                        )}
                        <span>{adm.role === "super_admin" ? "Super Admin" : "Restaurant Admin"}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {adm.restaurantName ? (
                        <span className="font-medium text-slate-200">{adm.restaurantName}</span>
                      ) : (
                        <span className="text-slate-500 italic">Global Access</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-300">{adm.phone || "—"}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          adm.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {adm.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(adm.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
