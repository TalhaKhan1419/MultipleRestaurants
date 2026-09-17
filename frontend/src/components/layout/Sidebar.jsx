import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Layers,
  QrCode,
  Settings,
  Building2,
  Users,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function Sidebar({ activeTab, onTabChange }) {
  const { role } = useAuth();

  const ownerNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "hotel", label: "Hotel & Rooms", icon: Building2 },
    { id: "orders", label: "Live Orders", icon: ShoppingBag, badge: "Live" },
    { id: "menu", label: "Menu Items", icon: UtensilsCrossed },
    { id: "categories", label: "Categories", icon: Layers },
    { id: "tables", label: "Tables & QR Codes", icon: QrCode },
    { id: "settings", label: "Restaurant Settings", icon: Settings },
  ];

  const superAdminNavItems = [
    { id: "super_dashboard", label: "Platform Overview", icon: LayoutDashboard },
    { id: "super_restaurants", label: "All Restaurants", icon: Building2 },
    { id: "super_admins", label: "Admins & Owners", icon: Users },
  ];

  const items = role === "super_admin" ? superAdminNavItems : ownerNavItems;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            {role === "super_admin" ? "Super Admin Center" : "Restaurant Management"}
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Super Admin Quick Switch Note */}
        {role === "super_admin" && (
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Tenant Mode</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              You have global permissions to oversee all restaurants and register new owners.
            </p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="pt-4 border-t border-slate-800/80 px-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span>GourmetOS v2.0</span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </aside>
  );
}
