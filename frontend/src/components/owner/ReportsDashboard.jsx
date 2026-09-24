import { useState, useEffect, useMemo } from "react";
import { api } from "../../services/api";
import {
  TrendingUp,
  ShoppingBag,
  Bed,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3,
  CreditCard,
  Banknote,
  Smartphone,
  Globe,
  UtensilsCrossed,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Trash2,
  X,
  Search,
  ChevronRight,
  Building2,
  Package,
} from "lucide-react";

export default function ReportsDashboard() {
  const [dateFilter, setDateFilter] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeHoverPoint, setActiveHoverPoint] = useState(null);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expensesList, setExpensesList] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "Operational",
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseError, setExpenseError] = useState(null);
  const [activeTabSubView, setActiveTabSubView] = useState("overview"); // 'overview' | 'expenses'
  const [searchTx, setSearchTx] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { filter: dateFilter };
      if (dateFilter === "custom") {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const data = await api.reports.getDashboard(params);
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load report analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const params = {};
      if (dateFilter === "custom") {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const data = await api.reports.getExpenses(params);
      setExpensesList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchExpenses();
  }, [dateFilter, customStartDate, customEndDate]);

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      setExpenseError("Title and Amount are required.");
      return;
    }
    setExpenseSubmitting(true);
    setExpenseError(null);
    try {
      await api.reports.createExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount),
      });
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: "",
        amount: "",
        category: "Operational",
        expenseDate: new Date().toISOString().slice(0, 10),
        notes: "",
      });
      fetchReports();
      fetchExpenses();
    } catch (err) {
      setExpenseError(err.message || "Failed to add expense");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense entry?")) return;
    try {
      await api.reports.deleteExpense(id);
      fetchReports();
      fetchExpenses();
    } catch (err) {
      alert(err.message || "Failed to delete expense");
    }
  };

  // Metrics Destructuring
  const summary = reportData?.summary || {};
  const totalRevenue = Number(summary.totalRevenue || 0);
  const totalOrders = Number(summary.totalOrders || 0);
  const restaurantSales = Number(summary.restaurantSales || 0);
  const hotelRevenue = Number(summary.hotelRevenue || 0);
  const totalExpenses = Number(summary.totalExpenses || 0);
  const netProfit = Number(summary.netProfit || 0);

  const revenueComp = reportData?.revenueComparison || {};
  const ordersOverview = reportData?.ordersOverview || {};
  const paymentBreakdown = reportData?.paymentBreakdown || [];
  const topSellingItems = reportData?.topSellingItems || [];
  const hotelSummary = reportData?.hotelSummary || {};
  const inventoryAlerts = reportData?.inventoryAlerts || [];
  const revenueTrend = reportData?.revenueTrend || [];
  const recentTransactions = reportData?.recentTransactions || [];

  // Filtered recent transactions for search
  const filteredTransactions = useMemo(() => {
    if (!searchTx.trim()) return recentTransactions;
    const term = searchTx.toLowerCase();
    return recentTransactions.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.location.toLowerCase().includes(term) ||
        t.paymentMethod.toLowerCase().includes(term)
    );
  }, [recentTransactions, searchTx]);

  // Scaled Y-Axis for Revenue Overview SVG Chart
  const trendPeak = Math.max(...revenueTrend.map((d) => Number(d.totalRevenue || 0)), 100);
  const maxChartVal = Math.ceil(trendPeak * 1.2);
  const yTicks = [maxChartVal, maxChartVal * 0.75, maxChartVal * 0.5, maxChartVal * 0.25, 0];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header & Date Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Business Reports & Analytics</h1>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive performance metrics, revenue analysis, and financial insights
              </p>
            </div>
          </div>
        </div>

        {/* Date Filters Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "this_week", label: "This Week" },
              { id: "this_month", label: "This Month" },
              { id: "this_year", label: "This Year" },
              { id: "custom", label: "Custom Range" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setDateFilter(btn.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dateFilter === btn.id
                    ? "bg-white text-orange-600 shadow-xs font-bold"
                    : "hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchReports}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
            title="Refresh Analytics Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Pickers Bar */}
      {dateFilter === "custom" && (
        <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-orange-800 font-bold">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span>Select Custom Date Range:</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span>From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium outline-none focus:border-orange-500 shadow-2xs"
              />
            </label>

            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span>To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium outline-none focus:border-orange-500 shadow-2xs"
              />
            </label>
          </div>
        </div>
      )}

      {/* 2. Summary Metric Cards Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-2xl p-4 shadow-md flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-white/10 rounded-full blur-xs group-hover:scale-125 transition-transform" />
          <div className="flex items-start justify-between">
            <span className="text-xs font-extrabold text-orange-100 uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight">₹{totalRevenue.toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-orange-100 font-medium mt-1">Restaurant + Room Revenue</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800 tracking-tight">{totalOrders}</div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Dining + Room Bookings</p>
          </div>
        </div>

        {/* Restaurant Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Restaurant Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800 tracking-tight">₹{restaurantSales.toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">{revenueComp.restaurantPercentage || 0}% of Total Revenue</p>
          </div>
        </div>

        {/* Hotel/Room Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hotel Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800 tracking-tight">₹{hotelRevenue.toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-purple-600 font-bold mt-1">{revenueComp.hotelPercentage || 0}% of Total Revenue</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              title="Add New Operational Expense"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 tracking-tight">₹{totalExpenses.toLocaleString("en-IN")}</div>
            <p className="text-[10px] text-rose-500 font-medium mt-1 flex items-center justify-between">
              <span>Operational + Stock</span>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="underline hover:text-rose-700 font-bold cursor-pointer"
              >
                Log Cost
              </button>
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`rounded-2xl p-4 border shadow-xs flex flex-col justify-between transition-all ${
          netProfit >= 0 ? "bg-emerald-50/60 border-emerald-200" : "bg-rose-50/60 border-rose-200"
        }`}>
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Net Profit</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              netProfit >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            }`}>
              {netProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight ${netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              ₹{netProfit.toLocaleString("en-IN")}
            </div>
            <p className={`text-[10px] font-bold mt-1 ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {netProfit >= 0 ? "Positive Net Earnings" : "Net Operating Loss"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Revenue Overview Timeline Area Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>Revenue Trend Overview</span>
            </h3>
            <p className="text-xs text-slate-500">
              Live timeline comparison of revenue across the selected period
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Restaurant</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Hotel</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-900" />
              <span>Total Revenue</span>
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="flex gap-2 pt-2">
          {/* Y Axis Values */}
          <div className="flex flex-col justify-between text-[10px] text-slate-400 font-medium pr-2 py-1 text-right select-none h-48 shrink-0 min-w-[65px]">
            {yTicks.map((tick, i) => (
              <span key={i}>
                ₹{tick.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            ))}
          </div>

          {/* Plot Area */}
          <div className="relative h-48 flex-1">
            {revenueTrend.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                No revenue transactions recorded for this period.
              </div>
            ) : (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="0" x2="500" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#cbd5e1" strokeWidth="1" />

                {(() => {
                  const points = revenueTrend.map((d, idx) => {
                    const x = (idx / Math.max(1, revenueTrend.length - 1)) * 500;
                    const yTotal = 145 - (Number(d.totalRevenue || 0) / maxChartVal) * 135;
                    const yRest = 145 - (Number(d.restaurantRevenue || 0) / maxChartVal) * 135;
                    const yHotel = 145 - (Number(d.hotelRevenue || 0) / maxChartVal) * 135;
                    return { x, yTotal, yRest, yHotel, data: d, idx };
                  });

                  const pathTotalD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.yTotal}` : `${acc} L ${p.x},${p.yTotal}`), "");
                  const areaTotalD = `${pathTotalD} L 500,150 L 0,150 Z`;

                  const pathRestD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.yRest}` : `${acc} L ${p.x},${p.yRest}`), "");
                  const pathHotelD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.yHotel}` : `${acc} L ${p.x},${p.yHotel}`), "");

                  return (
                    <>
                      <path d={areaTotalD} fill="#ea580c" fillOpacity="0.15" />
                      <path d={pathRestD} fill="none" stroke="#ea580c" strokeWidth="2" strokeDasharray="4 2" />
                      <path d={pathHotelD} fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 2" />
                      <path d={pathTotalD} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                      {points.map((p) => (
                        <circle
                          key={p.idx}
                          cx={p.x}
                          cy={p.yTotal}
                          r={activeHoverPoint === p.idx ? "5" : "3"}
                          fill="#ffffff"
                          stroke="#ea580c"
                          strokeWidth="2"
                          className="cursor-pointer transition-all hover:scale-125"
                          onMouseEnter={() => setActiveHoverPoint(p.idx)}
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            )}

            {/* Hover Tooltip */}
            {activeHoverPoint !== null && revenueTrend[activeHoverPoint] && (
              <div
                className="absolute bg-slate-900 text-white rounded-xl px-3 py-2 shadow-xl pointer-events-none text-xs z-30 transition-all border border-slate-700"
                style={{
                  left: `${Math.min(75, Math.max(10, (activeHoverPoint / Math.max(1, revenueTrend.length - 1)) * 100))}%`,
                  top: "10px",
                }}
              >
                <div className="font-bold border-b border-slate-800 pb-1 mb-1.5 text-orange-400">
                  {revenueTrend[activeHoverPoint].dateLabel}
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-300">Restaurant:</span>
                    <span className="font-bold text-orange-400">₹{Number(revenueTrend[activeHoverPoint].restaurantRevenue || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-300">Hotel:</span>
                    <span className="font-bold text-purple-400">₹{Number(revenueTrend[activeHoverPoint].hotelRevenue || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1 font-extrabold text-white">
                    <span>Total:</span>
                    <span>₹{Number(revenueTrend[activeHoverPoint].totalRevenue || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* X Axis Date Labels */}
        <div className="flex justify-between text-[10px] text-slate-400 font-bold pl-[65px] pt-3 select-none">
          {revenueTrend.slice(0, 10).map((item, idx) => (
            <span key={idx}>{item.dateLabel}</span>
          ))}
        </div>
      </div>

      {/* 4. Restaurant vs Hotel Revenue Comparison & Orders Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Restaurant vs Hotel Revenue Comparison */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-orange-500" />
                  <span>Restaurant vs. Hotel Revenue</span>
                </h3>
                <p className="text-xs text-slate-500">Distribution of revenue sources</p>
              </div>
            </div>

            {/* Visual Progress Comparison Bar */}
            <div className="space-y-4">
              <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
                <div
                  style={{ width: `${revenueComp.restaurantPercentage || 0}%` }}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all flex items-center justify-center text-[10px] font-black text-white"
                >
                  {revenueComp.restaurantPercentage > 10 ? `${revenueComp.restaurantPercentage}%` : ""}
                </div>
                <div
                  style={{ width: `${revenueComp.hotelPercentage || 0}%` }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all flex items-center justify-center text-[10px] font-black text-white"
                >
                  {revenueComp.hotelPercentage > 10 ? `${revenueComp.hotelPercentage}%` : ""}
                </div>
              </div>

              {/* Cards Breakdown */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
                    <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                    <span>Restaurant Sales</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2">
                    ₹{restaurantSales.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] font-extrabold text-orange-600 mt-0.5">
                    {revenueComp.restaurantPercentage || 0}% share
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-800">
                    <Bed className="w-4 h-4 text-purple-600" />
                    <span>Hotel / Room Revenue</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2">
                    ₹{hotelRevenue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] font-extrabold text-purple-600 mt-0.5">
                    {revenueComp.hotelPercentage || 0}% share
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Overview */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-orange-500" />
                  <span>Orders Status Overview</span>
                </h3>
                <p className="text-xs text-slate-500">Breakdown of restaurant order fulfillment</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-bold">Total Orders</div>
                <div className="text-2xl font-black text-slate-800 mt-1">{ordersOverview.totalOrders || 0}</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-xs text-emerald-700 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Completed</span>
                </div>
                <div className="text-2xl font-black text-emerald-800 mt-1">{ordersOverview.completedOrders || 0}</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <div className="text-xs text-amber-700 font-bold flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending</span>
                </div>
                <div className="text-2xl font-black text-amber-800 mt-1">{ordersOverview.pendingOrders || 0}</div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <div className="text-xs text-rose-700 font-bold flex items-center justify-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cancelled</span>
                </div>
                <div className="text-2xl font-black text-rose-800 mt-1">{ordersOverview.cancelledOrders || 0}</div>
              </div>
            </div>

            {/* Fulfill Rate Progress */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Fulfillment Completion Rate</span>
                <span>
                  {ordersOverview.totalOrders > 0
                    ? Math.round((ordersOverview.completedOrders / ordersOverview.totalOrders) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      ordersOverview.totalOrders > 0
                        ? Math.round((ordersOverview.completedOrders / ordersOverview.totalOrders) * 100)
                        : 0
                    }%`,
                  }}
                  className="h-full bg-emerald-500 rounded-full transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Payment Methods & Top Selling Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                <span>Payment Methods Collection</span>
              </h3>
              <p className="text-xs text-slate-500">Revenue split across payment modes</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {paymentBreakdown.map((pm) => {
              let IconComponent = Banknote;
              let colorBg = "bg-emerald-50 text-emerald-600 border-emerald-200";
              let barColor = "bg-emerald-500";

              if (pm.method === "UPI") {
                IconComponent = Smartphone;
                colorBg = "bg-blue-50 text-blue-600 border-blue-200";
                barColor = "bg-blue-500";
              } else if (pm.method === "CARD") {
                IconComponent = CreditCard;
                colorBg = "bg-purple-50 text-purple-600 border-purple-200";
                barColor = "bg-purple-500";
              } else if (pm.method === "ONLINE") {
                IconComponent = Globe;
                colorBg = "bg-amber-50 text-amber-600 border-amber-200";
                barColor = "bg-amber-500";
              }

              return (
                <div key={pm.method} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${colorBg}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{pm.method}</div>
                        <div className="text-[10px] text-slate-500">{pm.count} transactions</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-slate-900 text-sm">₹{pm.amount.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] font-bold text-slate-500">{pm.percentage}% of revenue</div>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div style={{ width: `${pm.percentage}%` }} className={`h-full ${barColor} transition-all`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Menu Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                  <span>Top Selling Menu Items</span>
                </h3>
                <p className="text-xs text-slate-500">Ranked by sales volume and revenue</p>
              </div>
            </div>

            {topSellingItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                No menu sales recorded in this date range.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                {topSellingItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                        idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                        idx === 1 ? "bg-slate-200 text-slate-700 border border-slate-300" :
                        idx === 2 ? "bg-orange-100 text-orange-800 border border-orange-300" : "bg-slate-100 text-slate-600"
                      }`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{item.totalQty} units sold</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900">₹{item.totalRevenue.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Hotel Summary & Inventory Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hotel Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                <span>Hotel & Room Occupancy Summary</span>
              </h3>
              <p className="text-xs text-slate-500">Live room status and booking metrics</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Rooms</span>
              <div className="text-xl font-black text-slate-800 mt-1">{hotelSummary.totalRooms || 0}</div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[10px] font-bold text-purple-700 uppercase">Occupied</span>
              <div className="text-xl font-black text-purple-900 mt-1">{hotelSummary.occupiedRooms || 0}</div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Available</span>
              <div className="text-xl font-black text-emerald-900 mt-1">{hotelSummary.availableRooms || 0}</div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold text-blue-700 uppercase">Check-Ins</span>
              <div className="text-xl font-black text-blue-900 mt-1">{hotelSummary.checkIns || 0}</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Check-Outs</span>
              <div className="text-xl font-black text-amber-900 mt-1">{hotelSummary.checkOuts || 0}</div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Occupancy Rate</span>
              <div className="text-xl font-black text-indigo-900 mt-1">{hotelSummary.occupancyPercentage || 0}%</div>
            </div>
          </div>
        </div>

        {/* Inventory Stock Alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span>Inventory Stock Alerts</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Low and Out of Stock ingredient alerts</p>
              </div>
            </div>

            {inventoryAlerts.length === 0 ? (
              <div className="py-10 text-center text-xs text-emerald-600 font-bold bg-emerald-50/50 border border-emerald-200 rounded-xl flex flex-col items-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span>All stock levels are optimal! No low stock alerts.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {inventoryAlerts.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border flex items-center justify-between text-xs bg-slate-50 border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 shrink-0 ${item.status === "out_of_stock" ? "text-rose-500" : "text-amber-500"}`} />
                      <div>
                        <div className="font-bold text-slate-800">{item.itemName}</div>
                        <div className="text-[10px] text-slate-500">Min Threshold: {item.minimumStock} {item.unit}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        item.status === "out_of_stock"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}>
                        {item.currentStock} {item.unit} ({item.status === "out_of_stock" ? "OUT OF STOCK" : "LOW STOCK"})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Recent Transactions & Expense Ledger Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>Recent Transactions & Operational Expenses</span>
            </h3>
            <p className="text-xs text-slate-500">View recent orders and log custom operational costs</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTabSubView("overview")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTabSubView === "overview" ? "bg-white text-orange-600 font-bold shadow-2xs" : "text-slate-600"
                }`}
              >
                Recent Orders
              </button>
              <button
                type="button"
                onClick={() => setActiveTabSubView("expenses")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTabSubView === "expenses" ? "bg-white text-orange-600 font-bold shadow-2xs" : "text-slate-600"
                }`}
              >
                Expenses Ledger ({expensesList.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {activeTabSubView === "overview" ? (
          <div>
            <div className="relative mb-3 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none focus:border-orange-500"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Customer / Order #</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-400 font-medium">
                        No transactions found in this period.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          {tx.customerName ? (
                            <div>
                              <div className="font-bold text-slate-800">{tx.customerName}</div>
                              <div className="text-[10px] text-slate-400 font-medium font-mono">#{tx.orderNumber || tx.title}</div>
                            </div>
                          ) : (
                            <div className="font-bold text-slate-800">{tx.title}</div>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-600">{tx.location}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            tx.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            tx.status === "cancelled" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          ₹{tx.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right text-slate-500 font-medium">
                          {new Date(tx.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Title / Expense</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Expense Date</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expensesList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400 font-medium">
                      No logged expenses in this date range. Click "+ Log Expense" above to add operational costs.
                    </td>
                  </tr>
                ) : (
                  expensesList.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{exp.title}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 italic max-w-xs truncate">{exp.notes || "—"}</td>
                      <td className="p-3 text-right font-black text-rose-600">
                        ₹{exp.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-right text-slate-600 font-medium">
                        {new Date(exp.expenseDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 8. Log Operational Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">Log Operational Expense</h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {expenseError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Expense Title / Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity Bill, Kitchen Vegetables, Staff Salary"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-orange-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-orange-500 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-orange-500 text-xs"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Ingredients">Ingredients & Supplies</option>
                    <option value="Utilities">Utilities (Bills)</option>
                    <option value="Salaries">Salaries & Wages</option>
                    <option value="Maintenance">Maintenance & Repairs</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-orange-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes / Remarks</label>
                <textarea
                  rows="2"
                  placeholder="Optional details or vendor invoice info..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-orange-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseSubmitting}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {expenseSubmitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
