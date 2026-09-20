import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "../../services/api";
import TableOrderMenuModal from "./TableOrderMenuModal";
import CustomerDetailsModal from "./CustomerDetailsModal";
import BillingModal from "./BillingModal";
import KOTConfirmationNotifier from "./KOTConfirmationNotifier";
import { combineTableOrders } from "../../utils/orderUtils";
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  DollarSign,
  User,
  Phone,
  X,
  AlertCircle,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  Globe,
  Receipt,
  LayoutGrid,
  ListOrdered,
  Users,
  ChefHat,
  Sparkles,
} from "lucide-react";

export default function OrderManager({ onSelectOrder, refreshKey = 0 }) {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmedOrderAlert, setConfirmedOrderAlert] = useState(null);

  const knownOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // View Mode: 'table_view' or 'tickets_view'
  const [viewMode, setViewMode] = useState("table_view");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTableFilter, setSelectedTableFilter] = useState("all");

  // Menu Order Modal State
  const [isMenuOrderModalOpen, setIsMenuOrderModalOpen] = useState(false);
  const [billingModalOrder, setBillingModalOrder] = useState(null);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState(null);
  const [orderToast, setOrderToast] = useState(null);

  // Customer Details Popup State (Screenshot flow)
  const [customerPopupOpen, setCustomerPopupOpen] = useState(false);
  const [targetTableForPopup, setTargetTableForPopup] = useState(null);
  const [initialCustomerName, setInitialCustomerName] = useState("");
  const [initialCustomerPhone, setInitialCustomerPhone] = useState("");

  const fetchOrdersAndTables = async () => {
    try {
      const [ordersData, tablesData] = await Promise.all([
        api.owner.getOrders(statusFilter !== "all" ? { status: statusFilter } : {}),
        api.owner.getTables(),
      ]);
      const currentOrders = ordersData || [];
      const currentTables = tablesData || [];

      if (Array.isArray(currentOrders)) {
        const currentIds = new Set(currentOrders.map((o) => o.id));
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          knownOrderIdsRef.current = currentIds;
          const waitingForKitchen = currentOrders.find((order) => order.kitchenStatus === "confirmed");
          if (waitingForKitchen) setConfirmedOrderAlert(waitingForKitchen);
        } else {
          const newOrder = currentOrders.find(
            (o) => !knownOrderIdsRef.current.has(o.id) && o.status !== "cancelled"
          );
          if (newOrder) {
            setConfirmedOrderAlert(newOrder);
          }
          knownOrderIdsRef.current = currentIds;
        }
      }

      setOrders(currentOrders);
      setTables(currentTables);
    } catch (err) {
      setError(err.message || "Failed to load orders and tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrdersAndTables();
    const interval = setInterval(fetchOrdersAndTables, 4000);

    let bc;
    try {
      bc = new BroadcastChannel("pos_orders");
      bc.onmessage = (event) => {
        if (event.data?.type === "NEW_ORDER" && event.data?.order) {
          setConfirmedOrderAlert(event.data.order);
          fetchOrdersAndTables();
        }
      };
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === "last_pos_order_ts" || e.key === "last_pos_order_data") {
        try {
          const raw = localStorage.getItem("last_pos_order_data");
          if (raw) setConfirmedOrderAlert(JSON.parse(raw));
        } catch (err) {}
        fetchOrdersAndTables();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      clearInterval(interval);
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [statusFilter, refreshKey]);

  const handleOpenTableMenu = (table = null) => {
    const data = table ? tableOrderMap.get(table.id) : null;
    const isOccupied = table ? (table.status === "occupied" || (data && data.unpaidOrders.length > 0)) : false;

    if (table && !isOccupied) {
      // Open customer details popup first for available table
      setTargetTableForPopup(table);
      setCustomerPopupOpen(true);
    } else {
      // Direct order modal for occupied table or takeaway
      setSelectedTableForOrder(table);
      setInitialCustomerName("");
      setInitialCustomerPhone("");
      setIsMenuOrderModalOpen(true);
    }
  };

  const handleCustomerDetailsConfirm = (name, phone) => {
    setCustomerPopupOpen(false);
    setSelectedTableForOrder(targetTableForPopup);
    setInitialCustomerName(name);
    setInitialCustomerPhone(phone);
    setIsMenuOrderModalOpen(true);
  };

  const handleOrderPlaced = (newOrder) => {
    fetchOrdersAndTables();
    setConfirmedOrderAlert(newOrder);
    setOrderToast({
      message: `Order #${newOrder.orderNumber || newOrder.id} successfully placed and sent to kitchen!`,
      type: "success",
    });
    setTimeout(() => setOrderToast(null), 5000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.owner.updateOrderStatus(orderId, newStatus);
      fetchOrdersAndTables();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  // Group orders by table
  const tableOrderMap = useMemo(() => {
    const map = new Map();
    for (const table of tables) {
      const activeTableOrders = orders.filter(
        (o) => o.tableId === table.id && o.status !== "cancelled" && o.status !== "completed" && o.paymentStatus !== "paid"
      );
      const unpaidOrders = activeTableOrders.filter((o) => o.paymentStatus !== "paid");
      const runningBill = unpaidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      map.set(table.id, {
        table,
        orders: activeTableOrders,
        unpaidOrders,
        runningBill,
      });
    }
    return map;
  }, [tables, orders]);

  // Sorted tables for Order view (occupied tables first, then available)
  const displayTables = useMemo(() => {
    return [...tables].sort((a, b) => {
      const dataA = tableOrderMap.get(a.id) || { unpaidOrders: [] };
      const dataB = tableOrderMap.get(b.id) || { unpaidOrders: [] };
      const isOccA = a.status === "occupied" || dataA.unpaidOrders.length > 0;
      const isOccB = b.status === "occupied" || dataB.unpaidOrders.length > 0;
      if (isOccA && !isOccB) return -1;
      if (!isOccA && isOccB) return 1;
      return Number(a.tableNumber) - Number(b.tableNumber);
    });
  }, [tables, tableOrderMap]);

  const statusColors = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-sky-50 text-sky-700 border-sky-200",
    preparing: "bg-blue-50 text-blue-700 border-blue-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-slate-100 text-slate-600 border-slate-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Success Toast for Newly Created Order */}
      {orderToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-md shadow-emerald-500/10 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{orderToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setOrderToast(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Orders & POS</h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-extrabold uppercase">
              Table & Room Billing
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Click any table to open the interactive menu, take live orders, and send tickets directly to kitchen
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick "+ Take Order" POS Button */}
          <button
            type="button"
            onClick={() => handleOpenTableMenu(null)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-500/20 hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Take Order</span>
          </button>

          {/* Toggle between Table View & Tickets View */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode("table_view")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table_view"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tickets_view")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "tickets_view"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>All Tickets</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchOrdersAndTables}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all cursor-pointer shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
          {error}
        </div>
      )}

      {/* VIEW MODE 1: TABLE FLOOR VIEW */}
      {viewMode === "table_view" && (
        displayTables.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 shadow-2xs">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Dining Tables Configured</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Go to Table Manager to add dining tables for your restaurant.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-2">
            {displayTables.map((table) => {
              const data = tableOrderMap.get(table.id) || { table, orders: [], unpaidOrders: [], runningBill: 0 };
              const isOccupied = table.status === "occupied" || data.unpaidOrders.length > 0;

              return (
                <div
                  key={table.id}
                  onClick={() => handleOpenTableMenu(table)}
                  className={`bg-white rounded-xl p-2 border transition-all flex flex-col justify-between shadow-2xs cursor-pointer group hover:shadow-sm ${
                    isOccupied
                      ? "border-amber-300/90 bg-amber-50/15 hover:border-amber-400"
                      : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/10"
                  }`}
                >
                  <div>
                    {/* Table Header Details */}
                    <div className="flex items-start justify-between pb-1.5 border-b border-slate-100 gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-extrabold text-[10px] border transition-transform group-hover:scale-105 shrink-0 ${
                            isOccupied
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          {table.tableNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-800 group-hover:text-orange-600 transition-colors truncate">
                              {table.tableNumber}
                            </span>
                            <span
                              className={`text-[7.5px] font-extrabold px-1 py-0.2 rounded border capitalize shrink-0 ${
                                isOccupied
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {isOccupied ? "Occupied" : "Available"}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 font-medium flex items-center gap-0.5 mt-0.5">
                            <Users className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{table.capacity} Person</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isOccupied && (
                          <div className="text-right">
                            <span className="text-[7.5px] uppercase font-bold text-slate-400 block leading-tight">RUNNING BILL</span>
                            <div className="text-[11px] font-black text-emerald-600">
                              ₹{data.runningBill.toFixed(2)}
                            </div>
                          </div>
                        )}

                        {/* Explicit Take Order / Add Dishes button on card */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTableMenu(table);
                          }}
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-0.5 transition-all cursor-pointer shadow-2xs ${
                            isOccupied
                              ? "bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border-amber-200 hover:border-amber-500"
                              : "bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border-orange-200 hover:border-orange-500"
                          }`}
                          title={isOccupied ? "Click to add dishes for this occupied table" : "Click to take order for this table"}
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Add Dishes</span>
                        </button>
                      </div>
                    </div>

                    {/* Middle Area: Active Tickets or Empty State */}
                    <div className="py-1.5 space-y-1">
                      {data.orders.length === 0 ? (
                        <div className="py-3 px-1 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-0.5 text-center group-hover:bg-orange-50/30 transition-colors">
                          <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs group-hover:scale-105 transition-transform">
                            <UtensilsCrossed className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-700 block">
                              {isOccupied ? "Occupied" : "Ready"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-44 overflow-y-auto">
                          {data.orders.slice(0, 1).map((ord) => {
                            const isKotCompleted = ord.kitchenStatus === "completed";
                            const rawName = ord.customerName || "";
                            const isTablePrefix = !rawName || rawName.toLowerCase().startsWith("table ");
                            const displayName = isTablePrefix ? "Guest" : rawName;

                            return (
                              <div
                                key={ord.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTableMenu(table);
                                }}
                                className={`p-1.5 rounded-lg border text-[10px] space-y-1 cursor-pointer transition-all shadow-2xs group/ticket ${
                                  isKotCompleted ? "bg-emerald-50/70 border-emerald-300 hover:border-emerald-400" : "bg-white border-slate-200 hover:border-orange-300"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-slate-800 group-hover/ticket:text-orange-600 transition-colors truncate max-w-[110px] text-[10px]" title={displayName}>
                                    {displayName}
                                  </span>
                                  <span
                                    className={`text-[7.5px] font-extrabold px-1 py-0.2 rounded border uppercase shrink-0 ${
                                      isKotCompleted
                                        ? "bg-emerald-500 text-white border-emerald-600 shadow-2xs"
                                        : ord.kitchenStatus === "ready"
                                        ? "bg-blue-500 text-white border-blue-600"
                                        : statusColors[ord.status]
                                    }`}
                                  >
                                    {isKotCompleted ? "KOT COMPLETED" : ord.kitchenStatus === "ready" ? "KOT READY" : ord.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500 text-[9.5px]">
                                  <span>{ord.items?.length || 0} items</span>
                                  <span className="font-extrabold text-slate-800">
                                    ₹{Number(ord.totalAmount || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Footer Action for Occupied Tables */}
                  {isOccupied && (
                    <div className="pt-1 mt-1 border-t border-slate-100 flex items-center gap-1">
                      {data.orders.some((o) => o.kitchenStatus === "completed") ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const ord = data.orders.find((o) => o.kitchenStatus === "completed") || data.orders[0];
                            if (ord) setBillingModalOrder(ord);
                            else handleOpenTableMenu(table);
                          }}
                          className="w-full py-1 px-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <Receipt className="w-3 h-3 text-white" />
                          <span className="truncate">Open Bill & Pay</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTableMenu(table);
                          }}
                          className="w-full py-1 px-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[9.5px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5 text-orange-600" />
                          <span className="truncate">Add More Items to Table {table.tableNumber}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* VIEW MODE 2: ALL TICKETS */}
      {viewMode === "tickets_view" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const rawName = order.customerName || "";
            const isTablePrefix = !rawName || rawName.toLowerCase().startsWith("table ");
            const displayName = isTablePrefix ? "Guest" : rawName;

            return (
              <div
                key={order.id}
                onClick={() => setBillingModalOrder(order)}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-orange-400 shadow-xs hover:shadow-md space-y-3 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors text-xs" title={displayName}>
                    {displayName}
                  </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"} • {order.items?.length || 0} items
                </span>
                <span className="font-bold text-emerald-600">
                  ₹{Number(order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Customer Details Popup Modal (Screenshot Design) */}
      <CustomerDetailsModal
        isOpen={customerPopupOpen}
        onClose={() => setCustomerPopupOpen(false)}
        targetItem={targetTableForPopup}
        itemType="Table"
        onConfirm={handleCustomerDetailsConfirm}
      />

      {/* Live Table Menu Ordering POS Modal */}
      <TableOrderMenuModal
        isOpen={isMenuOrderModalOpen}
        onClose={() => setIsMenuOrderModalOpen(false)}
        table={selectedTableForOrder}
        allTables={tables}
        initialCustomerName={initialCustomerName}
        initialCustomerPhone={initialCustomerPhone}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Direct Bill Payment & Settlement Modal */}
      <BillingModal
        order={billingModalOrder}
        isOpen={Boolean(billingModalOrder)}
        onClose={() => setBillingModalOrder(null)}
        onPaymentComplete={() => {
          setBillingModalOrder(null);
          fetchOrdersAndTables();
        }}
      />

      {/* Real-Time Incoming Order Pop-up Notification (KOT style) */}
      <KOTConfirmationNotifier
        order={confirmedOrderAlert}
        onStartCooking={async (ord) => {
          try {
            await api.owner.updateKitchenStatus(ord.id, "preparing");
          } catch (e) {}
          setConfirmedOrderAlert(null);
          fetchOrdersAndTables();
        }}
        onDismiss={() => setConfirmedOrderAlert(null)}
      />
    </div>
  );
}

