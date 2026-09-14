import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Grid,
  Printer,
  ClipboardList,
  UtensilsCrossed,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Users,
  CheckCircle2,
  DollarSign,
  QrCode,
} from "lucide-react";

export default function Navbar({ activeTab, onTabChange, onOpenCustomerView, pendingOrderCount = 0, pendingKotCount = 0 }) {
  const { user, role, logout } = useAuth();
  const [roomOrdersOn, setRoomOrdersOn] = useState(true);
  const [selectedPrinter, setSelectedPrinter] = useState("KOT: RP3200 plus{U} 1...");
  const [showPrinterDropdown, setShowPrinterDropdown] = useState(false);

  const ownerNavItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "tables", label: "Rooms/Tables", icon: Grid },
    { id: "kot", label: "KOT", icon: Printer },
    { id: "orders", label: "Orders", icon: ClipboardList },
    { id: "menu", label: "Add Menu", icon: UtensilsCrossed },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const superAdminNavItems = [
    { id: "super_dashboard", label: "Overview", icon: Home },
    { id: "super_restaurants", label: "Restaurants", icon: Building2 },
    { id: "super_admins", label: "Admins & Users", icon: Users },
  ];

  const navItems = role === "super_admin" ? superAdminNavItems : ownerNavItems;

  const printers = [
    "KOT: RP3200 plus{U} 1...",
    "Bill: Thermal 80mm",
    "Bar KOT: Posiflex 2",
    "Kitchen: Epson TM-T82"
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-6 shadow-xs">
      <div className="flex items-center justify-between h-16 gap-4">
        {/* Left Brand / Restaurant Name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-xs">
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm tracking-tight leading-none">
              {role === "super_admin" ? "GourmetOS Admin" : "Settings"}
            </div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
              {role === "super_admin" ? "Platform Management" : user?.restaurantName || "UP 65 Restaurant & Buffet"}
            </div>
          </div>
        </div>

        {/* Center Nav Tabs (Horizontal Top Navbar matching photo) */}
        <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === "dashboard" && activeTab === "dashboard");
            const badgeCount = item.id === "orders" ? pendingOrderCount : item.id === "kot" ? pendingKotCount : 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{item.label}</span>
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow border-2 border-white animate-pulse">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status Badges & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick QR Menu Test Button */}
          {role !== "super_admin" && (
            <button
              type="button"
              onClick={onOpenCustomerView}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-semibold transition-colors cursor-pointer"
              title="Open Customer QR Menu in a new tab"
            >
              <QrCode className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Test QR Menu</span>
            </button>
          )}
          {/* Room orders toggle pill badge */}
          <button
            type="button"
            onClick={() => setRoomOrdersOn(!roomOrdersOn)}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all cursor-pointer ${
              roomOrdersOn
                ? "bg-slate-50 text-slate-700 border-slate-300"
                : "bg-amber-50 text-amber-700 border-amber-300"
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${roomOrdersOn ? "text-emerald-500" : "text-amber-500"}`} />
            <span>Room orders {roomOrdersOn ? "ON" : "OFF"}</span>
          </button>

          {/* KOT Printer Status Dropdown Pill */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setShowPrinterDropdown(!showPrinterDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-300 bg-slate-50 text-slate-700 text-[11px] font-medium hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="max-w-[130px] truncate">{selectedPrinter}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPrinterDropdown && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select Active Printer
                </div>
                {printers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedPrinter(p);
                      setShowPrinterDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-orange-50 hover:text-orange-600 transition-colors ${
                      selectedPrinter === p ? "font-semibold text-orange-600 bg-orange-50/50" : "text-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Account / Cashier Pill */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-300 bg-slate-50 text-slate-700 text-[11px] font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-slate-500" />
            <span className="max-w-[110px] truncate">
              {user?.fullName || "Sameer Shubh..."}
            </span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
