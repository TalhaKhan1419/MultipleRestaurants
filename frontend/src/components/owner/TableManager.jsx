import { useState, useEffect } from "react";
import { api } from "../../services/api";
import CustomerDetailsModal from "./CustomerDetailsModal";
import TableOrderMenuModal from "./TableOrderMenuModal";
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
  Sparkles
} from "lucide-react";

export default function TableManager({ initialMode = "tables" }) {
  // Mode Switcher: 'tables' or 'rooms'
  const [activeMode, setActiveMode] = useState(initialMode);
  const [roomServiceOn, setRoomServiceOn] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'available', 'occupied'

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  // Dining Tables State
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guest Rooms State
  const [rooms, setRooms] = useState([
    { id: "r101", roomNumber: "101", type: "Deluxe Suite", floor: "1st Floor", capacity: 2, status: "occupied", activeOrdersCount: 1 },
    { id: "r102", roomNumber: "102", type: "Standard Room", floor: "1st Floor", capacity: 2, status: "available", activeOrdersCount: 0 },
    { id: "r201", roomNumber: "201", type: "Executive Suite", floor: "2nd Floor", capacity: 4, status: "occupied", activeOrdersCount: 2 },
    { id: "r202", roomNumber: "202", type: "Presidential Suite", floor: "2nd Floor", capacity: 4, status: "available", activeOrdersCount: 0 },
    { id: "r301", roomNumber: "301", type: "Deluxe Double", floor: "3rd Floor", capacity: 3, status: "available", activeOrdersCount: 0 },
  ]);

  // Status Filter Computations
  const currentList = activeMode === "rooms" ? rooms : tables;
  const availableCount = currentList.filter((i) => i.status === "available").length;
  const occupiedCount = currentList.filter((i) => i.status === "occupied").length;
  const filteredRooms = rooms.filter((r) => statusFilter === "all" || r.status === statusFilter);
  const filteredTables = tables.filter((t) => statusFilter === "all" || t.status === statusFilter);

  // Customer Popup & Order Modal State
  const [customerDetailsPopupOpen, setCustomerDetailsPopupOpen] = useState(false);
  const [targetItemForPopup, setTargetItemForPopup] = useState(null);
  const [targetItemType, setTargetItemType] = useState("Table");
  const [isMenuOrderModalOpen, setIsMenuOrderModalOpen] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState(null);
  const [initialCustomerName, setInitialCustomerName] = useState("");
  const [initialCustomerPhone, setInitialCustomerPhone] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("room"); // 'table' or 'room'
  const [editingItem, setEditingItem] = useState(null);

  // Form Data for Tables & Rooms
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
      // Default fallback sample tables
      setTables([
        { id: "t1", tableNumber: "T-1", capacity: 4, status: "available", activeOrdersCount: 0 },
        { id: "t2", tableNumber: "T-2", capacity: 2, status: "occupied", activeOrdersCount: 1 },
        { id: "t3", tableNumber: "T-3", capacity: 6, status: "available", activeOrdersCount: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

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

  // Open Modal for Table
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

  // Open Modal for Room
  const handleOpenAddRoom = () => {
    setModalType("room");
    setEditingItem(null);
    setRoomFormData({
      roomNumber: `${rooms.length + 101}`,
      type: "Deluxe Suite",
      floor: "1st Floor",
      capacity: 2,
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
        // Room creation / edit logic
        if (editingItem) {
          setRooms(rooms.map((r) => (r.id === editingItem.id ? { ...r, ...roomFormData } : r)));
        } else {
          const newRoom = {
            id: `r_${Date.now()}`,
            ...roomFormData,
            activeOrdersCount: 0,
          };
          setRooms([...rooms, newRoom]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.message || "Failed to save");
    } finally {
      setModalLoading(false);
    }
  };

  const handleTableStatusChange = async (tableId, newStatus) => {
    try {
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t)));
      await api.owner.updateTableStatus(tableId, newStatus);
      fetchTables();
    } catch (err) {
      console.error(err);
      fetchTables();
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

  const handleRoomStatusChange = (roomId, newStatus) => {
    setRooms(rooms.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r)));
  };

  const handleDeleteRoom = (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    setRooms(rooms.filter((r) => r.id !== roomId));
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

  const roomStatusStyles = {
    available: "bg-emerald-50 text-emerald-700 border-emerald-200",
    occupied: "bg-amber-50 text-amber-700 border-amber-200",
    reserved: "bg-blue-50 text-blue-700 border-blue-200",
    cleaning: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Switcher Bar & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {activeMode === "rooms" ? "Guest Rooms & In-Room Service" : "Dining Floor & QR Tables"}
            </h1>
            
            {/* Room service ON / OFF toggle switch */}
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
            Manage live guest rooms, seating capacity, and QR room-service ordering.
          </p>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveMode("rooms")}
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
              onClick={() => setActiveMode("tables")}
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

      {/* Live Status Summary & Filter Bar (Total, Available, Occupied) */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-2 shrink-0">
          Live Status Overview:
        </span>

        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
            statusFilter === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <span>All {activeMode === "rooms" ? "Rooms" : "Tables"}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
            {currentList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("available")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
            statusFilter === "available"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
              : "bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span>Available</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === "available" ? "bg-white/20 text-white" : "bg-emerald-200/60 text-emerald-800"}`}>
            {availableCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("occupied")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
            statusFilter === "occupied"
              ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
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

      {/* ROOMS VIEW */}
      {activeMode === "rooms" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2.5">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleOpenEditItem(room, "room")}
                className={`bg-white rounded-xl p-3 border shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between aspect-square cursor-pointer group hover:border-orange-400 ${
                  room.status === "occupied" ? "border-amber-300 bg-amber-50/10" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-xs shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                        <Bed className="w-4 h-4 text-orange-600" />
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
                        room.status === "occupied"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium mt-1">
                    {room.floor}
                  </div>

                  {room.activeOrdersCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-1.5">
                      <Bell className="w-3 h-3 animate-bounce shrink-0" />
                      <span className="truncate">{room.activeOrdersCount} order(s)</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions for Room */}
                <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleOpenEditItem(room, "room")}
                    className="px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
                    title="Edit Room"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(room.id)}
                    className="px-1.5 py-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
                    title="Delete Room"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
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

      {/* ADD / EDIT ROOM OR TABLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">
                {modalType === "room"
                  ? editingItem
                    ? "Edit Guest Room"
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

      {/* Customer Details Popup Modal (Screenshot Design) */}
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
        onOrderPlaced={() => fetchTables()}
      />
    </div>
  );
}
