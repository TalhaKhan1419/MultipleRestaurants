import { useState, useEffect } from "react";
import { api } from "../../services/api";
import CustomerDetailsModal from "./CustomerDetailsModal";
import TableOrderMenuModal from "./TableOrderMenuModal";
import KOTConfirmationNotifier from "./KOTConfirmationNotifier";
import { hasBeenAlerted } from "../../utils/orderAlertTracker";
import {
  Plus,
  QrCode,
  Users,
  Edit2,
  Trash2,
  X,
  Download,
  ExternalLink,
  AlertCircle,
  Clock,
  Bed,
  Grid,
  CheckCircle2,
  Bell,
  DoorClosed,
  Layers,
  Sparkles,
  User,
  Phone,
  FileText,
  LogOut,
  Calendar,
  Banknote
} from "lucide-react";

export default function TableManager({ initialMode = "tables", initialFilter = "all", hideModeSwitcher = false }) {
  // Mode Switcher: 'tables' or 'rooms'
  const [activeMode, setActiveMode] = useState(initialMode);
  const [roomServiceOn, setRoomServiceOn] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialFilter); // 'all', 'available', 'occupied'

  useEffect(() => {
    setActiveMode(initialMode);
    setStatusFilter(initialFilter);
  }, [initialMode, initialFilter]);

  // Dining Tables State
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderToastAlert, setOrderToastAlert] = useState(null);

  // Guest Rooms State
  const [rooms, setRooms] = useState([]);

  // Room Check-In Modal State
  const [roomCheckInModalOpen, setRoomCheckInModalOpen] = useState(false);
  const [selectedRoomForCheckIn, setSelectedRoomForCheckIn] = useState(null);
  const [checkInFormData, setCheckInFormData] = useState({
    customerName: "",
    customerPhone: "",
    idProofType: "",
    idProofNumber: "",
    checkInAt: "",
    paymentMethod: "cash",
  });
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState(null);

  // Room Active Guest Details Modal State (Occupied Room)
  const [roomDetailsModalOpen, setRoomDetailsModalOpen] = useState(false);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null);

  // Status Filter Computations
  const currentList = activeMode === "rooms" ? rooms : tables;
  const availableCount = currentList.filter((i) => i.status === "available").length;
  const occupiedCount = currentList.filter((i) => i.status === "occupied").length;
  const filteredRooms = hideModeSwitcher
    ? rooms.filter((r) => r.status === "occupied")
    : rooms.filter((r) => statusFilter === "all" || r.status === statusFilter);
  const filteredTables = tables.filter((t) => statusFilter === "all" || t.status === statusFilter);

  // Customer Popup & Order Modal State
  const [customerDetailsPopupOpen, setCustomerDetailsPopupOpen] = useState(false);
  const [targetItemForPopup, setTargetItemForPopup] = useState(null);
  const [targetItemType, setTargetItemType] = useState("Table");
  const [isMenuOrderModalOpen, setIsMenuOrderModalOpen] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState(null);
  const [initialCustomerName, setInitialCustomerName] = useState("");
  const [initialCustomerPhone, setInitialCustomerPhone] = useState("");

  // Modal States for Creating/Editing Room & Table Configuration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("room"); // 'table' or 'room'
  const [editingItem, setEditingItem] = useState(null);

  // Form Data for Tables & Rooms Configuration
  const [tableFormData, setTableFormData] = useState({
    tableNumber: "",
    capacity: 4,
    status: "available",
  });

  const [roomFormData, setRoomFormData] = useState({
    roomNumber: "",
    type: "Standard Room",
    floor: "1st Floor",
    capacity: 2,
    price: "",
    status: "available",
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // QR Code Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrData, setActiveQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.owner.getTables();
      setTables(data || []);
    } catch (err) {
      console.error(err);
      setTables([
        { id: "t1", tableNumber: "T-1", capacity: 4, status: "available", activeOrdersCount: 0 },
        { id: "t2", tableNumber: "T-2", capacity: 2, status: "occupied", activeOrdersCount: 1 },
        { id: "t3", tableNumber: "T-3", capacity: 6, status: "available", activeOrdersCount: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await api.owner.getRooms();
      if (Array.isArray(data)) {
        setRooms(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchRooms();
  }, []);

  const handleRoomCardClick = (room) => {
    if (room.status === "available") {
      // Available room click: Open Check-In Booking Form Modal
      setSelectedRoomForCheckIn(room);
      setCheckInFormData({
        customerName: "",
        customerPhone: "",
        idProofType: "",
        idProofNumber: "",
        checkInAt: "",
        paymentMethod: "cash",
      });
      setCheckInError(null);
      setRoomCheckInModalOpen(true);
    } else {
      // Occupied room click: Open Active Guest Details Modal (NOT edit room config!)
      setSelectedRoomDetails(room);
      setRoomDetailsModalOpen(true);
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoomForCheckIn) return;

    setCheckInLoading(true);
    setCheckInError(null);

    try {
      await api.owner.checkInRoom(selectedRoomForCheckIn.id, checkInFormData);
      setRoomCheckInModalOpen(false);
      setSelectedRoomForCheckIn(null);
      await fetchRooms();
    } catch (err) {
      setCheckInError(err.message || "Failed to check-in guest");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOutGuest = async (roomId) => {
    if (!window.confirm("Are you sure you want to check-out this guest and make the room available?")) return;
    try {
      await api.owner.checkOutRoom(roomId);
      setRoomDetailsModalOpen(false);
      setSelectedRoomDetails(null);
      fetchRooms();
    } catch (err) {
      alert("Failed to check out: " + (err.message || "Error"));
    }
  };

  const handleCardClick = (item, type = "Table") => {
    if (item.status === "available") {
      setTargetItemForPopup(item);
      setTargetItemType(type === "room" ? "Room" : "Table");
      setCustomerDetailsPopupOpen(true);
    } else {
      setSelectedTableForOrder(item);
      setInitialCustomerName("");
      setInitialCustomerPhone("");
      setIsMenuOrderModalOpen(true);
    }
  };

  const handleCustomerDetailsConfirm = (name, phone) => {
    setCustomerDetailsPopupOpen(false);
    setSelectedTableForOrder(targetItemForPopup);
    setInitialCustomerName(name);
    setInitialCustomerPhone(phone);
    setIsMenuOrderModalOpen(true);
  };

  // Open Modal for Table Configuration
  const handleOpenAddTable = () => {
    setModalType("table");
    setEditingItem(null);
    setTableFormData({
      tableNumber: `T-${tables.length + 1}`,
      capacity: 4,
      status: "available",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Room Configuration
  const handleOpenAddRoom = () => {
    setModalType("room");
    setEditingItem(null);
    setRoomFormData({
      roomNumber: `${rooms.length + 101}`,
      type: "Deluxe Suite",
      floor: "1st Floor",
      capacity: 2,
      price: "",
      status: "available",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditItem = (item, type) => {
    setModalType(type);
    setEditingItem(item);
    if (type === "table") {
      setTableFormData({
        tableNumber: item.tableNumber,
        capacity: item.capacity,
        status: item.status,
      });
    } else {
      setRoomFormData({
        roomNumber: item.roomNumber,
        type: item.type || "Standard Room",
        floor: item.floor || "1st Floor",
        capacity: item.capacity || 2,
        price: item.price != null ? item.price : "",
        status: item.status || "available",
      });
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      if (modalType === "table") {
        if (editingItem) {
          await api.owner.updateTable(editingItem.id, tableFormData);
        } else {
          await api.owner.createTable(tableFormData);
        }
        fetchTables();
      } else {
        if (editingItem) {
          await api.owner.updateRoom(editingItem.id, roomFormData);
        } else {
          await api.owner.createRoom(roomFormData);
        }
        fetchRooms();
      }
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message || "Failed to save");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    try {
      await api.owner.deleteTable(tableId);
      fetchTables();
    } catch (err) {
      alert(err.message || "Failed to delete table");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await api.owner.deleteRoom(roomId);
      fetchRooms();
    } catch (err) {
      alert(err.message || "Failed to delete room");
    }
  };

  const handleOpenQrModal = async (item, type) => {
    setQrLoading(true);
    setQrModalOpen(true);
    setActiveQrData(null);
    try {
      if (type !== "table") throw new Error("QR menus are currently available for dining tables only.");
      const qrData = await api.owner.getTableQRCode(item.id);
      setActiveQrData(qrData);
    } catch (err) {
      setModalError(err.message || "Unable to generate QR code");
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Switcher Bar & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {hideModeSwitcher ? "Hotel & Guest Rooms Management" : (activeMode === "rooms" ? "Guest Rooms & In-Room Service" : "Dining Floor & QR Tables")}
            </h1>
            
            <button
              type="button"
              onClick={() => setRoomServiceOn(!roomServiceOn)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                roomServiceOn
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-slate-100 text-slate-600 border-slate-300"
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${roomServiceOn ? "text-emerald-500" : "text-slate-400"}`} />
              <span>Room Orders {roomServiceOn ? "ON" : "OFF"}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage live guest rooms, guest check-in, payment status, and seating capacity.
          </p>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher Tabs */}
          {!hideModeSwitcher && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("rooms");
                  setStatusFilter("all");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeMode === "rooms"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Bed className="w-3.5 h-3.5" />
                <span>Rooms ({rooms.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode("tables");
                  setStatusFilter("all");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeMode === "tables"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Tables ({tables.length})</span>
              </button>
            </div>
          )}

          {/* Add Button */}
          {activeMode === "rooms" ? (
            <button
              type="button"
              onClick={handleOpenAddRoom}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Guest Room</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddTable}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dining Table</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards & Filter Tabs (Hidden in Standalone Hotel View) */}
      {!hideModeSwitcher && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Card */}
            <div
              onClick={() => setStatusFilter("all")}
              className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-between group ${
                statusFilter === "all" ? "border-orange-500 ring-2 ring-orange-100" : "border-slate-200"
              }`}
            >
              <div>
                <span className="text-xs font-medium text-slate-500">
                  {activeMode === "rooms" ? "Total Rooms" : "Total Tables"}
                </span>
                <div className="text-2xl font-black text-slate-800 mt-0.5">
                  {currentList.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                {activeMode === "rooms" ? <Bed className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </div>
            </div>

            {/* Available Card */}
            <div
              onClick={() => setStatusFilter("available")}
              className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-between group ${
                statusFilter === "available" ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"
              }`}
            >
              <div>
                <span className="text-xs font-medium text-slate-500">Available</span>
                <div className="text-2xl font-black text-emerald-600 mt-0.5">
                  {availableCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Booked / Occupied Card */}
            <div
              onClick={() => setStatusFilter("occupied")}
              className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center justify-between group ${
                statusFilter === "occupied" ? "border-amber-500 ring-2 ring-amber-100" : "border-slate-200"
              }`}
            >
              <div>
                <span className="text-xs font-medium text-slate-500">
                  {activeMode === "rooms" ? "Booked / Occupied" : "Occupied"}
                </span>
                <div className="text-2xl font-black text-amber-600 mt-0.5">
                  {occupiedCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Tabs Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                statusFilter === "all"
                  ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50"
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {currentList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("available")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                statusFilter === "available"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Available</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === "available" ? "bg-white/20 text-white" : "bg-emerald-200/60 text-emerald-800"}`}>
                {availableCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("occupied")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                statusFilter === "occupied"
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-amber-50 text-amber-700 border-amber-200/90 hover:bg-amber-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Occupied</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === "occupied" ? "bg-white/20 text-white" : "bg-amber-200/60 text-amber-800"}`}>
                {occupiedCount}
              </span>
            </button>
          </div>
        </>
      )}

      {/* ROOMS VIEW */}
      {activeMode === "rooms" && (
        <div className="space-y-4">
          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-2xs">
              <Bed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">
                {hideModeSwitcher || statusFilter === "occupied" ? "No Occupied Rooms Currently" : "No Rooms Found"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {hideModeSwitcher || statusFilter === "occupied"
                  ? "There are no live guest check-ins right now."
                  : "No rooms match the selected status filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2.5">
            {filteredRooms.map((room) => {
              const isOccupied = room.status === "occupied";
              const guest = room.activeBooking;

              return (
                <div
                  key={room.id}
                  onClick={() => handleRoomCardClick(room)}
                  className={`bg-white rounded-xl p-3 border shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between aspect-square cursor-pointer group hover:border-orange-400 ${
                    isOccupied ? "border-amber-300 bg-amber-50/20" : "border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs shadow-2xs group-hover:scale-105 transition-transform shrink-0 ${
                          isOccupied ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-orange-50 border-orange-200 text-orange-600"
                        }`}>
                          <Bed className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate group-hover:text-orange-600 transition-colors">
                            Room {room.roomNumber}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
                            <span>{room.type}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${
                          isOccupied
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {room.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-slate-400 font-medium truncate">{room.floor} · {room.capacity} Max</span>
                      {room.price != null && room.price !== "" && (
                        <span className={`font-black text-[11px] px-1.5 py-0.2 rounded border shrink-0 ${
                          isOccupied
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          ₹{room.price}
                        </span>
                      )}
                    </div>

                    {/* Guest Name & Check-In Tag if Occupied */}
                    {isOccupied && guest && (
                      <div className="mt-2 p-1.5 rounded-lg bg-amber-100/60 border border-amber-200 text-[10px] space-y-1">
                        <div className="font-bold text-amber-900 truncate flex items-center gap-1">
                          <User className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="truncate">{guest.customerName}</span>
                        </div>
                        <div className="text-[9px] text-amber-700 font-medium truncate">
                          {guest.idProofType}: {guest.idProofNumber}
                        </div>
                        {hideModeSwitcher && (
                          <div className="pt-1 flex items-center justify-between border-t border-amber-200/80 text-[9px]">
                            <span className="font-bold text-amber-900">Payment:</span>
                            {guest.paymentMethod === "unassigned" || guest.paymentMethod === "pay_at_checkout" || guest.paymentStatus === "pending" ? (
                              <span className="font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                ⏳ Unpaid
                              </span>
                            ) : (
                              <span className="font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Paid
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions for Room Card */}
                  <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleRoomCardClick(room)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-0.5 ${
                        isOccupied
                          ? "bg-amber-100 hover:bg-amber-600 text-amber-800 hover:text-white border-amber-300"
                          : "bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200"
                      }`}
                    >
                      <span>{isOccupied ? "View Guest" : "Book Room"}</span>
                    </button>

                    <div className="flex items-center gap-0.5">
                      {!isOccupied && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditItem(room, "room")}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Room Config"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TABLES VIEW */}
      {activeMode === "tables" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2.5">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              onClick={() => handleCardClick(table, "table")}
              className="bg-white rounded-xl p-3 border border-slate-200 hover:border-orange-400 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between aspect-square cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-black text-[11px] group-hover:scale-105 transition-transform shrink-0">
                      {table.tableNumber}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate group-hover:text-orange-600 transition-colors">
                        Table {table.tableNumber}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{table.capacity} Seats</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 ${
                      table.status === "occupied"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(table, "table");
                  }}
                  className={`px-2 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-0.5 transition-all cursor-pointer shadow-2xs ${
                    table.status === "occupied"
                      ? "bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border-amber-200 hover:border-amber-500"
                      : "bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border-orange-200 hover:border-orange-500"
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>{table.status === "occupied" ? "Add" : "Order"}</span>
                </button>

                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleOpenQrModal(table, "table")}
                    className="p-0.5 rounded text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                    title="Table QR"
                  >
                    <QrCode className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditItem(table, "table")}
                    className="p-0.5 rounded text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit Table"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Table"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. ROOM CHECK-IN / BOOKING FORM MODAL (Available Room Click) */}
      {roomCheckInModalOpen && selectedRoomForCheckIn && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 border border-slate-200 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600">
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
                    Book Room {selectedRoomForCheckIn.roomNumber}
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                    {selectedRoomForCheckIn.type} · {selectedRoomForCheckIn.floor}
                    {selectedRoomForCheckIn.price != null && selectedRoomForCheckIn.price !== "" && (
                      <span> · <span className="font-bold text-emerald-700">₹{selectedRoomForCheckIn.price}</span></span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoomCheckInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkInError && (
              <div className="mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkInError}</span>
              </div>
            )}

            <form onSubmit={handleCheckInSubmit} className="space-y-3 text-xs">
              {/* 2 Column Fields Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Customer Name */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1 text-[11px]">
                    <User className="w-3.5 h-3.5 text-orange-500" />
                    <span>Customer Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={checkInFormData.customerName}
                    onChange={(e) => setCheckInFormData({ ...checkInFormData, customerName: e.target.value })}
                    placeholder="Enter guest full name..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-orange-500" />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={checkInFormData.customerPhone}
                    onChange={(e) => setCheckInFormData({ ...checkInFormData, customerPhone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                {/* ID Proof Selection */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1 text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    <span>Valid ID Proof Type *</span>
                  </label>
                  <select
                    required
                    value={checkInFormData.idProofType}
                    onChange={(e) => setCheckInFormData({ ...checkInFormData, idProofType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="" disabled>-- Select ID Proof --</option>
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>

                {/* ID Proof Number */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                    ID Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={checkInFormData.idProofNumber}
                    onChange={(e) => setCheckInFormData({ ...checkInFormData, idProofNumber: e.target.value })}
                    placeholder="Enter ID number..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white font-mono"
                  />
                </div>

                {/* Check-In Date & Time (1 column width) */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    <span>Check-In Date & Time *</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={checkInFormData.checkInAt}
                    onChange={(e) => setCheckInFormData({ ...checkInFormData, checkInAt: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              {/* Payment Mode Selection (Horizontal 4 chips) */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-slate-800 font-extrabold mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Select Payment Mode *</span>
                  </span>
                  {selectedRoomForCheckIn.price != null && selectedRoomForCheckIn.price !== "" && (
                    <span className="text-emerald-700 font-black text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Tariff: ₹{selectedRoomForCheckIn.price}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCheckInFormData({ ...checkInFormData, paymentMethod: "cash" })}
                    className={`p-1.5 rounded-lg border text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      checkInFormData.paymentMethod === "cash"
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>💸</span>
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckInFormData({ ...checkInFormData, paymentMethod: "upi" })}
                    className={`p-1.5 rounded-lg border text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      checkInFormData.paymentMethod === "upi"
                        ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>📱</span>
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckInFormData({ ...checkInFormData, paymentMethod: "card" })}
                    className={`p-1.5 rounded-lg border text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      checkInFormData.paymentMethod === "card"
                        ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>💳</span>
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckInFormData({ ...checkInFormData, paymentMethod: "unassigned" })}
                    className={`p-1.5 rounded-lg border text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      checkInFormData.paymentMethod === "unassigned"
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>⏳</span>
                    <span>Later</span>
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-2.5 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoomCheckInModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkInLoading}
                  className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {checkInLoading ? "Processing..." : "Confirm Booking & Pay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. OCCUPIED GUEST ROOM DETAILS MODAL (Occupied Room Click) */}
      {roomDetailsModalOpen && selectedRoomDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Room {selectedRoomDetails.roomNumber} Details
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {selectedRoomDetails.type} · {selectedRoomDetails.floor}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoomDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Guest Booking Info */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Guest Name</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedRoomDetails.activeBooking?.customerName || "Occupied"}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Phone Number</span>
                <span className="font-semibold text-slate-800">
                  {selectedRoomDetails.activeBooking?.customerPhone || "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  {selectedRoomDetails.activeBooking?.idProofType || "ID Proof"}
                </span>
                <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  {selectedRoomDetails.activeBooking?.idProofNumber || "N/A"}
                </span>
              </div>

              {selectedRoomDetails.price != null && selectedRoomDetails.price !== "" && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Room Price</span>
                  <span className="font-black text-amber-700 text-xs bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                    ₹{selectedRoomDetails.price}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Payment Status</span>
                {selectedRoomDetails.activeBooking?.paymentMethod === "unassigned" || selectedRoomDetails.activeBooking?.paymentMethod === "pay_at_checkout" || selectedRoomDetails.activeBooking?.paymentStatus === "pending" ? (
                  <span className="font-black text-rose-800 text-xs bg-rose-100 px-2 py-0.5 rounded border border-rose-300 uppercase flex items-center gap-1">
                    <span>⏳</span>
                    <span>UNPAID</span>
                  </span>
                ) : (
                  <span className="font-black text-emerald-800 text-xs bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase flex items-center gap-1">
                    <span>✓</span>
                    <span>PAID</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Check-In Time</span>
                <span className="font-semibold text-slate-700">
                  {selectedRoomDetails.activeBooking?.checkInAt
                    ? new Date(selectedRoomDetails.activeBooking.checkInAt).toLocaleString()
                    : "Active"}
                </span>
              </div>
            </div>

            {/* Actions: Room Order or Check-Out */}
            <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRoomDetailsModalOpen(false);
                  setSelectedTableForOrder(selectedRoomDetails);
                  setInitialCustomerName(selectedRoomDetails.activeBooking?.customerName || "");
                  setInitialCustomerPhone(selectedRoomDetails.activeBooking?.customerPhone || "");
                  setIsMenuOrderModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Room Order</span>
              </button>

              <button
                type="button"
                onClick={() => handleCheckOutGuest(selectedRoomDetails.id)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Check-Out Guest</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT ROOM OR TABLE CONFIGURATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">
                {modalType === "room"
                  ? editingItem
                    ? "Edit Guest Room Config"
                    : "Add New Guest Room"
                  : editingItem
                  ? "Edit Table"
                  : "Add Dining Table"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {modalType === "room" ? (
                <>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Room Number / Name</label>
                    <input
                      type="text"
                      required
                      value={roomFormData.roomNumber}
                      onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })}
                      placeholder="e.g. 101, 102, Suite 201"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Room Category / Type</label>
                    <select
                      value={roomFormData.type}
                      onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    >
                      <option value="Standard Room">Standard Room</option>
                      <option value="Deluxe Suite">Deluxe Suite</option>
                      <option value="Executive Suite">Executive Suite</option>
                      <option value="Presidential Suite">Presidential Suite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Floor Level</label>
                    <select
                      value={roomFormData.floor}
                      onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    >
                      <option value="1st Floor">1st Floor</option>
                      <option value="2nd Floor">2nd Floor</option>
                      <option value="3rd Floor">3rd Floor</option>
                      <option value="4th Floor">4th Floor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Room Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={roomFormData.price}
                      onChange={(e) => setRoomFormData({ ...roomFormData, price: e.target.value })}
                      placeholder="e.g. 1500"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Table Number</label>
                    <input
                      type="text"
                      required
                      value={tableFormData.tableNumber}
                      onChange={(e) => setTableFormData({ ...tableFormData, tableNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Seating Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={tableFormData.capacity}
                      onChange={(e) => setTableFormData({ ...tableFormData, capacity: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Initial Status</label>
                    <select
                      value={tableFormData.status || "available"}
                      onChange={(e) => setTableFormData({ ...tableFormData, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {modalLoading ? "Saving..." : editingItem ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl relative text-center">
            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 absolute right-4 top-4 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold text-slate-800 mb-1">
              {activeQrData?.tableNumber} In-Room Order QR
            </h2>
            <p className="text-xs text-slate-500 mb-4">Scan QR to order food & beverages directly to this room</p>

            <div className="bg-slate-50 p-4 rounded-2xl inline-block border border-slate-200">
              <img
                src={activeQrData?.qrDataUrl}
                alt="QR Code"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <a
                href={activeQrData?.qrDataUrl}
                download="room-qr.png"
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Popup Modal */}
      <CustomerDetailsModal
        isOpen={customerDetailsPopupOpen}
        onClose={() => setCustomerDetailsPopupOpen(false)}
        targetItem={targetItemForPopup}
        itemType={targetItemType}
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
        onOrderPlaced={(newOrd) => {
          fetchTables();
          if (newOrd && !hasBeenAlerted(newOrd)) {
            setOrderToastAlert(newOrd);
          }
        }}
      />

      {/* Order Alert Banner */}
      <KOTConfirmationNotifier
        order={orderToastAlert}
        onStartCooking={() => setOrderToastAlert(null)}
        onDismiss={() => setOrderToastAlert(null)}
      />
    </div>
  );
}
