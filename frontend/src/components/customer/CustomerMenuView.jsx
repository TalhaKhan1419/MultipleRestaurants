import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { api } from "../../services/api";
import {
  UtensilsCrossed,
  ShoppingBag,
  Plus,
  Minus,
  ArrowLeft,
  Search,
  Sparkles,
  Phone,
  User,
  X,
  Receipt,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  Trash2,
  Maximize2,
  MessageSquare,
  AlertCircle,
  ClipboardList,
  ChevronRight,
  Clock,
  Flame,
  CheckCircle2,
  XCircle,
  Banknote,
  CreditCard,
  Smartphone,
  QrCode,
  MoreHorizontal,
  Grid,
  ChevronDown,
  Bed,
} from "lucide-react";

export default function CustomerMenuView({ qrToken, onClose }) {
  const [menuData, setMenuData] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState("tables"); // 'tables' | 'rooms'
  const [tableStatusFilter, setTableStatusFilter] = useState("available"); // 'available' | 'all' | 'occupied'
  // Current view step: 'menu' | 'order_success' | 'my_orders'
  const [currentStep, setCurrentStep] = useState("menu");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Menu Filter State
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);

  // Cart State
  const [cart, setCart] = useState({}); // { itemId: { item, quantity } }
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [previewDish, setPreviewDish] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // My Orders State — tracked locally via localStorage
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [billRequestingId, setBillRequestingId] = useState(null);
  const [billPaymentOrder, setBillPaymentOrder] = useState(null);
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState("cash");
  const [availableTablesList, setAvailableTablesList] = useState(null);
  const pollIntervalRef = useRef(null);

  const fetchAvailableTables = useCallback(async (tokenToUse) => {
    try {
      const rawToken = tokenToUse || qrToken;
      const validToken = (!rawToken || rawToken === "undefined" || rawToken === "null") ? "default" : rawToken;
      const data = await api.public.getAvailableTables(validToken);
      if (Array.isArray(data)) {
        setAvailableTablesList(data);
      }
    } catch (err) {
      console.error("Failed to fetch available tables:", err);
    }
  }, [qrToken]);

  const availableTables = useMemo(() => {
    if (availableTablesList !== null && availableTablesList.length > 0) {
      return availableTablesList.filter((t) => (t.status || "").toLowerCase() === "available");
    }
    return menuData?.tables?.filter((t) => (t.status || "").toLowerCase() === "available") || [];
  }, [availableTablesList, menuData]);

  const availableRooms = useMemo(() => {
    return menuData?.rooms?.filter((r) => (r.status || "").toLowerCase() === "available") || [];
  }, [menuData]);

  useEffect(() => {
    fetchMenuData(qrToken);
  }, [qrToken]);

  const fetchMenuData = async (tokenToUse) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.public.getMenu(tokenToUse);
      setMenuData(data);
      await fetchAvailableTables(tokenToUse);

      // Match table from token or direct table info
      const matched =
        data?.tables?.find((t) => t.qrToken === tokenToUse) ||
        (data?.tableNumber
          ? {
              tableId: data.tableId || data.id,
              tableNumber: data.tableNumber,
              capacity: data.capacity || 4,
              status: data.status || "available",
              qrToken: data.qrToken || tokenToUse,
            }
          : null);

      // Check URL search params for Room QR scan (e.g. ?roomId=1&roomNumber=101)
      const urlParams = new URLSearchParams(window.location.search);
      const paramRoomId = urlParams.get("roomId") || urlParams.get("room_id");
      const paramRoomNum = urlParams.get("roomNumber") || urlParams.get("room_number");

      if (paramRoomId || paramRoomNum) {
        const matchedRoom = data?.rooms?.find(
          (r) => String(r.roomId || r.id) === String(paramRoomId) || String(r.roomNumber) === String(paramRoomNum)
        );
        setSelectedTable({
          roomId: matchedRoom?.roomId || (paramRoomId ? Number(paramRoomId) : null),
          tableId: null,
          tableNumber: `Room ${paramRoomNum || matchedRoom?.roomNumber || paramRoomId}`,
          roomNumber: paramRoomNum || matchedRoom?.roomNumber || paramRoomId,
          isRoom: true,
          capacity: matchedRoom?.capacity || 2,
          status: matchedRoom?.status || "available",
        });
        setCurrentStep("menu");
      } else if (matched && (matched.status || "").toLowerCase() === "available") {
        setSelectedTable({
          tableId: matched.tableId || matched.id,
          tableNumber: matched.tableNumber,
          capacity: matched.capacity || 4,
          status: matched.status || "available",
          qrToken: matched.qrToken || tokenToUse,
        });
        setCurrentStep("menu");
      } else if (!matched || (matched.status || "").toLowerCase() !== "available" || data?.isGenericAccess || tokenToUse === "default" || tokenToUse === "menu") {
        setCurrentStep("select_table");
      } else {
        setCurrentStep("menu");
      }
    } catch (err) {
      setError(err.message || "Failed to load digital restaurant menu.");
    } finally {
      setLoading(false);
    }
  };


  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: existing ? existing.quantity + 1 : 1,
        },
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const totalCartCount = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = Object.values(cart).reduce(
    (sum, i) => sum + Number(i.item.price) * i.quantity,
    0
  );
  const taxAmount = Number((cartSubtotal * 0.05).toFixed(2));
  const grandTotal = Number((cartSubtotal + taxAmount).toFixed(2));

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (totalCartCount === 0) return;

    const isRoomOrder = selectedTable?.isRoom || !!selectedTable?.roomId;

    if (!selectedTable?.tableId && !isRoomOrder) {
      setCurrentStep("select_table");
      alert("Kripya order submit karne se pehle apni Table ya Room select karein!");
      return;
    }

    const trimmedPhone = customerPhone.trim();
    if (trimmedPhone && !/^\d{7,15}$/.test(trimmedPhone)) {
      alert("Kripya valid phone number enter karein (7 to 15 digits)");
      return;
    }

    setOrderSubmitting(true);

    try {
      const tokenToSend = selectedTable?.qrToken || qrToken;
      const isTakeaway = !selectedTable?.tableId && !isRoomOrder;

      const payload = {
        qrToken: tokenToSend,
        tableId: selectedTable?.tableId || null,
        roomId: selectedTable?.roomId || null,
        roomNumber: selectedTable?.roomNumber || null,
        customerName: customerName.trim() || (isRoomOrder ? `Room Guest` : "Guest"),
        customerPhone: trimmedPhone || "0000000000",
        orderType: isRoomOrder ? "in_room" : isTakeaway ? "takeaway" : "dine_in",
        notes: isRoomOrder
          ? `In-Room Order (${selectedTable?.tableNumber || `Room ${selectedTable?.roomNumber}`})${orderNotes.trim() ? ` - ${orderNotes.trim()}` : ""}`
          : orderNotes.trim(),
        items: Object.values(cart).map(({ item, quantity }) => ({
          menuItemId: item.id,
          quantity,
        })),
      };

      const result = await api.public.placeOrder(payload);

      setOrderSuccess(result);
      setCart({});
      setIsCartOpen(false);
      setCurrentStep("order_success");

      // Keep only orders placed during this open QR menu visit. A table QR is
      // shared, so a later guest must not see another guest's order history.
      const newEntry = {
        id: result.id,
        orderNumber: result.orderNumber,
        qrToken: tokenToSend,
        status: result.status || "pending",
        totalAmount: result.totalAmount,
        items: result.items || [],
        tableNumber: selectedTable?.tableNumber,
        placedAt: new Date().toISOString(),
      };
      setMyOrders((existing) => [newEntry, ...existing.filter((order) => order.id !== result.id)].slice(0, 10));

      // Broadcast order to active admin tabs in real-time
      try {
        const bc = new BroadcastChannel("pos_orders");
        bc.postMessage({ type: "NEW_ORDER", order: result });
        bc.close();
      } catch (e) {}
      try {
        localStorage.setItem("last_pos_order_ts", Date.now().toString());
        localStorage.setItem("last_pos_order_data", JSON.stringify(result));
      } catch (e) {}

      // Refresh menu data in background
      fetchMenuData(tokenToSend);
    } catch (err) {
      alert(err.message || "Failed to place order. Please check with restaurant staff.");
      if (err.message && err.message.toLowerCase().includes("occupied")) {
        fetchMenuData(tokenToSend);
        setCurrentStep("select_table");
      }
    } finally {
      setOrderSubmitting(false);
    }

  };

  // Poll order statuses when on my_orders step
  const refreshMyOrders = useCallback(async () => {
    const tokenToUse = selectedTable?.qrToken || qrToken;
    if (!tokenToUse || myOrders.length === 0) return;
    try {
      const updated = await Promise.all(
        myOrders.map(async (o) => {
          try {
            const fresh = await api.public.getOrderStatus(o.id, tokenToUse);
            return { ...o, ...fresh, qrToken: tokenToUse };
          } catch (_) {
            return o;
          }
        })
      );
      setMyOrders(updated);
    } catch (_) {}
  }, [myOrders, qrToken, selectedTable]);

  const handleRequestBill = async (order, paymentMethod) => {
    const tokenToUse = selectedTable?.qrToken || qrToken;
    if (!tokenToUse) return;
    setBillRequestingId(order.id);
    try {
      await api.public.requestBill(order.id, tokenToUse, paymentMethod);
      const updatedOrder = await api.public.confirmPayment(order.id, tokenToUse, paymentMethod);
      const updatedOrders = myOrders.map((item) => item.id === order.id ? { ...item, ...updatedOrder } : item);
      setMyOrders(updatedOrders);
      return true;
    } catch (err) {
      alert(err.message || "Could not request the bill. Please ask the restaurant staff.");
      return false;
    } finally {
      setBillRequestingId(null);
    }
  };

  useEffect(() => {
    if (currentStep !== "my_orders") {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }
    // Initial load
    setOrdersLoading(true);
    refreshMyOrders().finally(() => setOrdersLoading(false));
    // Poll every 8 seconds
    pollIntervalRef.current = setInterval(refreshMyOrders, 8000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [currentStep]); // eslint-disable-line

  // Status display helper
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-300", icon: Clock, step: 0 };
      case "confirmed":
        return { label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle2, step: 1 };
      case "preparing":
        return { label: "Preparing", color: "bg-orange-100 text-orange-800 border-orange-300", icon: Flame, step: 2 };
      case "ready":
        return { label: "Ready to Serve!", color: "bg-green-100 text-green-800 border-green-300", icon: UtensilsCrossed, step: 3 };
      case "completed":
        return { label: "Completed", color: "bg-slate-100 text-slate-700 border-slate-300", icon: CheckCircle, step: 4 };
      case "cancelled":
        return { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle, step: -1 };
      default:
        return { label: status, color: "bg-slate-100 text-slate-700 border-slate-300", icon: Clock, step: 0 };
    }
  };

  // Helper to determine category icon / emoji
  const getCategoryIcon = (catName = "") => {
    const lower = catName.toLowerCase();
    if (lower.includes("starter") || lower.includes("appetizer") || lower.includes("snack")) return "🍲";
    if (lower.includes("main") || lower.includes("curry") || lower.includes("course")) return "🍛";
    if (lower.includes("biryani") || lower.includes("rice") || lower.includes("pulao")) return "🍚";
    if (lower.includes("drink") || lower.includes("beverage") || lower.includes("shake") || lower.includes("juice")) return "🥤";
    if (lower.includes("dessert") || lower.includes("sweet") || lower.includes("ice cream") || lower.includes("kheer")) return "🍰";
    if (lower.includes("non-veg") || lower.includes("meat") || lower.includes("chicken") || lower.includes("kebab")) return "🍗";
    if (lower.includes("bread") || lower.includes("naan") || lower.includes("roti")) return "🫓";
    if (lower.includes("pizza") || lower.includes("burger") || lower.includes("fast")) return "🍕";
    return "🍽️";
  };

  // Helper to determine if dish is veg or non-veg
  const isDishVeg = (item) => {
    const name = (item.name + " " + (item.description || "")).toLowerCase();
    const categories = (item.categories || []).map((c) => c.name.toLowerCase()).join(" ");
    if (
      name.includes("chicken") ||
      name.includes("meat") ||
      name.includes("mutton") ||
      name.includes("beef") ||
      name.includes("fish") ||
      name.includes("prawn") ||
      name.includes("kebab") ||
      categories.includes("non-veg")
    ) {
      return false;
    }
    return true;
  };

  // Cloudinary high-definition auto optimizer
  const getCleanImageUrl = (url, width = 800) => {
    if (!url) return null;
    if (typeof url !== "string") return null;
    if (url.includes("cloudinary.com") && url.includes("/upload/")) {
      if (!url.includes("/upload/f_auto,q_auto")) {
        return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
      }
    }
    return url;
  };

  // Quick Chef Request Chips
  const quickRequestChips = [
    "🌶️ Extra Spicy",
    "🍃 Less Spicy / Mild",
    "🧅 No Onion / Garlic",
    "🍲 Extra Gravy / Chutney",
    "🍴 Add Cutlery & Tissues",
  ];

  const handleAddNoteChip = (chip) => {
    setOrderNotes((prev) => {
      if (!prev || !prev.trim()) return chip;
      if (prev.includes(chip)) return prev;
      return `${prev.trim()}, ${chip}`;
    });
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your order cart?")) {
      setCart({});
    }
  };

  // Filtered categories and items
  const categoriesList = menuData?.categories || [];

  const displayCategories = useMemo(() => {
    return categoriesList.map((cat) => {
      const items = (cat.items || []).filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const isVeg = isDishVeg(item);
        const matchesVeg = vegOnlyFilter ? isVeg : true;
        return matchesSearch && matchesVeg;
      });
      return { ...cat, items };
    });
  }, [categoriesList, searchTerm, vegOnlyFilter]);

  const allItemsList = useMemo(() => {
    const itemMap = new Map();
    (categoriesList || []).forEach((cat) => {
      (cat.items || []).forEach((item) => {
        if (!itemMap.has(item.id)) {
          itemMap.set(item.id, {
            ...item,
            categoryName: cat.name,
          });
        }
      });
    });
    return Array.from(itemMap.values());
  }, [categoriesList]);

  const filteredAllItems = useMemo(() => {
    return allItemsList.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const isVeg = isDishVeg(item);
      const matchesVeg = vegOnlyFilter ? isVeg : true;
      return matchesSearch && matchesVeg;
    });
  }, [allItemsList, searchTerm, vegOnlyFilter]);

  const displayedDishes = useMemo(() => {
    if (activeCategoryId === "all") {
      return displayCategories;
    }
    const singleCat = displayCategories.find((c) => c.id.toString() === activeCategoryId);
    return singleCat ? [singleCat] : [];
  }, [displayCategories, activeCategoryId]);

  // Loading Screen
  if (loading && !menuData) {
    return (
      <div className="min-h-screen bg-[#fffaf0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#7c5e48] font-medium tracking-wide">
            Loading restaurant digital menu...
          </span>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error && !menuData) {
    return (
      <main className="min-h-screen bg-[#fffaf0] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-white border border-rose-200 p-6 text-center shadow-lg">
          <AlertCircle className="w-10 h-10 mx-auto text-rose-500 mb-3" />
          <h1 className="font-bold text-lg text-[#3b2618]">Menu Currently Unavailable</h1>
          <p className="text-xs text-[#7c5e48] mt-2">{error}</p>
          <button
            type="button"
            onClick={() => fetchMenuData(qrToken)}
            className="mt-5 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/30 hover:bg-orange-600 transition-all cursor-pointer"
          >
            Try Refreshing
          </button>
        </div>
      </main>
    );
  }

  if (currentStep === "select_table") {
    return (
      <div className="min-h-screen bg-[#eef2f6] text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center py-6">
          {/* Header / Brand Branding */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/20 flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {menuData?.restaurantName || "Gourmet Restaurant"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-md mx-auto">
              Select an available dining table below to view menu & place your order
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mt-3 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{availableTables.length} Available Table{availableTables.length !== 1 ? "s" : ""} Ready</span>
            </div>
          </div>

          {/* Available Tables Grid */}
          {availableTables.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto border border-slate-200 shadow-sm">
              <Grid className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-80" />
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No Tables Available Right Now
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                All tables are currently occupied. Please ask our restaurant staff or manager for assistance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto w-full">
              {availableTables.map((tbl) => {
                const itemId = tbl.tableId || tbl.id;
                const isSelected = selectedTable?.tableId === itemId;

                return (
                  <button
                    key={itemId}
                    type="button"
                    onClick={() => {
                      setSelectedTable({
                        tableId: itemId,
                        tableNumber: tbl.tableNumber,
                        capacity: tbl.capacity || 4,
                        status: tbl.status || "available",
                        qrToken: tbl.qrToken,
                      });
                      setCurrentStep("menu");
                    }}
                    className={`group relative p-5 sm:p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/80 ring-4 ring-orange-500/15 shadow-md"
                        : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 hover:shadow-md"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Table
                    </span>
                    <span className="text-3xl font-black text-slate-800 tracking-tight group-hover:text-orange-600 transition-colors">
                      {tbl.tableNumber}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mt-2.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Available
                    </span>

                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center py-3 text-slate-400 text-xs font-semibold">
          GourmetOS POS • Digital Table Ordering System
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf0] text-[#3b2618] flex flex-col justify-between font-sans selection:bg-orange-500 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER: RESTAURANT NAME & TABLE (VIBRANT ORANGE NAVBAR)
         ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-md shadow-orange-950/15 border-b border-orange-600">
        <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Left: Restaurant Name & Table */}
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-black/15 hover:bg-black/25 text-white transition-colors cursor-pointer border border-white/20"
                title="Return"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-white text-orange-600 shadow-md flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg text-white tracking-tight leading-tight drop-shadow-xs">
                {menuData?.restaurantName || "Gourmet Restaurant"}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    fetchAvailableTables();
                    setCurrentStep("select_table");
                  }}
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Click to select or change table"
                >
                  <Grid className="w-3 h-3 text-orange-200" />
                  <span>{selectedTable?.tableNumber ? `Table ${selectedTable.tableNumber}` : "Select Table"}</span>
                  <ChevronDown className="w-3 h-3 text-orange-200" />
                </button>
                <span className="text-[11px] text-orange-100 font-medium hidden sm:inline">
                  Digital Menu
                </span>
              </div>
            </div>
          </div>

          {/* Customer navigation */}
          <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep("my_orders")}
            className={`relative px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 ${
              currentStep === "my_orders"
                ? "bg-orange-950/25 border border-white/35 text-white"
                : "bg-white/15 hover:bg-white/25 border border-white/25 text-white"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">My Orders</span>
            {myOrders.length > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-white text-orange-600 text-[10px] flex items-center justify-center">
                {myOrders.length > 9 ? "9+" : myOrders.length}
              </span>
            )}
          </button>
          {totalCartCount > 0 && currentStep === "menu" && (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-orange-50 text-orange-600 text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-orange-600" />
              <span>{totalCartCount} items</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-300" />
              <span>₹{grandTotal.toFixed(2)}</span>
            </button>
          )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MENU SCREEN (SEARCH, CATEGORIES & DISHES FEED)
         ───────────────────────────────────────────────────────────── */}
      {currentStep === "menu" && (
        <div className="flex-1 flex flex-col justify-between">
          {/* Search & Veg Filter Bar */}
          <div className="w-full px-4 sm:px-6 pt-4 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#a88d7b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for dishes, biryani, starters, drinks..."
                  className="w-full bg-white border border-orange-200/90 rounded-2xl pl-10 pr-8 py-2.5 text-xs sm:text-sm text-[#3b2618] placeholder-[#a88d7b] focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all shadow-xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                  vegOnlyFilter
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20"
                    : "bg-white border-orange-200/90 text-[#7c5e48] hover:bg-orange-50/60"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center p-[1px] ${
                    vegOnlyFilter ? "border-white bg-white/20" : "border-emerald-600 bg-emerald-50"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${vegOnlyFilter ? "bg-white" : "bg-emerald-600"}`}
                  />
                </span>
                <span>Veg Only</span>
              </button>
            </div>
          </div>

          {/* Categories Pill Bar ("sirf catogery rahne do") */}
          <div className="sticky top-[61px] sm:top-[65px] z-30 bg-[#fffaf0]/95 backdrop-blur-md border-b border-orange-200/60 py-2.5">
            <div className="w-full px-4 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {/* All Items Pill */}
              <button
                type="button"
                onClick={() => setActiveCategoryId("all")}
                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeCategoryId === "all"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 font-black border border-orange-500 scale-102"
                    : "bg-white text-[#7c5e48] border border-orange-200/80 hover:bg-orange-50/70 hover:text-[#3b2618] shadow-xs"
                }`}
              >
                <span>🍽️</span>
                <span>All Dishes</span>
              </button>

              {/* Dynamic Categories from Backend */}
              {categoriesList.map((category) => {
                const isSelected = activeCategoryId === category.id.toString();
                const icon = getCategoryIcon(category.name);
                const count = (category.items || []).length;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategoryId(category.id.toString())}
                    className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 font-black border border-orange-500 scale-102"
                        : "bg-white text-[#7c5e48] border border-orange-200/80 hover:bg-orange-50/70 hover:text-[#3b2618] shadow-xs"
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{category.name}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isSelected ? "bg-white/25 text-white" : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dishes Feed ("or jaha menu dikh h wo") */}
          <main className="w-full px-4 sm:px-6 py-5 flex-1 pb-32 space-y-8">
            {activeCategoryId === "all" ? (
              filteredAllItems.length === 0 ? (
                <div className="py-20 text-center text-[#7c5e48] text-sm bg-white rounded-3xl border border-orange-200 p-8 shadow-xs">
                  <UtensilsCrossed className="w-10 h-10 mx-auto text-orange-400 mb-2 opacity-60" />
                  <p className="font-bold text-[#3b2618]">No dishes found matching your search</p>
                  <p className="text-xs text-[#a88d7b] mt-1">Try searching for something else or clear filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4">
                  {filteredAllItems.map((item) => {
                    const inCart = cart[item.id];
                    const isVeg = isDishVeg(item);
                    const catIcon = getCategoryIcon(item.categoryName);

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-100 hover:border-orange-300 transition-all group shadow-2xs hover:shadow-md flex flex-col justify-between relative overflow-hidden"
                      >
                        <div>
                          {/* Image Box */}
                          <div className="relative w-full aspect-[4/3] rounded-xl bg-orange-50/60 overflow-hidden mb-2.5">
                            {item.imageUrl ? (
                              <img
                                src={getCleanImageUrl(item.imageUrl, 600)}
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                onClick={() => setPreviewDish(item)}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                              />
                            ) : (
                              <div
                                onClick={() => setPreviewDish(item)}
                                className="w-full h-full flex items-center justify-center text-3xl cursor-pointer bg-gradient-to-br from-orange-50 to-amber-50"
                              >
                                {catIcon}
                              </div>
                            )}

                            {/* Floating Details 3-Dot Circular Button */}
                            <button
                              type="button"
                              onClick={() => setPreviewDish(item)}
                              className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 shadow-xs flex items-center justify-center hover:bg-white hover:scale-110 transition-all cursor-pointer border border-slate-200/80"
                              title="View details"
                            >
                              <MoreHorizontal className="w-4 h-4 text-slate-700" />
                            </button>

                            {/* Veg / Non-Veg Badge */}
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs border border-slate-100">
                              {isVeg ? (
                                <span className="w-3.5 h-3.5 rounded-[3px] border border-emerald-600 flex items-center justify-center p-[1.5px] bg-emerald-50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-[3px] border border-rose-600 flex items-center justify-center p-[1px] bg-rose-50">
                                  <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-rose-600" />
                                </span>
                              )}
                              <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-700">
                                {isVeg ? "Veg" : "Non-Veg"}
                              </span>
                            </div>
                          </div>

                          {/* Item Title */}
                          <h3
                            onClick={() => setPreviewDish(item)}
                            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug truncate cursor-pointer mb-2"
                            title={item.name}
                          >
                            {item.name}
                          </h3>
                        </div>

                        {/* Bottom Row: Price & Stepper Control */}
                        <div className="flex items-center justify-between gap-1 mt-auto pt-1">
                          {/* Price */}
                          <div className="font-black text-slate-900 text-xs sm:text-sm tracking-tight">
                            ₹{Number(item.price).toFixed(2)}
                          </div>

                          {/* Stepper Control */}
                          {inCart ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="w-7 h-7 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <span className="w-5 text-center font-extrabold text-slate-900 text-xs sm:text-sm">
                                {inCart.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs shadow-orange-500/25"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled
                                className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <span className="w-5 text-center font-bold text-slate-400 text-xs">
                                0
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs shadow-orange-500/25"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              displayedDishes.length === 0 ? (
                <div className="py-20 text-center text-[#7c5e48] text-sm bg-white rounded-3xl border border-orange-200 p-8 shadow-xs">
                  <UtensilsCrossed className="w-10 h-10 mx-auto text-orange-400 mb-2 opacity-60" />
                  <p className="font-bold text-[#3b2618]">No dishes found matching your search</p>
                  <p className="text-xs text-[#a88d7b] mt-1">Try searching for something else or clear filters</p>
                </div>
              ) : (
                displayedDishes.map((cat) => {
                  return (
                    <section key={cat.id} className="space-y-3.5">
                      {/* Category Header */}
                      <div className="flex items-center justify-between border-b border-orange-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCategoryIcon(cat.name)}</span>
                          <div>
                            <h2 className="text-base sm:text-lg font-black text-[#3b2618]">
                              {cat.name}
                            </h2>
                            {cat.description && (
                              <p className="text-xs text-[#7c5e48] mt-0.5">{cat.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#a88d7b] bg-orange-100/60 px-2.5 py-1 rounded-full border border-orange-200/60">
                          {cat.items ? cat.items.length : 0} dishes
                        </span>
                      </div>

                      {/* Dishes Cards Grid */}
                      {!cat.items || cat.items.length === 0 ? (
                        <div className="py-10 text-center text-[#7c5e48] text-xs bg-white/60 rounded-2xl border border-dashed border-orange-200 p-6">
                          <UtensilsCrossed className="w-6 h-6 mx-auto text-orange-400 mb-1 opacity-50" />
                          <p className="font-bold text-[#3b2618]">No dishes in {cat.name} yet</p>
                          <p className="text-[11px] text-[#a88d7b] mt-0.5">Dishes added to this category will appear here</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4">
                        {cat.items.map((item) => {
                          const inCart = cart[item.id];
                          const isVeg = isDishVeg(item);
                          const catIcon = getCategoryIcon(cat.name);

                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-100 hover:border-orange-300 transition-all group shadow-2xs hover:shadow-md flex flex-col justify-between relative overflow-hidden"
                            >
                              <div>
                                {/* Image Box */}
                                <div className="relative w-full aspect-[4/3] rounded-xl bg-orange-50/60 overflow-hidden mb-2.5">
                                  {item.imageUrl ? (
                                    <img
                                      src={getCleanImageUrl(item.imageUrl, 600)}
                                      alt={item.name}
                                      loading="lazy"
                                      decoding="async"
                                      onClick={() => setPreviewDish(item)}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                                    />
                                  ) : (
                                    <div
                                      onClick={() => setPreviewDish(item)}
                                      className="w-full h-full flex items-center justify-center text-3xl cursor-pointer bg-gradient-to-br from-orange-50 to-amber-50"
                                    >
                                      {catIcon}
                                    </div>
                                  )}

                                  {/* Floating Details 3-Dot Circular Button */}
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDish(item)}
                                    className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 shadow-xs flex items-center justify-center hover:bg-white hover:scale-110 transition-all cursor-pointer border border-slate-200/80"
                                    title="View details"
                                  >
                                    <MoreHorizontal className="w-4 h-4 text-slate-700" />
                                  </button>

                                  {/* Veg / Non-Veg Badge */}
                                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs border border-slate-100">
                                    {isVeg ? (
                                      <span className="w-3.5 h-3.5 rounded-[3px] border border-emerald-600 flex items-center justify-center p-[1.5px] bg-emerald-50">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                      </span>
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-[3px] border border-rose-600 flex items-center justify-center p-[1px] bg-rose-50">
                                        <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-rose-600" />
                                      </span>
                                    )}
                                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-700">
                                      {isVeg ? "Veg" : "Non-Veg"}
                                    </span>
                                  </div>
                                </div>

                                {/* Item Title */}
                                <h3
                                  onClick={() => setPreviewDish(item)}
                                  className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug truncate cursor-pointer mb-2"
                                  title={item.name}
                                >
                                  {item.name}
                                </h3>
                              </div>

                              {/* Bottom Row: Price & Stepper Control */}
                              <div className="flex items-center justify-between gap-1 mt-auto pt-1">
                                {/* Price */}
                                <div className="font-black text-slate-900 text-xs sm:text-sm tracking-tight">
                                  ₹{Number(item.price).toFixed(2)}
                                </div>

                                {/* Stepper Control */}
                                {inCart ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-7 h-7 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs"
                                    >
                                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <span className="w-5 text-center font-extrabold text-slate-900 text-xs sm:text-sm">
                                      {inCart.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => addToCart(item)}
                                      className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs shadow-orange-500/25"
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled
                                      className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed"
                                    >
                                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <span className="w-5 text-center font-bold text-slate-400 text-xs">
                                      0
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => addToCart(item)}
                                      className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs shadow-orange-500/25"
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                  );
                })
              )
            )}
          </main>

          {/* Floating Bottom Cart Bar */}
          {totalCartCount > 0 && !isCartOpen && (
            <div className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-auto sm:w-[380px] z-40 animate-bounce-subtle">
              <div
                onClick={() => setIsCartOpen(true)}
                className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:brightness-105 text-white rounded-xl p-2.5 px-3 shadow-lg shadow-orange-950/20 flex items-center justify-between gap-2 border border-orange-400/40 cursor-pointer transition-all active:scale-[0.99] backdrop-blur-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-white font-bold border border-white/15 shadow-inner">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-orange-600 text-[9px] font-black flex items-center justify-center shadow">
                      {totalCartCount}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black tracking-wide">
                        {selectedTable?.tableNumber ? `Table ${selectedTable.tableNumber}` : "Dine In"}
                      </span>
                      <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded-full font-bold">
                        {totalCartCount} {totalCartCount === 1 ? "dish" : "dishes"}
                      </span>
                    </div>
                    <div className="text-[10px] text-orange-100 font-bold mt-0.5">
                      Total: ₹{grandTotal.toFixed(2)}{" "}
                      <span className="text-[10px] text-orange-200 font-normal">(inc. 5% tax)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-black text-[10px] uppercase bg-black/25 hover:bg-black/35 px-2.5 py-1.5 rounded-lg border border-white/15 shadow-sm">
                  <span>View Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. SCREEN: ORDER SUCCESS / CONFIRMATION
         ───────────────────────────────────────────────────────────── */}
      {currentStep === "order_success" && (
        <main className="max-w-md mx-auto w-full flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200 shadow-xl shadow-orange-500/10">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#3b2618]">
              Order Received & Sent to Kitchen!
            </h1>
            <p className="text-xs text-[#7c5e48] max-w-sm">
              Your dining order has been transmitted directly to the kitchen chef for{" "}
              <span className="font-bold text-[#3b2618]">
                Table {selectedTable?.tableNumber || "Dine In"}
              </span>.
            </p>
          </div>

          <div className="w-full bg-white rounded-2xl p-5 border border-orange-200 space-y-2.5 text-left text-xs shadow-sm">
            <div className="flex justify-between pb-2 border-b border-orange-100">
              <span className="text-[#7c5e48]">Order Ticket #:</span>
              <span className="font-extrabold text-orange-600">
                {orderSuccess?.orderNumber || "ORD-PENDING"}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-orange-100">
              <span className="text-[#7c5e48]">Dining Table:</span>
              <span className="font-bold text-[#3b2618]">
                Table {selectedTable?.tableNumber || "Dine In"}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-orange-100">
              <span className="text-[#7c5e48]">Status:</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase text-[10px] border border-amber-200">
                In Kitchen Queue
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[#7c5e48]">Total Amount:</span>
              <span className="font-black text-[#3b2618] text-sm">
                ₹{Number(orderSuccess?.totalAmount || grandTotal).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep("my_orders")}
            className="w-full py-3.5 px-4 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 font-black text-xs border border-orange-200 transition-all cursor-pointer uppercase tracking-wider"
          >
            Track My Order
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep("menu")}
            className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/25 transition-all cursor-pointer uppercase tracking-wider"
          >
            Order More Dishes ➔
          </button>
        </main>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. SLIDE-UP CHECKOUT BILL DRAWER
         ───────────────────────────────────────────────────────────── */}
      {currentStep === "my_orders" && (
        <main className="max-w-2xl mx-auto w-full flex-1 px-4 py-6 pb-12">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-black text-[#3b2618] flex items-center gap-2"><ClipboardList className="w-5 h-5 text-orange-600" />My Orders</h2>
              <p className="text-xs text-[#7c5e48] mt-1">Live updates from the restaurant kitchen.</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setOrdersLoading(true); refreshMyOrders().finally(() => setOrdersLoading(false)); }} className="p-2.5 rounded-xl bg-white hover:bg-orange-50 border border-orange-200 text-orange-600 transition-colors cursor-pointer" title="Refresh order status">
                <RefreshCw className={`w-4 h-4 ${ordersLoading ? "animate-spin" : ""}`} />
              </button>
              <button type="button" onClick={() => setCurrentStep("menu")} className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          </div>

          {myOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-orange-300 p-10 text-center shadow-xs">
              <Receipt className="w-10 h-10 mx-auto text-orange-300 mb-3" />
              <h3 className="font-bold text-[#3b2618]">No orders yet</h3>
              <p className="text-xs text-[#7c5e48] mt-1.5">Your placed orders will appear here.</p>
              <button type="button" onClick={() => setCurrentStep("menu")} className="mt-5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">Browse Menu</button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => {
                const status = getStatusInfo(order.status);
                const StatusIcon = status.icon;
                const items = order.items || [];
                return (
                  <article key={order.id} className="bg-white rounded-3xl border border-orange-200/90 overflow-hidden shadow-sm">
                    <div className="p-4 sm:p-5 border-b border-orange-100 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#a88d7b]">Order</p>
                        <h3 className="text-sm font-black text-[#3b2618] mt-0.5">#{order.orderNumber || order.id}</h3>
                        <p className="text-[11px] text-[#7c5e48] mt-1">{order.tableNumber ? `Table ${order.tableNumber} - ` : ""}{new Date(order.createdAt || order.placedAt || Date.now()).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase ${status.color}`}><StatusIcon className="w-3.5 h-3.5" />{status.label}</span>
                    </div>
                    <div className="p-4 sm:p-5">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-[#7c5e48] mb-2.5">Ordered items</h4>
                      {items.length === 0 ? <p className="text-xs text-[#a88d7b]">Loading order details...</p> : (
                        <div className="space-y-2">
                          {items.map((item, index) => (
                            <div key={item.id || `${order.id}-${index}`} className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-[#3b2618] font-semibold min-w-0 truncate"><span className="text-orange-600 font-black mr-2">{item.quantity}x</span>{item.itemName}</span>
                              <span className="font-bold text-[#7c5e48] whitespace-nowrap">Rs. {Number(item.lineTotal || Number(item.unitPrice || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-orange-100"><span className="text-xs font-bold text-[#7c5e48]">Total</span><span className="text-base font-black text-orange-600">Rs. {Number(order.totalAmount || 0).toFixed(2)}</span></div>
                      {order.paymentStatus === "paid" ? (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-700">Payment received</div>
                      ) : order.billRequestedAt ? (
                        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-center text-xs font-bold text-sky-700">Bill requested — staff will assist you shortly</div>
                      ) : (order.kitchenStatus || order.status) === "completed" ? (
                        <button type="button" onClick={() => { setBillPaymentOrder(order); setPreferredPaymentMethod("cash"); }} disabled={billRequestingId === order.id} className="mt-3 w-full rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-black text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">Request Bill & Choose Payment</button>
                      ) : (
                        <p className="mt-3 text-center text-[11px] font-medium text-[#a88d7b]">Bill can be requested once KOT status is completed.</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {billPaymentOrder && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-orange-200 bg-[#fffdf8] p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#3b2618]">Choose payment method</h3>
                <p className="mt-1 text-xs text-[#7c5e48]">Bill total: <span className="font-black text-orange-600">Rs. {Number(billPaymentOrder.totalAmount || 0).toFixed(2)}</span></p>
              </div>
              <button type="button" onClick={() => setBillPaymentOrder(null)} className="rounded-xl p-2 text-[#7c5e48] hover:bg-orange-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "cash", label: "Cash", subtitle: "Pay at table", icon: Banknote },
                { id: "card", label: "Card", subtitle: "Card machine", icon: CreditCard },
                { id: "online", label: "UPI / Online", subtitle: "Pay digitally", icon: Smartphone },
                { id: "qr_pay", label: "QR Pay", subtitle: "Scan payment QR", icon: QrCode },
              ].map(({ id, label, subtitle, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setPreferredPaymentMethod(id)} className={`rounded-2xl border p-3 text-left transition-colors ${preferredPaymentMethod === id ? "border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-100" : "border-orange-200 bg-white text-[#5c3b24] hover:bg-orange-50"}`}>
                  <Icon className="mb-2 h-5 w-5" />
                  <div className="text-xs font-black">{label}</div>
                  <div className="mt-0.5 text-[10px] text-[#87644a]">{subtitle}</div>
                </button>
              ))}
            </div>
            <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-[11px] text-sky-800">Your choice will be sent to the restaurant. Staff will bring the bill or payment option to your table.</p>
            <button type="button" disabled={billRequestingId === billPaymentOrder.id} onClick={async () => { const sent = await handleRequestBill(billPaymentOrder, preferredPaymentMethod); if (sent) setBillPaymentOrder(null); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-white hover:bg-orange-600 disabled:opacity-50">
              {billRequestingId === billPaymentOrder.id ? "Confirming payment..." : "Confirm Payment & Notify Restaurant"}
            </button>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#fffdf8] rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-orange-200 shadow-2xl max-h-[92vh] flex flex-col justify-between overflow-hidden relative text-[#3b2618]">
            {/* Pull tab handle for mobile */}
            <div className="w-12 h-1.5 bg-orange-200 rounded-full mx-auto -mt-2 mb-3 sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-orange-200/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 border border-orange-200 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-[#3b2618]">Your Dining Order</h2>
                    <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-black text-[11px] border border-orange-200">
                      Table {selectedTable?.tableNumber || "Dine In"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7c5e48]">
                    {totalCartCount} {totalCartCount === 1 ? "item" : "items"} ready for kitchen
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalCartCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    title="Clear all items"
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl text-[#7c5e48] hover:text-[#3b2618] hover:bg-orange-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cart Content Scroll Area */}
            <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 divide-y divide-orange-100 max-h-[50vh]">
              {totalCartCount === 0 ? (
                <div className="py-12 text-center text-[#7c5e48] text-xs flex flex-col items-center gap-2">
                  <ShoppingBag className="w-10 h-10 text-orange-300" />
                  <p>Your cart is empty. Tap any dish on the menu to add!</p>
                </div>
              ) : (
                <>
                  {/* Diner Details & Cooking Note (Visible at Top) */}
                  <div className="space-y-2 pb-2 border-b border-orange-100">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#a88d7b]" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Guest Name (Optional)"
                          className="w-full bg-white border border-orange-200/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#3b2618] placeholder-[#a88d7b] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-xs"
                        />
                      </div>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#a88d7b]" />
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Mobile # (Optional)"
                          className="w-full bg-white border border-orange-200/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#3b2618] placeholder-[#a88d7b] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-xs"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 absolute left-3 top-2 text-[#a88d7b]" />
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Cooking Note (e.g., Mild spicy, extra tissues) (Optional)"
                        className="w-full bg-white border border-orange-200/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#3b2618] placeholder-[#a88d7b] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Dish Rows */}
                  <div className="space-y-2 pt-2">
                    {Object.values(cart).map(({ item, quantity }) => {
                      const isVeg = isDishVeg(item);
                      const itemTotal = Number(item.price) * quantity;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white border border-orange-200/80 shadow-xs"
                        >
                          {/* Thumbnail Image + Veg Dot */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 overflow-hidden shrink-0 flex items-center justify-center text-base relative shadow-xs">
                              {item.imageUrl ? (
                                <img
                                  src={getCleanImageUrl(item.imageUrl, 200)}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span>🍲</span>
                              )}
                              <span
                                className={`absolute top-1 left-1 w-2 h-2 rounded-full ${
                                  isVeg ? "bg-emerald-600" : "bg-rose-600"
                                }`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[#3b2618] text-xs truncate">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-[#7c5e48] flex items-center gap-1.5 mt-0.5">
                                <span>₹{Number(item.price).toFixed(2)}</span>
                                <span className="text-stone-300">•</span>
                                <span className="text-orange-600 font-bold">
                                  ₹{itemTotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 bg-orange-50/70 border border-orange-200 rounded-xl p-1 shadow-inner">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-orange-100 text-[#7c5e48] border border-orange-200 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black text-[#3b2618] px-1.5 min-w-[1.2rem] text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="w-6 h-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Bill Totals & Submit Order Bar */}
            {totalCartCount > 0 && (
              <div className="pt-3 border-t border-orange-200 space-y-2.5">
                <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-1.5 text-xs text-[#7c5e48]">
                  <div className="flex justify-between">
                    <span>Item Subtotal ({totalCartCount} items):</span>
                    <span className="text-[#3b2618] font-bold">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT / Tax (5% Standard):</span>
                    <span className="text-[#3b2618] font-bold">₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-sm font-black text-[#3b2618] pt-2 border-t border-orange-200">
                    <span className="text-xs uppercase tracking-wider text-[#7c5e48]">To Pay at Table:</span>
                    <span className="text-orange-600 font-black text-xl">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={orderSubmitting}
                  onClick={handlePlaceOrder}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wider active:scale-[0.99]"
                >
                  {orderSubmitting ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transmitting Order to Kitchen...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Place Order for Table {selectedTable?.tableNumber || "Dine In"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. HIGH-RES DISH PREVIEW MODAL
         ───────────────────────────────────────────────────────────── */}
      {previewDish && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#fffdf8] rounded-3xl max-w-lg w-full border border-orange-200 shadow-2xl overflow-hidden relative text-[#3b2618]">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setPreviewDish(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#3b2618] flex items-center justify-center border border-orange-200 transition-all cursor-pointer shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Large high-res photo */}
            <div className="w-full h-64 sm:h-72 bg-orange-50 relative overflow-hidden flex items-center justify-center">
              {previewDish.imageUrl ? (
                <img
                  src={getCleanImageUrl(previewDish.imageUrl, 1200)}
                  alt={previewDish.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">{getCategoryIcon(previewDish.name)}</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                    isDishVeg(previewDish)
                      ? "bg-emerald-500/90 text-white border-emerald-400"
                      : "bg-rose-500/90 text-white border-rose-400"
                  }`}
                >
                  {isDishVeg(previewDish) ? "🌱 Pure Vegetarian" : "🍗 Non-Vegetarian"}
                </span>
                <span className="text-xl font-black text-white bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-xl border border-white/20">
                  ₹{Number(previewDish.price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Dish Information */}
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-xl font-black text-[#3b2618]">{previewDish.name}</h2>
                <p className="text-xs text-[#7c5e48] mt-2 leading-relaxed">
                  {previewDish.description ||
                    "Prepared fresh to order by our culinary chefs using premium quality spices and farm-fresh ingredients."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                {cart[previewDish.id] ? (
                  <div className="flex-1 h-12 rounded-2xl bg-orange-500 border border-orange-400 flex items-center justify-between px-4 shadow-lg shadow-orange-500/30 text-white">
                    <button
                      type="button"
                      onClick={() => removeFromCart(previewDish.id)}
                      className="w-8 h-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-white">
                      {cart[previewDish.id].quantity} in Order
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(previewDish)}
                      className="w-8 h-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCart(previewDish)}
                    className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Order • ₹{Number(previewDish.price).toFixed(2)}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDish(null)}
                  className="px-5 h-12 rounded-2xl bg-white hover:bg-orange-50 text-[#7c5e48] font-bold text-xs border border-orange-200 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TABLE & ROOM SELECTION MODAL
         ───────────────────────────────────────────────────────────── */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  {selectionMode === "rooms" ? <Bed className="w-5 h-5 text-orange-600" /> : <Grid className="w-5 h-5 text-orange-600" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">
                    Select Table / Room
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Choose your dining table or guest room for order
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher inside Modal */}
            {menuData?.rooms && menuData.rooms.length > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectionMode("tables")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    selectionMode === "tables"
                      ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Tables ({availableTables.length} Avail)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode("rooms")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    selectionMode === "rooms"
                      ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <Bed className="w-3.5 h-3.5" />
                  <span>Rooms ({availableRooms.length} Avail)</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto p-1">
              {(selectionMode === "rooms" ? (menuData?.rooms || []) : (menuData?.tables || [])).map((item) => {
                const isRoom = selectionMode === "rooms";
                const itemId = isRoom ? item.roomId : (item.tableId || item.id);
                const itemNum = isRoom ? item.roomNumber : item.tableNumber;
                const isSelected = isRoom
                  ? selectedTable?.roomId === itemId
                  : selectedTable?.tableId === itemId;
                const isAvailable = (item.status || "").toLowerCase() === "available";

                return (
                  <button
                    key={itemId}
                    type="button"
                    onClick={() => {
                      if (isRoom) {
                        setSelectedTable({
                          roomId: item.roomId,
                          tableId: null,
                          tableNumber: `Room ${item.roomNumber}`,
                          roomNumber: item.roomNumber,
                          isRoom: true,
                          capacity: item.capacity || 2,
                          status: item.status || "available",
                        });
                      } else {
                        setSelectedTable({
                          tableId: item.tableId || item.id,
                          tableNumber: item.tableNumber,
                          capacity: item.capacity || 4,
                          status: item.status || "available",
                          qrToken: item.qrToken,
                        });
                      }
                      setIsTableModalOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-orange-500 bg-orange-50 ring-4 ring-orange-500/15 shadow-md"
                        : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isRoom ? "Room" : "Table"}
                    </span>
                    <span className="text-xl font-black text-slate-800 tracking-tight my-0.5">
                      {itemNum}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        }`}
                      />
                      <span className="text-[10px] font-bold text-slate-600">
                        {isAvailable ? "Available" : "Occupied"}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="absolute top-2 right-2 text-orange-600 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 fill-orange-100" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available {selectionMode === "rooms" ? "Rooms" : "Tables"}
              </span>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold cursor-pointer transition-colors shadow-md shadow-orange-500/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
