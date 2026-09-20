import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "../../services/api";
import KOTConfirmationNotifier from "./KOTConfirmationNotifier";
import {
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  Flame,
  ChefHat,
  Filter,
  FileText,
  Bed,
  Grid,
  Search,
  RotateCcw,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function KOTManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("today"); // 'today' | 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [confirmedOrderAlert, setConfirmedOrderAlert] = useState(null);
  const orderKitchenStatusRef = useRef(new Map());
  const isInitialLoadRef = useRef(true);

  const fetchOrders = async () => {
    try {
      const queryParams = dateFilter === "today" ? { today: "true" } : {};
      const data = await api.owner.getOrders(queryParams);
      if (Array.isArray(data)) {
        const nextStatuses = new Map(data.map((order) => [order.id, order.kitchenStatus]));
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
        } else {
          const newlyConfirmed = data.find((order) =>
            order.kitchenStatus === "confirmed" && orderKitchenStatusRef.current.get(order.id) !== "confirmed"
          );
          if (newlyConfirmed) setConfirmedOrderAlert(newlyConfirmed);
        }
        orderKitchenStatusRef.current = nextStatuses;
        setOrders(data);
      }
    } catch (err) {
      console.warn("KOT orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const kotTickets = useMemo(() => {
    return orders.map((o) => {
      const shortId = o.orderNumber ? o.orderNumber.slice(-4) : o.id;
      const items = (o.items || []).map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        category: item.categoryNames || "Dishes",
        notes: item.notes || "",
      }));

      return {
        id: o.id,
        orderId: o.id,
        kotNumber: `KOT-${shortId}`,
        orderNumber: o.orderNumber,
        customerName: o.customerName || "",
        customerPhone: o.customerPhone || "",
        location: o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway",
        locationType: o.tableNumber ? "table" : "counter",
        orderType: o.orderType === "dine_in" ? "Dine-In" : "Takeaway",
        station: "Main Kitchen",
        status: o.kitchenStatus || "pending",
        createdAt: o.createdAt || new Date().toISOString(),
        chefNote: o.kitchenNotes || "",
        customerNote: o.notes || "",
        items,
      };
    });
  }, [orders]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activePrintTicket, setActivePrintTicket] = useState(null);
  const [chefNoteModalTicket, setChefNoteModalTicket] = useState(null);
  const [newChefNote, setNewChefNote] = useState("");

  const handleUpdateKOTStatus = async (ticketId, newStatus) => {
    try {
      await api.owner.updateKitchenStatus(ticketId, newStatus);
      fetchOrders();
    } catch (err) {
      alert("Failed to update status: " + (err.message || "Error"));
    }
  };

  const handleAcceptConfirmedOrder = async (order) => {
    setConfirmedOrderAlert(null);
    await handleUpdateKOTStatus(order.id, "preparing");
  };

  const handleSaveChefNote = async () => {
    if (!chefNoteModalTicket) return;
    try {
      await api.owner.updateKitchenNote(chefNoteModalTicket.orderId, newChefNote);
      setChefNoteModalTicket(null);
      setNewChefNote("");
      fetchOrders();
    } catch (err) {
      alert("Failed to save kitchen note: " + (err.message || "Error"));
    }
  };

  const filteredTickets = useMemo(() => {
    return kotTickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesSearch =
        ticket.kotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.items.some((i) => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()));
      const isToday = new Date(ticket.createdAt).toDateString() === new Date().toDateString();
      const matchesDate = dateFilter === "all" || isToday;
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [kotTickets, statusFilter, searchTerm, dateFilter]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, dateFilter]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  const pendingCount = kotTickets.filter((t) => t.status === "pending").length;
  const preparingCount = kotTickets.filter((t) => t.status === "preparing").length;
  const readyCount = kotTickets.filter((t) => t.status === "ready").length;

  const getElapsedTime = (isoDate) => {
    const mins = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000));
    return `${mins} min${mins > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="space-y-6 pb-12">
      <KOTConfirmationNotifier
        order={confirmedOrderAlert}
        onStartCooking={handleAcceptConfirmedOrder}
        onDismiss={() => setConfirmedOrderAlert(null)}
      />
      {/* Header & KOT Station Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              <span>KOT (Kitchen Order Display)</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-bold uppercase">
              Live KDS Terminal
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time kitchen tickets for dining tables and guest room service.
          </p>
        </div>

        {/* Live Counter Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>{pendingCount} Pending</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-blue-500" />
            <span>{preparingCount} Cooking</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{readyCount} Ready</span>
          </div>
        </div>
      </div>

      {/* Filter Bar: Stations & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Station & Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setDateFilter("today")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateFilter === "today"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today's KOTs Only
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateFilter === "all"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Days
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search KOT # or Room..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* KOT Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Active KOT Tickets</h3>
          <p className="text-xs text-slate-500 mt-1">All kitchen orders are cleared!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {paginatedTickets.map((ticket) => {
              const isPending = ticket.status === "pending";
              const isConfirmed = ticket.status === "confirmed";
              const isPreparing = ticket.status === "preparing";
              const isReady = ticket.status === "ready";

              return (
                <div
                  key={ticket.id}
                  className={`bg-white rounded-xl p-3 border transition-all flex flex-col justify-between shadow-2xs ${
                    isPending
                      ? "border-amber-300 bg-amber-50/10"
                      : isConfirmed || isPreparing
                      ? "border-blue-300 bg-blue-50/10"
                      : "border-emerald-300 bg-emerald-50/10"
                  }`}
                >
                  <div>
                    {/* Top Bar: KOT #, Location, Order Type */}
                    <div className="flex items-start justify-between pb-2 border-b border-slate-100 gap-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-800 tracking-tight">
                            {ticket.kotNumber}
                          </span>
                          <span
                            className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded border uppercase shrink-0 ${
                              isPending
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : isConfirmed || isPreparing
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 font-bold mt-0.5 truncate">
                          {ticket.locationType === "room" ? (
                            <Bed className="w-3 h-3 text-orange-500 shrink-0" />
                          ) : (
                            <Grid className="w-3 h-3 text-slate-500 shrink-0" />
                          )}
                          <span className="truncate">{ticket.location}</span>
                          <span>•</span>
                          <span className="text-slate-500 font-medium truncate">{ticket.orderType}</span>
                        </div>
                        {ticket.customerName && (
                          <div className="text-[10px] font-semibold text-slate-700 mt-0.5 flex items-center gap-1 truncate">
                            <span className="text-slate-400 font-normal shrink-0">Cust:</span>
                            <span className="text-slate-900 font-bold truncate" title={ticket.customerName}>{ticket.customerName}</span>
                            {ticket.customerPhone && ticket.customerPhone !== "0000000000" && (
                              <span className="text-slate-500 text-[9px] shrink-0">({ticket.customerPhone})</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-0.5 justify-end">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{getElapsedTime(ticket.createdAt)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Chef Note Alert */}
                    {ticket.chefNote && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">Note: {ticket.chefNote}</span>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="py-2.5 space-y-2">
                      {ticket.items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between text-xs pb-1.5 border-b border-slate-100 last:border-0 gap-1">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-orange-50 text-orange-600 border border-orange-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {item.quantity}x
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 text-[11px] leading-tight truncate">{item.itemName}</div>
                              {item.notes && (
                                <div className="text-[10px] text-amber-600 italic font-medium truncate">
                                  Opt: {item.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="text-[9px] text-slate-400 font-medium shrink-0">
                            {item.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(isPending || isConfirmed) && (
                        <button
                          type="button"
                          onClick={() => handleUpdateKOTStatus(ticket.orderId, "preparing")}
                          className="col-span-2 py-1.5 px-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Flame className="w-3 h-3" />
                          <span>Start Cooking</span>
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          type="button"
                          onClick={() => handleUpdateKOTStatus(ticket.orderId, "ready")}
                          className="col-span-2 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Order Ready</span>
                        </button>
                      )}

                      {isReady && (
                        <button
                          type="button"
                          onClick={() => handleUpdateKOTStatus(ticket.orderId, "completed")}
                          className="col-span-2 py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Served & Completed</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActivePrintTicket(ticket)}
                        className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-slate-500" />
                        <span>Print KOT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setChefNoteModalTicket(ticket);
                          setNewChefNote(ticket.chefNote || "");
                        }}
                        className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-slate-500" />
                        <span>Add Note</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs mt-4">
              <div className="text-xs font-semibold text-slate-500">
                Showing <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> of{" "}
                <span className="font-bold text-slate-800">{filteredTickets.length}</span> KOT Orders
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPage === 1
                      ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                <span className="text-xs font-bold text-slate-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    currentPage === totalPages
                      ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* PRINT KOT MODAL */}
      {activePrintTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl relative">
            <div className="text-center space-y-2 pb-4 border-b border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                KITCHEN ORDER TICKET (KOT)
              </div>
              <h2 className="text-lg font-bold text-slate-800">{activePrintTicket.kotNumber}</h2>
              <div className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block">
                {activePrintTicket.location} ({activePrintTicket.orderType})
              </div>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 text-[11px] font-medium">
                <span>Station: {activePrintTicket.station}</span>
                <span>Time: {new Date(activePrintTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {activePrintTicket.customerName && (
                <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-400">Customer: </span>
                  <span className="font-bold text-slate-900">{activePrintTicket.customerName}</span>
                  {activePrintTicket.customerPhone && activePrintTicket.customerPhone !== "0000000000" && (
                    <span className="text-slate-500 font-normal"> ({activePrintTicket.customerPhone})</span>
                  )}
                </div>
              )}

              {activePrintTicket.chefNote && (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                  Note: {activePrintTicket.chefNote}
                </div>
              )}

              <div className="border-t border-b border-slate-200 py-3 space-y-2 my-2">
                {activePrintTicket.items.map((it, i) => (
                  <div key={i} className="flex justify-between font-bold text-slate-800 text-xs">
                    <span>{it.quantity}x {it.itemName}</span>
                    <span className="text-slate-500 font-medium">{it.notes || "-"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActivePrintTicket(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setActivePrintTicket(null);
                }}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHEF NOTE MODAL */}
      {chefNoteModalTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl relative">
            <h2 className="text-base font-bold text-slate-800 mb-3">
              Add Chef / Kitchen Note ({chefNoteModalTicket.kotNumber})
            </h2>

            <textarea
              rows="3"
              value={newChefNote}
              onChange={(e) => setNewChefNote(e.target.value)}
              placeholder="e.g. Less oil, extra green chillies, serve with mint sauce..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
            />

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setChefNoteModalTicket(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChefNote}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
