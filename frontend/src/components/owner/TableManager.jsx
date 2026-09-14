import { useState, useEffect } from "react";
import { api } from "../../services/api";
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

export default function TableManager() {
  // Mode Switcher: 'tables' or 'rooms'
  const [activeMode, setActiveMode] = useState("rooms");
  const [roomServiceOn, setRoomServiceOn] = useState(true);

  // Dining Tables State
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guest Rooms State
  const [rooms, setRooms] = useState([
    { id: "r101", roomNumber: "101", type: "Deluxe Suite", floor: "1st Floor", capacity: 2, status: "occupied", activeOrdersCount: 1 },
    { id: "r102", roomNumber: "102", type: "Standard Room", floor: "1st Floor", capacity: 2, status: "available", activeOrdersCount: 0 },
    { id: "r201", roomNumber: "201", type: "Executive Suite", floor: "2nd Floor", capacity: 4, status: "occupied", activeOrdersCount: 2 },
    { id: "r202", roomNumber: "202", type: "Presidential Suite", floor: "2nd Floor", capacity: 4, status: "reserved", activeOrdersCount: 0 },
    { id: "r301", roomNumber: "301", type: "Deluxe Double", floor: "3rd Floor", capacity: 3, status: "cleaning", activeOrdersCount: 0 },
  ]);

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

      {/* ROOMS VIEW */}
      {activeMode === "rooms" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  room.status === "occupied" ? "border-amber-300 bg-amber-50/10" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-base shadow-xs">
                        <Bed className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-base">
                          Room {room.roomNumber}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span>{room.type}</span>
                          <span>•</span>
                          <span>{room.floor}</span>
                        </div>
                        {room.activeOrdersCount > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold mt-1">
                            <Bell className="w-3 h-3 animate-bounce" />
                            <span>{room.activeOrdersCount} active room order(s)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        roomStatusStyles[room.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  {/* Room Status Switcher */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                      Change Room Status
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["available", "occupied", "reserved", "cleaning"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleRoomStatusChange(room.id, st)}
                          className={`px-2 py-1 rounded-lg text-[10px] capitalize font-medium transition-all cursor-pointer ${
                            room.status === st
                              ? "bg-orange-500 text-white font-bold shadow-xs"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenQrModal(room, "room")}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Room QR</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditItem(room, "room")}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title="Edit Room"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Room"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLES VIEW */}
      {activeMode === "tables" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-base">
                      {table.tableNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{table.capacity} Seats</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    {table.status}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenQrModal(table, "table")}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Table QR</span>
                </button>
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
    </div>
  );
}
