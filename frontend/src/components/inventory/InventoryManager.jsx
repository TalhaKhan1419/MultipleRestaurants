import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  History,
  Layers,
  Truck,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  SlidersHorizontal,
} from "lucide-react";

const UNITS = [
  "KG",
  "GRAM",
  "LITRE",
  "ML",
  "PIECE",
  "BOX",
  "PACKET",
  "DOZEN",
  "CAN",
  "BOTTLE",
  "BAG",
  "BUNDLE",
  "PORTION",
];

export default function InventoryManager() {
  const [activeTab, setActiveTab] = useState("items"); // 'items', 'history', 'categories'

  // Data states
  const [summary, setSummary] = useState({ totalItems: 0, inStockCount: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyFilterType, setHistoryFilterType] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce history search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHistorySearch(historySearch), 300);
    return () => clearTimeout(timer);
  }, [historySearch]);

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = Add, object = Edit

  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  const [isItemHistoryModalOpen, setIsItemHistoryModalOpen] = useState(false);
  const [itemHistoryList, setItemHistoryList] = useState([]);

  // Form States
  const [itemForm, setItemForm] = useState({
    itemName: "",
    categoryId: "",
    unit: "KG",
    currentStock: 0,
    minimumStock: 0,
    maximumStock: "",
    purchasePrice: 0,
    supplierId: "",
    description: "",
  });

  const [stockActionForm, setStockActionForm] = useState({
    quantity: "",
    reason: "",
    note: "",
  });

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Fetch Summary & Data
  const loadSummary = async () => {
    try {
      const data = await api.inventory.getSummary();
      setSummary(data);
    } catch (_) {}
  };

  const loadCategoriesAndSuppliers = async () => {
    try {
      const [catData, supData] = await Promise.all([
        api.inventory.getCategories(),
        api.inventory.getSuppliers(),
      ]);
      setCategories(catData || []);
      setSuppliers(supData || []);
    } catch (_) {}
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.inventory.getItems({
        page,
        limit: 15,
        search: debouncedSearch,
        categoryId: selectedCategory,
        status: selectedStatus,
        unit: selectedUnit,
      });
      const itemList = res?.items || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      setItems(itemList);
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || "Failed to load inventory items");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, selectedStatus, selectedUnit]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.inventory.getHistory({
        page: historyPage,
        limit: 50,
        transactionType: historyFilterType,
        search: debouncedHistorySearch,
      });
      const txList = res?.transactions || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      setHistory(txList);
      if (res?.pagination) {
        setHistoryTotalPages(res.pagination.totalPages || 1);
      }
    } catch (_) {}
  }, [historyPage, historyFilterType, debouncedHistorySearch]);

  useEffect(() => {
    Promise.all([
      loadSummary(),
      loadCategoriesAndSuppliers(),
    ]);
  }, []);

  useEffect(() => {
    if (activeTab === "items") {
      loadItems();
    } else if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadItems, loadHistory]);

  // Open Add/Edit Item Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemForm({
      itemName: "",
      categoryId: categories[0]?.id || "",
      unit: "KG",
      currentStock: 0,
      minimumStock: 5,
      maximumStock: "",
      purchasePrice: 0,
      supplierId: "",
      description: "",
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemForm({
      itemName: item.itemName || "",
      categoryId: item.categoryId || "",
      unit: item.unit || "KG",
      currentStock: item.currentStock || 0,
      minimumStock: item.minimumStock || 0,
      maximumStock: item.maximumStock !== null ? item.maximumStock : "",
      purchasePrice: item.purchasePrice || 0,
      supplierId: item.supplierId || "",
      description: item.description || "",
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.itemName.trim()) {
      showNotification("Item name is required", true);
      return;
    }
    try {
      if (editingItem) {
        await api.inventory.updateItem(editingItem.id, itemForm);
        showNotification("Inventory item updated successfully!");
      } else {
        await api.inventory.createItem(itemForm);
        showNotification("Inventory item created successfully!");
      }
      setIsItemModalOpen(false);
      loadItems();
      loadSummary();
    } catch (err) {
      showNotification(err.message || "Failed to save item", true);
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;
    try {
      await api.inventory.deleteItem(id);
      showNotification(`Deleted "${name}"`);
      loadItems();
      loadSummary();
    } catch (err) {
      showNotification(err.message || "Failed to delete item", true);
    }
  };

  // Stock Action Handlers
  const handleOpenStockIn = (item) => {
    setSelectedItemForAction(item);
    setStockActionForm({ quantity: "", reason: "Stock Purchase / Restock", note: "" });
    setIsStockInOpen(true);
  };

  const handleOpenStockOut = (item) => {
    setSelectedItemForAction(item);
    setStockActionForm({ quantity: "", reason: "Kitchen Usage", note: "" });
    setIsStockOutOpen(true);
  };

  const handleOpenStockAdjust = (item) => {
    setSelectedItemForAction(item);
    setStockActionForm({ quantity: item.currentStock, reason: "Physical Stock Audit", note: "" });
    setIsStockAdjustOpen(true);
  };

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!stockActionForm.quantity || Number(stockActionForm.quantity) <= 0) {
      showNotification("Quantity must be greater than 0", true);
      return;
    }
    try {
      await api.inventory.stockIn(selectedItemForAction.id, {
        quantity: Number(stockActionForm.quantity),
        reason: stockActionForm.reason,
        note: stockActionForm.note,
      });
      showNotification(`Added +${stockActionForm.quantity} ${selectedItemForAction.unit} to ${selectedItemForAction.itemName}`);
      setIsStockInOpen(false);
      loadItems();
      loadSummary();
    } catch (err) {
      showNotification(err.message || "Stock In failed", true);
    }
  };

  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    if (!stockActionForm.quantity || Number(stockActionForm.quantity) <= 0) {
      showNotification("Quantity must be greater than 0", true);
      return;
    }
    try {
      await api.inventory.stockOut(selectedItemForAction.id, {
        quantity: Number(stockActionForm.quantity),
        reason: stockActionForm.reason,
        note: stockActionForm.note,
      });
      showNotification(`Removed -${stockActionForm.quantity} ${selectedItemForAction.unit} from ${selectedItemForAction.itemName}`);
      setIsStockOutOpen(false);
      loadItems();
      loadSummary();
    } catch (err) {
      showNotification(err.message || "Stock Out failed", true);
    }
  };

  const handleStockAdjustSubmit = async (e) => {
    e.preventDefault();
    if (stockActionForm.quantity === "" || Number(stockActionForm.quantity) < 0) {
      showNotification("Stock quantity cannot be negative", true);
      return;
    }
    try {
      await api.inventory.adjustStock(selectedItemForAction.id, {
        newQuantity: Number(stockActionForm.quantity),
        reason: stockActionForm.reason,
        note: stockActionForm.note,
      });
      showNotification(`Adjusted ${selectedItemForAction.itemName} stock to ${stockActionForm.quantity} ${selectedItemForAction.unit}`);
      setIsStockAdjustOpen(false);
      loadItems();
      loadSummary();
    } catch (err) {
      showNotification(err.message || "Stock adjustment failed", true);
    }
  };

  // View Item History Modal
  const handleViewItemHistory = async (item) => {
    setSelectedItemForAction(item);
    try {
      const res = await api.inventory.getItemHistory(item.id);
      const txList = res?.transactions || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      setItemHistoryList(txList);
      setIsItemHistoryModalOpen(true);
    } catch (err) {
      showNotification("Failed to load item history", true);
    }
  };

  // Create Category Handler
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.inventory.createCategory({ name: newCatName, description: newCatDesc });
      showNotification("Category added successfully!");
      setNewCatName("");
      setNewCatDesc("");
      loadCategoriesAndSuppliers();
    } catch (err) {
      showNotification(err.message || "Failed to add category", true);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await api.inventory.deleteCategory(id);
      showNotification("Category deleted!");
      loadCategoriesAndSuppliers();
    } catch (err) {
      showNotification(err.message || "Failed to delete category", true);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Inventory Management</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-orange-700 border border-orange-200">
              LIVE STOCK
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track ingredients, raw materials, stock transactions & automatic low-stock alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadSummary();
              loadItems();
            }}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-bold text-white shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 shadow-2xs animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("items");
            setSelectedStatus("");
            setPage(1);
          }}
          className={`text-left rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs relative overflow-hidden group hover:scale-[1.02] ${
            activeTab === "items" && selectedStatus === ""
              ? "bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
              : "bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Items</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{summary.totalItems}</div>
            {activeTab === "items" && selectedStatus === "" && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">All Active</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">All registered inventory items</div>
        </button>

        {/* In Stock */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("items");
            setSelectedStatus("in_stock");
            setPage(1);
          }}
          className={`text-left rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs relative overflow-hidden group hover:scale-[1.02] ${
            activeTab === "items" && selectedStatus === "in_stock"
              ? "bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
              : "bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">In Stock</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">{summary.inStockCount}</div>
            {activeTab === "items" && selectedStatus === "in_stock" && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Filtered</span>
            )}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Sufficient stock available</div>
        </button>

        {/* Low Stock */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("items");
            setSelectedStatus("low_stock");
            setPage(1);
          }}
          className={`text-left rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs relative overflow-hidden group hover:scale-[1.02] ${
            activeTab === "items" && selectedStatus === "low_stock"
              ? "bg-amber-50/40 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
              : "bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Low Stock</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-amber-600 tracking-tight">{summary.lowStockCount}</div>
            {activeTab === "items" && selectedStatus === "low_stock" && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Filtered</span>
            )}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">At or below minimum threshold</div>
        </button>

        {/* Out of Stock */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("items");
            setSelectedStatus("out_of_stock");
            setPage(1);
          }}
          className={`text-left rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs relative overflow-hidden group hover:scale-[1.02] ${
            activeTab === "items" && selectedStatus === "out_of_stock"
              ? "bg-rose-50/40 border-rose-500 ring-2 ring-rose-500/20 shadow-md"
              : "bg-white border-slate-200/90 hover:border-rose-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Out of Stock</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-rose-600 tracking-tight">{summary.outOfStockCount}</div>
            {activeTab === "items" && selectedStatus === "out_of_stock" && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Filtered</span>
            )}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Requires immediate restock</div>
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("items")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "items"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Inventory Stock</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Stock History</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "categories"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Categories & Suppliers</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY ITEMS */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search inventory by item name or description..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                <option value="">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>

              {/* Unit Filter */}
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                <option value="">All Units</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* INVENTORY TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Min Stock</th>
                    <th className="py-3 px-4">Purchase Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          <span>Loading inventory stock...</span>
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600">No inventory items found</p>
                        <p className="text-[11px] mt-0.5">Click "+ Add Inventory Item" above to get started</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const statusBadges = {
                        in_stock: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        low_stock: "bg-amber-50 text-amber-700 border-amber-200",
                        out_of_stock: "bg-rose-50 text-rose-700 border-rose-200",
                      };

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 text-sm">{item.itemName}</div>
                            {item.description && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                {item.description}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {item.categoryName || "Uncategorized"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-sm font-black text-slate-900">
                              {Number(item.currentStock).toLocaleString()}{" "}
                              <span className="text-xs font-bold text-slate-500">{item.unit}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-600">{item.unit}</td>

                          <td className="py-3.5 px-4 text-slate-500 font-semibold">
                            {Number(item.minimumStock).toLocaleString()} {item.unit}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            ₹{Number(item.purchasePrice || 0).toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                                statusBadges[item.status] || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.status === "in_stock" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              {item.status === "low_stock" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                              {item.status === "out_of_stock" && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                              <span>{item.status?.replace(/_/g, " ")}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Stock In Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenStockIn(item)}
                                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                                title="Add Stock (+)"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                                <span>In</span>
                              </button>

                              {/* Stock Out Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenStockOut(item)}
                                className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                                title="Remove Stock (-)"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Out</span>
                              </button>

                              {/* Stock Adjust */}
                              <button
                                type="button"
                                onClick={() => handleOpenStockAdjust(item)}
                                className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                                title="Adjust Stock"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Adjust</span>
                              </button>

                              {/* History */}
                              <button
                                type="button"
                                onClick={() => handleViewItemHistory(item)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                title="View Item History"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                title="Edit Item"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id, item.itemName)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STOCK TRANSACTION HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                placeholder="Search stock history by item name, reason or notes..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            <select
              value={historyFilterType}
              onChange={(e) => {
                setHistoryFilterType(e.target.value);
                setHistoryPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 w-full md:w-auto"
            >
              <option value="">All Transaction Types</option>
              <option value="STOCK_IN">STOCK_IN</option>
              <option value="STOCK_OUT">STOCK_OUT</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Stock Change</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        No transaction history logged yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((tx) => {
                      const typeColors = {
                        STOCK_IN: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        STOCK_OUT: "bg-rose-50 text-rose-700 border-rose-200",
                        ADJUSTMENT: "bg-amber-50 text-amber-700 border-amber-200",
                      };

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-bold text-slate-800">{tx.itemName}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${typeColors[tx.transactionType]}`}>
                              {tx.transactionType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {tx.transactionType === "STOCK_IN" ? "+" : tx.transactionType === "STOCK_OUT" ? "-" : ""}
                            {Number(tx.quantity).toLocaleString()} {tx.unit}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-semibold">
                            {Number(tx.previousStock).toLocaleString()} &rarr; {Number(tx.newStock).toLocaleString()} {tx.unit}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{tx.reason || "-"}</div>
                            {tx.note && <div className="text-[10px] text-slate-400">{tx.note}</div>}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{tx.createdBy || "Admin"}</td>
                          <td className="py-3 px-4 text-right text-slate-500 font-medium">
                            {new Date(tx.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {historyTotalPages > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Page {historyPage} of {historyTotalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage(historyPage - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={historyPage >= historyTotalPages}
                    onClick={() => setHistoryPage(historyPage + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES & SUPPLIERS */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories Manager */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>Inventory Categories</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-2.5">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category Name (e.g. Vegetables, Meat, Dairy)"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                required
              />
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                + Add Category
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {categories.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{c.name}</div>
                    {c.description && <div className="text-[10px] text-slate-400">{c.description}</div>}
                    <div className="text-[10px] text-orange-600 font-semibold mt-0.5">{c.itemCount || 0} items linked</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suppliers Directory */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Registered Suppliers</span>
            </h3>

            <div className="space-y-2">
              {suppliers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No suppliers registered yet.</p>
              ) : (
                suppliers.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-slate-800">{s.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Phone: {s.phone || "N/A"} • Email: {s.email || "N/A"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT INVENTORY ITEM */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {editingItem ? `Edit Item: ${editingItem.itemName}` : "Add New Inventory Item"}
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={itemForm.itemName}
                  onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                  placeholder="e.g. Chicken, Tawa Roti Flour, Amul Butter"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Measurement Unit *</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {!editingItem && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={itemForm.currentStock}
                      onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Stock Threshold</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={itemForm.minimumStock}
                    onChange={(e) => setItemForm({ ...itemForm, minimumStock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.purchasePrice}
                    onChange={(e) => setItemForm({ ...itemForm, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Optional details or storage specifications..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-md shadow-orange-500/20"
                >
                  {editingItem ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK IN (+)") */}
      {isStockInOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Stock In (+): {selectedItemForAction.itemName}</h3>
                <p className="text-[11px] text-slate-400">Current Stock: {selectedItemForAction.currentStock} {selectedItemForAction.unit}</p>
              </div>
              <button type="button" onClick={() => setIsStockInOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity to Add ({selectedItemForAction.unit}) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={stockActionForm.quantity}
                  onChange={(e) => setStockActionForm({ ...stockActionForm, quantity: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={stockActionForm.reason}
                  onChange={(e) => setStockActionForm({ ...stockActionForm, reason: e.target.value })}
                  placeholder="e.g. Vendor Purchase, Restock"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={stockActionForm.note}
                  onChange={(e) => setStockActionForm({ ...stockActionForm, note: e.target.value })}
                  placeholder="Invoice number or supplier details"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsStockInOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20">
                  Confirm Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STOCK OUT (-)") */}
      {isStockOutOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Stock Out (-): {selectedItemForAction.itemName}</h3>
                <p className="text-[11px] text-slate-400">Available Stock: {selectedItemForAction.currentStock} {selectedItemForAction.unit}</p>
              </div>
              <button type="button" onClick={() => setIsStockOutOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockOutSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity to Remove ({selectedItemForAction.unit}) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={selectedItemForAction.currentStock}
                  value={stockActionForm.quantity}
                  onChange={(e) => setStockActionForm({ ...stockActionForm, quantity: e.target.value })}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={stockActionForm.reason}
                  onChange={(e) => setStockActionForm({ ...stockActionForm, reason: e.target.value })}
                  placeholder="e.g. Kitchen Usage, Waste, Spoilage"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={stockActionForm.note}
                  onChange={(e) => setStockActionForm({ ...stockActionForm, note: e.target.value })}
                  placeholder="Details regarding stock consumption"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsStockOutOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20">
                  Confirm Stock Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: STOCK ADJUSTMENT */}
      {isStockAdjustOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Adjust Stock: {selectedItemForAction.itemName}</h3>
                <p className="text-[11px] text-slate-400">Previous Stock: {selectedItemForAction.currentStock} {selectedItemForAction.unit}</p>
              </div>
              <button type="button" onClick={() => setIsStockAdjustOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Total Stock Quantity ({selectedItemForAction.unit}) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={stockActionForm.quantity}
                  onChange={(e) => setStockActionForm({ ...stockActionForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  value={stockActionForm.reason}
                  onChange={(e) => setStockActionForm({ ...stockActionForm, reason: e.target.value })}
                  placeholder="e.g. Physical Stock Audit Count"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={stockActionForm.note}
                  onChange={(e) => setStockActionForm({ ...stockActionForm, note: e.target.value })}
                  placeholder="Explanation of adjustment discrepancy"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsStockAdjustOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20">
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: SINGLE ITEM HISTORY */}
      {isItemHistoryModalOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 space-y-4 animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Stock History: {selectedItemForAction.itemName}</h3>
                <p className="text-[11px] text-slate-400">Current Stock: {selectedItemForAction.currentStock} {selectedItemForAction.unit}</p>
              </div>
              <button type="button" onClick={() => setIsItemHistoryModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Transition</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {itemHistoryList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">No stock history recorded for this item.</td>
                    </tr>
                  ) : (
                    itemHistoryList.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            tx.transactionType === "STOCK_IN" ? "bg-emerald-50 text-emerald-700" : tx.transactionType === "STOCK_OUT" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {tx.transactionType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold">{Number(tx.quantity).toLocaleString()} {tx.unit}</td>
                        <td className="py-2.5 px-3 text-slate-600">{Number(tx.previousStock).toLocaleString()} &rarr; {Number(tx.newStock).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-slate-600">{tx.reason || "-"}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{tx.createdBy || "Admin"}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
