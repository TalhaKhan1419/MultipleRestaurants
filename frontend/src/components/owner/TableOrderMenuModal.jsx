import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "../../services/api";
import { triggerOrderAlertOnce } from "../../utils/orderAlertTracker";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Sparkles,
  ArrowRight,
  Flame,
  ChefHat,
  MessageSquare,
  Receipt,
  LayoutGrid,
} from "lucide-react";

export default function TableOrderMenuModal({
  isOpen,
  onClose,
  table = null,
  allTables = [],
  initialCustomerName = "",
  initialCustomerPhone = "",
  onOrderPlaced,
}) {
  const [menu, setMenu] = useState({ items: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Mobile View Tab state: 'menu' | 'kitchen' | 'summary'
  const [mobileTab, setMobileTab] = useState("menu");

  // Order Details State
  const [selectedTableId, setSelectedTableId] = useState(table ? table.id : "");
  const [orderType, setOrderType] = useState("dine_in");
  const [customerName, setCustomerName] = useState(initialCustomerName || "");
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone || "");
  const [orderNotes, setOrderNotes] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("unassigned");

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  // Active / Sent Kitchen Orders for selected table
  const [existingOrders, setExistingOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const isKotCompleted = useMemo(() => {
    if (existingOrders.length === 0) return false;
    return existingOrders.every((o) => o.kitchenStatus === "completed");
  }, [existingOrders]);

  // Cart: Map of menuItemId -> { item, quantity, notes }
  const [cart, setCart] = useState({});
  const [editingNotesItemId, setEditingNotesItemId] = useState(null);

  const prevIsOpenRef = useRef(false);
  const prevTableIdRef = useRef(table?.id);

  // Sync state ONLY when modal transitions from closed to open, or when a different table is selected
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const tableIdChanged = table?.id !== prevTableIdRef.current;

    if (justOpened || (isOpen && tableIdChanged)) {
      if (table) {
        setSelectedTableId(table.id);
        setCustomerName(initialCustomerName || "Guest");
      } else {
        setSelectedTableId(allTables[0]?.id || "");
        setCustomerName(initialCustomerName || "Guest");
      }
      setOrderType("dine_in");
      setCustomerPhone(initialCustomerPhone || "");
      setDiscountAmount(0);
      setCart({});
      setError(null);
      setOrderNotes("");
      setPaymentMethod("unassigned");
      setEditingNotesItemId(null);
      setMobileTab("menu");
    }

    prevIsOpenRef.current = isOpen;
    prevTableIdRef.current = table?.id;
  }, [isOpen, table?.id, initialCustomerName, initialCustomerPhone]);

  // Fetch active/sent orders for selected table
  useEffect(() => {
    if (!isOpen || !selectedTableId) {
      setExistingOrders([]);
      return;
    }
    let isMounted = true;
    const fetchActiveTableOrders = async () => {
      setLoadingOrders(true);
      try {
        const data = await api.owner.getOrders();
        if (isMounted && Array.isArray(data)) {
          const activeForTable = data.filter(
            (o) =>
              String(o.tableId) === String(selectedTableId) &&
              o.paymentStatus !== "paid" &&
              o.status !== "completed" &&
              o.status !== "cancelled"
          );
          setExistingOrders(activeForTable);
        }
      } catch (err) {
        console.warn("Failed to fetch existing table orders:", err);
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    };
    fetchActiveTableOrders();
  }, [isOpen, selectedTableId]);

  // Fetch Menu on open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchMenuData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.owner.getMenu();
        if (isMounted) {
          setMenu(data || { items: [], categories: [] });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load restaurant menu items");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMenuData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Current active table object
  const activeTableObj = useMemo(() => {
    if (table && table.id === selectedTableId) return table;
    return allTables.find((t) => String(t.id) === String(selectedTableId)) || table;
  }, [table, selectedTableId, allTables]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    const items = menu.items || [];
    return items.filter((item) => {
      const inCategory =
        selectedCategory === "all" ||
        (item.categories && item.categories.some((c) => String(c.id) === String(selectedCategory)));

      const matchesSearch =
        !searchTerm.trim() ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const isItemVeg =
        !item.name.toLowerCase().includes("chicken") &&
        !item.name.toLowerCase().includes("mutton") &&
        !item.name.toLowerCase().includes("fish") &&
        !item.name.toLowerCase().includes("egg") &&
        !item.name.toLowerCase().includes("meat");
      const matchesVeg = !vegOnly || isItemVeg;

      return inCategory && matchesSearch && matchesVeg;
    });
  }, [menu.items, selectedCategory, searchTerm, vegOnly]);

  // Cart operations
  const handleAddToCart = (item) => {
    setCart((prev) => {
      const current = prev[item.id]?.quantity || 0;
      const existingNotes = prev[item.id]?.notes || "";
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: current + 1,
          notes: existingNotes,
        },
      };
    });
  };

  const handleUpdateQuantity = (itemId, newQty) => {
    setCart((prev) => {
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQty,
        },
      };
    });
  };

  const handleUpdateItemNotes = (itemId, notes) => {
    setCart((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          notes,
        },
      };
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  // Pricing calculations
  const cartItemsList = useMemo(() => Object.values(cart), [cart]);

  const cartSubtotal = useMemo(() => {
    return cartItemsList.reduce(
      (sum, { item, quantity }) => sum + Number(item.price || 0) * quantity,
      0
    );
  }, [cartItemsList]);

  const sentItemsSubtotal = useMemo(() => {
    return existingOrders.reduce((sum, ord) => {
      const ordTotal = (ord.items || []).reduce((iSum, item) => {
        const price = Number(item.price || item.unitPrice || item.menuItem?.price || 0);
        const qty = Number(item.quantity || 1);
        return iSum + price * qty;
      }, 0);
      return sum + (ordTotal || Number(ord.totalAmount || 0));
    }, 0);
  }, [existingOrders]);

  const subtotal = useMemo(() => cartSubtotal + sentItemsSubtotal, [cartSubtotal, sentItemsSubtotal]);
  const discount = useMemo(() => Math.min(Number(discountAmount || 0), subtotal), [discountAmount, subtotal]);
  const taxableSubtotal = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);
  const taxAmount = useMemo(() => Number((taxableSubtotal * 0.05).toFixed(2)), [taxableSubtotal]);
  const grandTotal = useMemo(() => Number((taxableSubtotal + taxAmount).toFixed(2)), [taxableSubtotal, taxAmount]);
  const totalCartCount = useMemo(
    () => cartItemsList.reduce((sum, i) => sum + i.quantity, 0),
    [cartItemsList]
  );

  // Submit New Order / Items to Kitchen
  const handlePlaceOrder = async () => {
    if (cartItemsList.length === 0) {
      setError("Please add at least one menu item to the order.");
      return;
    }
    if (orderType === "dine_in" && !selectedTableId) {
      setError("Please select a dining table for dine-in orders.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const numericTableId = Number(selectedTableId);
      const validTableId =
        orderType === "dine_in" && selectedTableId && !isNaN(numericTableId) && numericTableId > 0
          ? numericTableId
          : null;

      const payload = {
        tableId: validTableId,
        customerName: customerName && customerName.trim() ? customerName.trim() : "Guest",
        customerPhone: customerPhone && customerPhone.trim() ? customerPhone.trim() : "0000000000",
        orderType,
        discountAmount: Number(discount),
        paymentMethod: paymentMethod || "unassigned",
        notes: orderNotes ? orderNotes.trim() : null,
        items: cartItemsList.map(({ item, quantity, notes }) => ({
          menuItemId: Number(item.id),
          quantity: Number(quantity),
          notes: notes ? notes.trim() : null,
        })),
      };

      const result = await api.owner.createOrder(payload);

      try {
        localStorage.setItem("last_pos_order_data", JSON.stringify(result));
        localStorage.setItem("last_pos_order_ts", String(Date.now()));
        const bc = new BroadcastChannel("pos_orders");
        bc.postMessage({ type: "NEW_ORDER", order: result });
        bc.close();
      } catch (e) {}

      if (onOrderPlaced) {
        onOrderPlaced(result);
      }
      onClose();
    } catch (err) {
      console.error("Order creation error:", err);
      setError(err.message || "Failed to create table order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Complete Order & Settle Payment for Table
  const handleCompleteAndSettleOrder = async () => {
    if (existingOrders.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      for (const ord of existingOrders) {
        await api.owner.updatePaymentStatus(ord.id, "paid", paymentMethod === "unassigned" ? "cash" : paymentMethod);
        await api.owner.updateOrderStatus(ord.id, "completed");
      }
      if (onOrderPlaced) {
        onOrderPlaced();
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to settle order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 w-full h-full flex flex-col overflow-hidden animate-fadeIn">
      <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50 relative">
        {/* Top Header Bar (Responsive) */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 bg-white shadow-2xs flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-base font-bold text-slate-800 tracking-tight truncate">
                  {table?.roomNumber
                    ? `Room Service — Room ${table.roomNumber}`
                    : orderType === "dine_in"
                    ? `Take Order — Table ${activeTableObj?.tableNumber || selectedTableId || "POS"}`
                    : "Takeaway / Parcel"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                  {orderType === "dine_in" ? "Dine-In POS" : "Takeaway"}
                </span>
                {orderType === "dine_in" && activeTableObj?.capacity && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{activeTableObj.capacity} Seats</span>
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-xs text-slate-500 font-medium mt-0.5 truncate">
                Full Screen POS Terminal — Select dishes, add customer details, and send ticket to KOT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-[11px] sm:text-xs flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer shrink-0"
            title="Exit Full Screen POS"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Exit POS</span>
          </button>
        </div>

        {/* Mobile Sub-Navigation Bar (< lg screens) */}
        <div className="lg:hidden bg-slate-100 border-b border-slate-200 p-1 flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("menu")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === "menu"
                ? "bg-white text-orange-600 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Dishes</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("kitchen")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              mobileTab === "kitchen"
                ? "bg-white text-rose-600 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen (KOT)</span>
            {(existingOrders.length > 0 || cartItemsList.length > 0) && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {existingOrders.length + (cartItemsList.length > 0 ? 1 : 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("summary")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              mobileTab === "summary"
                ? "bg-white text-orange-600 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Order & Pay</span>
            {totalCartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="mx-3 sm:mx-6 mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between shadow-2xs shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* SECTION 1: Menu Browsing (Dishes & Categories) */}
          <div
            className={`flex-1 flex flex-col lg:flex-row border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden bg-[#f8fafc] ${
              mobileTab === "menu" ? "flex" : "hidden lg:flex"
            }`}
          >
            {/* Left Category Sidebar (Desktop Vertical / Mobile Horizontal Scrolling Pills) */}
            {/* Desktop Vertical Sidebar */}
            <div className="hidden lg:flex w-36 sm:w-40 md:w-44 bg-white border-r border-slate-200/90 overflow-y-auto shrink-0 flex-col p-2 space-y-1 shadow-2xs">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1 mb-0.5">
                Categories
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedCategory === "all"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">All Items</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {menu.items?.length || 0}
                </span>
              </button>

              {(menu.categories || []).map((cat) => {
                const isCatActive = String(selectedCategory) === String(cat.id);
                const count = (menu.items || []).filter((i) => i.categoryId === cat.id || (i.categories && i.categories.some(c => c.id === cat.id))).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                      isCatActive
                        ? "bg-orange-500 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isCatActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Horizontal Category Pills Bar */}
            <div className="lg:hidden bg-white border-b border-slate-200 px-2 py-1.5 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-orange-500 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Items ({menu.items?.length || 0})
              </button>
              {(menu.categories || []).map((cat) => {
                const isCatActive = String(selectedCategory) === String(cat.id);
                const count = (menu.items || []).filter((i) => i.categoryId === cat.id || (i.categories && i.categories.some(c => c.id === cat.id))).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isCatActive
                        ? "bg-orange-500 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {cat.name} {count > 0 ? `(${count})` : ""}
                  </button>
                );
              })}
            </div>

            {/* Right Menu Content (Filter Bar + Compact Dish Grid) */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Filter Bar: Search, Table Picker, Veg Filter */}
              <div className="p-2.5 sm:p-3 bg-white border-b border-slate-200/80 shrink-0">
                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search dishes..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Table Picker if Dine-In */}
                  {orderType === "dine_in" && allTables.length > 1 && !table && (
                    <div className="w-32 sm:w-40 shrink-0">
                      <select
                        value={selectedTableId}
                        onChange={(e) => setSelectedTableId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-500"
                      >
                        {allTables.map((tbl) => (
                          <option key={tbl.id} value={tbl.id}>
                            Table {tbl.tableNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Veg Filter Toggle */}
                  <button
                    type="button"
                    onClick={() => setVegOnly(!vegOnly)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all cursor-pointer shrink-0 ${
                      vegOnly
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${vegOnly ? "bg-white" : "bg-emerald-500"}`} />
                    <span className="hidden sm:inline">Veg Only</span>
                  </button>
                </div>
              </div>

              {/* Menu Cards Grid */}
              <div className="flex-1 overflow-y-auto p-2.5 sm:p-3">
                {isKotCompleted && (
                  <div className="mb-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>KOT Completed — Bill & Payment enabled.</span>
                  </div>
                )}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Loading menu...</span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs font-medium space-y-2">
                    <ChefHat className="w-10 h-10 mx-auto text-slate-300" />
                    <div>No menu items found matching this filter.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 pb-16 lg:pb-0">
                    {filteredItems.map((dish) => {
                      const cartEntry = cart[dish.id];
                      const inCartCount = cartEntry ? cartEntry.quantity : 0;
                      const isAvailable = dish.isAvailable !== false && dish.isAvailable !== 0 && dish.isAvailable !== "0" && dish.isAvailable !== "false";
                      const isVeg =
                        !dish.name.toLowerCase().includes("chicken") &&
                        !dish.name.toLowerCase().includes("mutton") &&
                        !dish.name.toLowerCase().includes("fish") &&
                        !dish.name.toLowerCase().includes("egg") &&
                        !dish.name.toLowerCase().includes("meat");

                      return (
                        <div
                          key={dish.id}
                          className={`bg-white rounded-xl p-2 border transition-all flex flex-col justify-between shadow-2xs group relative text-center ${
                            inCartCount > 0
                              ? "border-orange-500 ring-2 ring-orange-100 bg-orange-50/20"
                              : "border-slate-200 hover:border-orange-300"
                          } ${!isAvailable || isKotCompleted ? "opacity-70 bg-slate-50" : ""}`}
                        >
                          <div>
                            {/* Food Icon / Image */}
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-orange-100 to-amber-50 border border-orange-200/70 flex items-center justify-center shrink-0 overflow-hidden mx-auto mb-1 shadow-2xs">
                              {dish.imageUrl ? (
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                              )}
                            </div>

                            {/* Veg/Nonveg Dot Badge */}
                            <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${isVeg ? "bg-emerald-500" : "bg-rose-500"}`} title={isVeg ? "Veg" : "Non-Veg"} />

                            {/* Dish Name & Price */}
                            <h4 className="text-[11px] font-bold text-slate-800 leading-tight truncate mb-0.5" title={dish.name}>
                              {dish.name}
                            </h4>
                            <div className="text-xs font-black text-orange-600 mb-1.5">
                              ₹{Number(dish.price).toFixed(2)}
                            </div>
                          </div>

                          {/* Quick Add Button / Counter */}
                          <div>
                            {isKotCompleted ? (
                              <div className="text-[10px] font-bold text-emerald-700 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md">
                                Completed
                              </div>
                            ) : !isAvailable ? (
                              <div className="text-[10px] font-bold text-slate-400 py-0.5 bg-slate-100 rounded-md">
                                Sold Out
                              </div>
                            ) : inCartCount === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(dish)}
                                className="w-full py-1 rounded-lg bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 hover:border-orange-500 text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(dish.id, inCartCount - 1)}
                                  className="w-5 h-5 rounded-md bg-white text-orange-600 hover:bg-orange-100 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="text-[11px] font-extrabold text-orange-700 min-w-[14px] text-center">
                                  {inCartCount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(dish)}
                                  className="w-5 h-5 rounded-md bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Floating Bottom Bar for Fast Order Checkout */}
              {totalCartCount > 0 && (
                <div className="lg:hidden absolute bottom-2 left-2 right-2 bg-orange-500 text-white p-2.5 rounded-2xl shadow-xl flex items-center justify-between z-10 border border-orange-400 animate-slideUp">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/20 text-white font-black text-xs flex items-center justify-center">
                      {totalCartCount}
                    </span>
                    <div>
                      <div className="text-xs font-extrabold leading-none">₹{cartSubtotal.toFixed(2)}</div>
                      <div className="text-[10px] text-orange-100 font-medium mt-0.5">Selected Items</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileTab("summary")}
                    className="px-3 py-1.5 rounded-xl bg-white text-orange-600 font-extrabold text-xs flex items-center gap-1 shadow-2xs cursor-pointer hover:bg-orange-50"
                  >
                    <span>View Summary & Pay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2 & 3: Right Columns Container (Desktop Side-by-Side / Mobile Tab Views) */}
          <div className="flex flex-col lg:flex-row border-t lg:border-t-0 lg:border-l border-slate-200 shrink-0 bg-white overflow-hidden flex-1 lg:flex-none">
            
            {/* COLUMN 1: "Sending to the kitchen" */}
            <div
              className={`w-full lg:w-[260px] xl:w-[280px] border-r border-slate-200 flex-col justify-between bg-slate-50/30 overflow-hidden shrink-0 ${
                mobileTab === "kitchen" ? "flex flex-1 lg:flex-none" : "hidden lg:flex"
              }`}
            >
              {/* Header */}
              <div className="p-3 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 tracking-tight">Sending to the kitchen</h3>
                {(existingOrders.length > 0 || cartItemsList.length > 0) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    {existingOrders.length + (cartItemsList.length > 0 ? 1 : 0)} Ticket(s)
                  </span>
                )}
              </div>

              {/* Scrollable Items in Column 1 */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-300">
                {existingOrders.length === 0 && cartItemsList.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs space-y-1">
                    <ChefHat className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-[11px]">No items sent yet</p>
                  </div>
                ) : (
                  <>
                    {/* Existing Saved KOT Orders */}
                    {existingOrders.map((ord, idx) => (
                      <div key={ord.id || idx} className="bg-white rounded-xl p-2.5 border-l-4 border-rose-500 border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1">
                          <span className="text-rose-600 font-black">#{idx + 1} Ticket #{ord.id}</span>
                          <span>{ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '05:21 PM'}</span>
                        </div>

                        <div className="space-y-1.5">
                          {(ord.items || []).map((item, iIdx) => {
                            const name = item.itemName || item.name || item.menuItem?.name || "Dish Item";
                            const qty = item.quantity || 1;
                            const price = Number(item.price || item.unitPrice || item.menuItem?.price || 0);
                            return (
                              <div key={iIdx} className="flex items-start justify-between text-xs">
                                <div className="flex items-start gap-1.5 flex-1 min-w-0 pr-1">
                                  <span className="font-black text-slate-900 shrink-0">{qty}</span>
                                  <span className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-2">{name}</span>
                                </div>
                                <span className="font-black text-slate-900 shrink-0 text-xs">₹{(price * qty).toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Newly Added Cart Dishes */}
                    {cartItemsList.length > 0 && (
                      <div className="bg-white rounded-xl p-2.5 border-l-4 border-orange-500 border border-orange-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-orange-600 border-b border-orange-100 pb-1">
                          <span className="font-black">#{existingOrders.length + 1} (New Dishes)</span>
                          <button type="button" onClick={() => setCart({})} className="text-[9px] text-rose-600 hover:underline">Clear</button>
                        </div>

                        <div className="space-y-2">
                          {cartItemsList.map(({ item, quantity, notes }) => (
                            <div key={item.id} className="space-y-1 border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                              <div className="flex items-start justify-between text-xs">
                                <div className="flex items-start gap-1.5 flex-1 min-w-0 pr-1">
                                  <span className="font-black text-orange-600 shrink-0">{quantity}</span>
                                  <span className="font-bold text-slate-800 text-[11px] leading-tight truncate">{item.name}</span>
                                </div>
                                <span className="font-black text-slate-900 shrink-0 text-xs">₹{(Number(item.price) * quantity).toFixed(2)}</span>
                              </div>

                              {/* Item Quantity Controls */}
                              <div className="flex items-center justify-between pt-0.5">
                                <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-md p-0.5">
                                  <button type="button" onClick={() => handleUpdateQuantity(item.id, quantity - 1)} className="w-4 h-4 rounded text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                  <span className="text-[10px] font-extrabold min-w-[12px] text-center">{quantity}</span>
                                  <button type="button" onClick={() => handleAddToCart(item)} className="w-4 h-4 rounded bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">
                                    <Plus className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                <button type="button" onClick={() => handleRemoveFromCart(item.id)} className="text-slate-400 hover:text-rose-600 p-0.5">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* COLUMN 2: "Summary" */}
            <div
              className={`w-full lg:w-[250px] xl:w-[270px] flex-col justify-between bg-white overflow-hidden shrink-0 ${
                mobileTab === "summary" ? "flex flex-1 lg:flex-none" : "hidden lg:flex"
              }`}
            >
              {/* Header */}
              <div className="p-3 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 tracking-tight">Summary</h3>
                <span className="text-[10px] font-bold text-slate-400">₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Middle Area: Order Items / Watermark Empty Order */}
              <div className="flex-1 overflow-y-auto p-2.5 flex flex-col items-center justify-center">
                {cartItemsList.length === 0 && existingOrders.length === 0 ? (
                  <div className="py-16 text-center text-slate-300 text-xs font-bold uppercase tracking-wider">
                    Empty order
                  </div>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Selected Items ({totalCartCount + existingOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0)})
                    </div>
                    {cartItemsList.map(({ item, quantity }) => (
                      <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                        <span className="font-semibold text-slate-700 truncate">{item.name} x {quantity}</span>
                        <span className="font-bold text-slate-900">₹{(Number(item.price) * quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Tax Breakdown & Action Buttons */}
              <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2 shrink-0">
                {/* Tax Toggles */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">GST Mode</label>
                  <div className="grid grid-cols-3 gap-1">
                    <button type="button" className="py-1 rounded text-[10px] font-bold bg-white text-slate-600 border border-slate-200">Off</button>
                    <button type="button" className="py-1 rounded text-[10px] font-bold bg-orange-500 text-white shadow-2xs">Exclusive (5%)</button>
                    <button type="button" className="py-1 rounded text-[10px] font-bold bg-white text-slate-600 border border-slate-200">Inclusive</button>
                  </div>
                </div>

                {/* Net, Tax, Grand Total */}
                <div className="space-y-1 text-[10px] pt-1 border-t border-slate-200/80">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>NET AMOUNT</span>
                    <span className="font-bold text-slate-800">₹{taxableSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>CGST 2.5%</span>
                    <span className="font-bold text-slate-800">₹{(taxAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>SGST 2.5%</span>
                    <span className="font-bold text-slate-800">₹{(taxAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>TOTAL</span>
                    <span className="text-orange-600 text-base font-black">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-1 space-y-1">
                  {cartItemsList.length > 0 ? (
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={submitting || isKotCompleted}
                      className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <span>SEND TO KITCHEN</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : isKotCompleted ? (
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={handleCompleteAndSettleOrder}
                        disabled={submitting || existingOrders.length === 0}
                        className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] disabled:opacity-40 cursor-pointer"
                      >
                        RECEIVE PAYMENT
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[10px] cursor-pointer"
                      >
                        PAY LATER
                      </button>
                    </div>
                  ) : existingOrders.length > 0 ? (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold text-center">
                      Complete KOT in KOT Manager to enable Bill & Pay
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                    >
                      Close Menu
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
