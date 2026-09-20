import { useState, useEffect, useRef } from "react";
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
  Link2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

export default function Navbar({ activeTab, onTabChange, onOpenCustomerView, pendingOrderCount = 0, pendingKotCount = 0 }) {
  const { user, role, logout } = useAuth();
  const [roomOrdersOn, setRoomOrdersOn] = useState(true);
  const [selectedPrinter, setSelectedPrinter] = useState("KOT: RP3200 plus{U} 1...");
  const [showPrinterDropdown, setShowPrinterDropdown] = useState(false);
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const logoutRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (logoutRef.current && !logoutRef.current.contains(event.target)) {
        setShowLogoutDropdown(false);
      }
    }

    if (showLogoutDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogoutDropdown]);

  const handleCopyCustomerLink = (e) => {
    e.stopPropagation();
    const customerUrl = `${window.location.origin}/menu`;
    navigator.clipboard.writeText(customerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const ownerNavItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "hotel", label: "Hotel", icon: Building2 },
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
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-2.5 sm:px-3 lg:px-4 shadow-xs transition-all">
      <div className="flex items-center justify-between h-14 gap-1.5">
        {/* Left Brand / Restaurant Name */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xs">
            <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="font-bold text-slate-800 text-xs tracking-tight leading-none">
              {role === "super_admin" ? "GourmetOS Admin" : "GourmetOS POS"}
            </div>
            <div className="text-[9px] text-slate-500 font-medium mt-0.5 truncate max-w-[90px]">
              {role === "super_admin" ? "Management" : user?.restaurantName || "POS Software"}
            </div>
          </div>
        </div>

        {/* Center Nav Tabs (Desktop Horizontal Top Navbar) */}
        <nav className="hidden lg:flex items-center gap-0.5 max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === "dashboard" && activeTab === "dashboard");
            const badgeCount = item.id === "orders" ? pendingOrderCount : item.id === "kot" ? pendingKotCount : 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {badgeCount > 0 && (
                  <span className="min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status Badges & Controls */}
        <div className="flex items-center gap-1 shrink-0 text-[10px]">
          {/* Public Customer Menu Link with Copy & Open */}
          {role !== "super_admin" && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-full px-2.5 py-1 shadow-2xs text-orange-800 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => window.open("/menu", "_blank")}
                className="hover:underline cursor-pointer flex items-center gap-1 text-orange-700 font-bold max-w-[120px] truncate"
                title="Click to open Customer Menu in new tab"
              >
                <Link2 className="w-3 h-3 text-orange-600 shrink-0" />
                <span>Customer Menu</span>
                <ExternalLink className="w-2.5 h-2.5 text-orange-500 shrink-0" />
              </button>

              <div className="h-3 w-px bg-orange-200 mx-0.5" />

              <button
                type="button"
                onClick={handleCopyCustomerLink}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white hover:bg-orange-100 text-orange-700 text-[10px] font-bold border border-orange-200 transition-all cursor-pointer shadow-2xs"
                title="Copy Customer Menu Link to Clipboard"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-orange-600" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Room orders toggle pill badge */}
          <button
            type="button"
            onClick={() => setRoomOrdersOn(!roomOrdersOn)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
              roomOrdersOn
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-300"
            }`}
          >
            <CheckCircle2 className={`w-3 h-3 ${roomOrdersOn ? "text-emerald-500" : "text-amber-500"}`} />
            <span>Room orders {roomOrdersOn ? "ON" : "OFF"}</span>
          </button>

          {/* KOT Printer Status Dropdown Pill */}
          <div className="relative hidden xl:block">
            <button
              type="button"
              onClick={() => setShowPrinterDropdown(!showPrinterDropdown)}
              className="flex items-center gap-1 px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-3 h-3 text-slate-500" />
              <span className="max-w-[100px] truncate">{selectedPrinter}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {showPrinterDropdown && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs">
                <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
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
                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center justify-between ${
                      selectedPrinter === p ? "font-bold text-orange-600 bg-orange-50/50" : "text-slate-700"
                    }`}
                  >
                    <span>{p}</span>
                    {selectedPrinter === p && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Small Logout Symbol Button with Tiny Tooltip Popover */}
          <div className="relative" ref={logoutRef}>
            <button
              type="button"
              onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition-all cursor-pointer shadow-2xs flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>

            {showLogoutDropdown && (
              <div className="absolute right-0 mt-1.5 w-28 bg-white rounded-xl shadow-lg border border-slate-200 p-1 z-50 text-xs animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutDropdown(false);
                    logout();
                  }}
                  className="w-full px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Sub-Navbar Row for All Navigation Tabs */}
      <nav className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100/80 scrollbar-none -mx-3 px-3 sm:-mx-4 sm:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === "dashboard" && activeTab === "dashboard");
          const badgeCount = item.id === "orders" ? pendingOrderCount : item.id === "kot" ? pendingKotCount : 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
              {badgeCount > 0 && (
                <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
