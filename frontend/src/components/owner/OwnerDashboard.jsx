import { useState, useEffect } from "react";
import { api } from "../../services/api";
import {
  TrendingUp,
  ShoppingBag,
  Bed,
  Users,
  QrCode,
  Copy,
  Download,
  Filter,
  UtensilsCrossed,
  Plus,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function OwnerDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState(null);

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

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium font-sans">Loading live database analytics...</span>
        </div>
      </div>
    );
  }

  // --- 100% REAL DATABASE METRICS ---
  const sales30 = Number(stats?.stats30Days?.revenue30 || 0);
  const orders30 = Number(stats?.stats30Days?.ordersCount30 || 0);
  const roomService30 = Number(stats?.roomService30?.roomServiceRevenue30 || 0);

  const occupiedTables = Number(stats?.tables?.occupiedTables || 0);
  const totalTables = Number(stats?.tables?.totalTables || 0);
  const availableTables = Math.max(0, totalTables - occupiedTables);
  const occupancyPercentage = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  // Kitchen Queue live data
  const kitchenQueue = stats?.kitchenQueue || [];
  const activeKitchenCount = kitchenQueue.length;

  // 100% Real 30-day continuous timeline from backend DB query
  const trendData = stats?.salesTrend || [];

  // Calculate real daily average
  const totalTrendRevenue = trendData.reduce((acc, curr) => acc + Number(curr.revenue || 0), 0);
  const avgDailySales = trendData.length > 0 ? (totalTrendRevenue / trendData.length).toFixed(2) : "0.00";

  // Dynamic Y-Axis scale calculation based strictly on REAL DATABASE peak
  const peakVal = Math.max(...trendData.map((d) => Number(d.revenue || 0)), 10);
  const maxVal = Math.ceil(peakVal * 1.25);
  const yTicks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

  // Selected date ticks for X axis
  const xTicksIndices = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, Math.max(0, trendData.length - 1)];

  // Real Order Mix breakdown from DB
  const statusCounts = stats?.statusBreakdown || [];
  const getStatusCount = (st) => Number(statusCounts.find((s) => s.status === st)?.count || 0);
  const completedCount = getStatusCount("completed");
  const pendingCount = getStatusCount("pending");
  const preparingCount = getStatusCount("preparing") || getStatusCount("confirmed");
  const readyCount = getStatusCount("ready");

  const totalMix = (completedCount + pendingCount + preparingCount + readyCount) || orders30 || 0;
  const completedPct = totalMix > 0 ? Math.round((completedCount / totalMix) * 100) : 0;

  // Real Popular items (Top 5 from DB)
  const popularItems = stats?.popularItems || [];
  const maxPopularQty = Math.max(...popularItems.map((i) => Number(i.totalQty || 1)), 1);

  // QR Code URL
  const customerMenuUrl = `${window.location.origin}/menu`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(customerMenuUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerMenuUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQr = () => {
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = "restaurant-menu-qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-10 font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Dashboard</span>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              LIVE DATABASE
            </span>
            <span className="text-[10px] font-extrabold text-slate-500">
              ({stats?.restaurant?.name || "UP 65 restaurant & Buffet"})
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Real database metrics, live sales trend & real-time kitchen orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: 30-day sales */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all relative">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>30-day sales</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{sales30.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {orders30} orders recorded
            </div>
          </div>
        </div>

        {/* Card 2: 30-day orders */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all relative">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <span>30-day orders</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{orders30}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {activeKitchenCount} active in kitchen
            </div>
          </div>
        </div>

        {/* Card 3: Room service */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all relative">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Bed className="w-4 h-4 text-emerald-500" />
              <span>Room service</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{roomService30.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Total room sales overall 30 days
            </div>
          </div>
        </div>

        {/* Card 4: Table occupancy */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all relative">
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Table occupancy</span>
            </div>
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              title="Filter"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {occupiedTables}/{totalTables}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {availableTables} tables available
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Middle Row - Sales Trend (Area Chart), Floor Status, Menu QR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Sales Trend Chart (Span 6) */}
        <div className="lg:col-span-6 bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sales trend</h3>
                <p className="text-[11px] text-slate-400 font-medium">Actual database sales over 30 days</p>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 border border-orange-200/80 text-[11px] font-bold">
                ₹{Number(avgDailySales).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / day
              </div>
            </div>

            {/* Sales Trend Area Graph Container */}
            <div className="flex gap-2 pt-3">
              {/* Left Y-Axis Values dynamically scaled to real peak */}
              <div className="flex flex-col justify-between text-[10px] text-slate-400 font-medium pr-2 py-1 text-right select-none h-44 shrink-0 min-w-[65px]">
                {yTicks.map((tick, i) => (
                  <span key={i}>
                    {tick.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ))}
              </div>

              {/* Chart Plot Area */}
              <div className="relative h-44 flex-1">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="0" x2="500" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Dynamic Scaling from Real DB Points */}
                  {(() => {
                    if (!trendData.length) return null;
                    const points = trendData.map((d, idx) => {
                      const x = (idx / Math.max(1, trendData.length - 1)) * 500;
                      const y = 145 - (Number(d.revenue || 0) / maxVal) * 135;
                      return { x, y, data: d, idx };
                    });

                    const pathD = points.reduce(
                      (acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
                      ""
                    );
                    const areaD = `${pathD} L 500,150 L 0,150 Z`;

                    return (
                      <>
                        {/* Solid Mountain Fill */}
                        <path d={areaD} fill="#ea580c" fillOpacity="0.80" />

                        {/* Stroke Top Line */}
                        <path d={pathD} fill="none" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Interactive Points */}
                        {points.map((p) => (
                          <circle
                            key={p.idx}
                            cx={p.x}
                            cy={p.y}
                            r={activeHoverPoint === p.idx ? "4.5" : "2.5"}
                            fill="#ffffff"
                            stroke="#ea580c"
                            strokeWidth="1.5"
                            className="cursor-pointer transition-all hover:scale-125"
                            onMouseEnter={() => setActiveHoverPoint(p.idx)}
                          />
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* Floating Tooltip Card */}
                {activeHoverPoint !== null && trendData[activeHoverPoint] && (
                  <div
                    className="absolute bg-white border border-slate-200 rounded-md px-2.5 py-1.5 shadow-lg pointer-events-none font-sans text-xs z-20 transition-all"
                    style={{
                      left: `${(activeHoverPoint / Math.max(1, trendData.length - 1)) * 100}%`,
                      top: "15px",
                      transform:
                        activeHoverPoint < 3
                          ? "translateX(0%)"
                          : activeHoverPoint > trendData.length - 4
                          ? "translateX(-100%)"
                          : "translateX(-50%)",
                    }}
                  >
                    <div className="font-bold text-slate-800">
                      {trendData[activeHoverPoint].dateLabel || trendData[activeHoverPoint].date}
                    </div>
                    <div className="text-orange-600 font-extrabold text-[11px] mt-0.5">
                      {trendData[activeHoverPoint].ordersCount} orders - ₹
                      {Number(trendData[activeHoverPoint].revenue).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* X-Axis Date Ticks across the month */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium pl-[70px] pr-1">
              {xTicksIndices.map((index) => {
                const item = trendData[index];
                return <span key={index}>{item ? item.dateLabel : ""}</span>;
              })}
            </div>
          </div>
        </div>

        {/* Floor Status (Span 3) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Floor status</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mb-3">
              Occupancy {occupancyPercentage}%
            </p>

            <div className="flex items-center gap-4 my-2">
              {/* Donut Chart */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-orange-500 transition-all duration-500"
                    strokeDasharray={`${occupancyPercentage}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-extrabold text-xs text-slate-800">
                  {occupancyPercentage}%
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="flex-1 space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Occupied</span>
                    <span className="font-bold">{occupiedTables}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (occupiedTables / Math.max(1, totalTables)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Completed</span>
                    <span className="font-bold text-emerald-600">{completedPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${completedPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu QR Card (Span 3) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Menu QR</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                  title="Copy menu URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                  title="Download QR"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mb-2">Scan to view menu</p>

            {/* Restaurant Badge & QR code */}
            <div className="flex flex-col items-center justify-center p-2 bg-slate-50/70 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black">
                  U
                </div>
                <div className="truncate max-w-[170px]">
                  {stats?.restaurant?.name || "UP 65 restaurant & Buffet"}
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                <img
                  src={qrImageUrl}
                  alt="Restaurant Menu QR"
                  className="w-24 h-24 object-contain"
                />
              </div>

              <p className="text-[10px] text-slate-400 font-medium mt-2">
                Point camera to open the menu
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Bottom Row - Order Mix, Popular Items, Kitchen Queue, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Order Mix Donut Chart (Span 3) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Order mix</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-3">Status split for the last 30 days</p>

            {/* Donut Chart representation */}
            <div className="flex items-center justify-center my-3">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-emerald-500"
                    strokeWidth="4.5"
                    strokeDasharray={`${Math.max(10, completedPct)}, 100`}
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-sky-400"
                    strokeWidth="4.5"
                    strokeDasharray="20, 100"
                    strokeDashoffset="-60"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-slate-800">{totalMix}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Orders</span>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-semibold text-slate-600 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                <span>Preparing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span>Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Items Bar Chart (Span 3) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Popular items</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-3">Top 5 for the last 30 days</p>

            {/* Vertical Bar Chart */}
            {popularItems.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-medium border-b border-slate-200">
                No menu items ordered yet
              </div>
            ) : (
              <div className="flex items-end justify-between gap-1.5 h-32 pt-2 px-1 border-b border-slate-200">
                {popularItems.slice(0, 5).map((item, idx) => {
                  const heightPct = Math.max(15, Math.round((Number(item.totalQty) / maxPopularQty) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.totalQty}
                      </span>
                      <div
                        className="w-full bg-orange-500 hover:bg-orange-600 rounded-t-sm transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* X-axis names */}
            <div className="flex justify-between items-center text-[9px] font-semibold text-slate-500 mt-2 gap-1 uppercase truncate">
              {popularItems.slice(0, 5).map((item, idx) => (
                <span key={idx} className="flex-1 text-center truncate" title={item.name}>
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Kitchen Queue (Span 3) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Kitchen queue</h3>
              <button
                type="button"
                onClick={() => onNavigate("orders")}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
              >
                View all
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mb-2.5">Live incoming KOT orders</p>

            {kitchenQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No active orders in kitchen queue
              </div>
            ) : (
              <div className="space-y-2">
                {kitchenQueue.slice(0, 2).map((kot) => (
                  <div
                    key={kot.id}
                    className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-white transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        #{kot.orderNumber?.slice(-3) || kot.id}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Table: {kot.tableNumber || "main"} - {kot.itemCount || 1} items
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded capitalize ${
                          kot.kitchenStatus === "preparing" || kot.status === "confirmed"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {kot.kitchenStatus || kot.status}
                      </span>
                      <div className="text-[11px] font-black text-slate-800 mt-0.5">
                        ₹{Number(kot.totalAmount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (Span 3) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick actions</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-3">Frequently used operations</p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigate("orders")}
                className="w-full py-2.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create new order</span>
              </button>

              <div className="pt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => onNavigate("orders")}
                  className="w-full text-left py-1.5 px-2 text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-slate-50 rounded transition-colors"
                >
                  View order history
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate("tables")}
                  className="w-full text-left py-1.5 px-2 text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-slate-50 rounded transition-colors"
                >
                  Manage tables
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate("menu")}
                  className="w-full text-left py-1.5 px-2 text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-slate-50 rounded transition-colors"
                >
                  Manage menu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
