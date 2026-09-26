const db = require("../config/database");

class RoomRepository {
  async getRooms(restaurantId) {
    const [rows] = await db.query(
      `SELECT r.*,
              b.id as booking_id,
              b.customer_name,
              b.customer_phone,
              b.id_proof_type,
              b.id_proof_number,
              b.check_in_at,
              b.status as booking_status,
              b.payment_method,
              b.payment_status
       FROM guest_rooms r
       LEFT JOIN room_bookings b ON r.id = b.room_id AND b.status = 'active'
       WHERE r.restaurant_id = ?
       ORDER BY r.room_number ASC`,
      [restaurantId]
    );

    return rows.map((row) => ({
      id: row.id,
      restaurantId: row.restaurant_id,
      roomNumber: row.room_number,
      type: row.room_type,
      floor: row.floor,
      capacity: row.capacity,
      price: row.price != null ? Number(row.price) : null,
      status: row.status,
      activeBooking: row.booking_id
        ? {
            id: row.booking_id,
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            idProofType: row.id_proof_type,
            idProofNumber: row.id_proof_number,
            checkInAt: row.check_in_at,
            status: row.booking_status,
            paymentMethod: row.payment_method || "cash",
            paymentStatus: row.payment_status || "paid",
          }
        : null,
    }));
  }

  async createRoom(restaurantId, { roomNumber, type, floor, capacity, price, status = "available" }) {
    const parsedPrice = price !== undefined && price !== null && price !== "" ? Number(price) : null;

    const [result] = await db.query(
      `INSERT INTO guest_rooms (restaurant_id, room_number, room_type, floor, capacity, price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [restaurantId, roomNumber, type || "Standard Room", floor || "1st Floor", capacity || 2, parsedPrice, status]
    );
    return this.getRoomById(restaurantId, result.insertId);
  }

  async getRoomById(restaurantId, id) {
    const [rows] = await db.query(
      `SELECT r.*,
              b.id as booking_id,
              b.customer_name,
              b.customer_phone,
              b.id_proof_type,
              b.id_proof_number,
              b.check_in_at,
              b.status as booking_status,
              b.payment_method,
              b.payment_status
       FROM guest_rooms r
       LEFT JOIN room_bookings b ON r.id = b.room_id AND b.status = 'active'
       WHERE r.restaurant_id = ? AND r.id = ?`,
      [restaurantId, id]
    );

    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      roomNumber: row.room_number,
      type: row.room_type,
      floor: row.floor,
      capacity: row.capacity,
      price: row.price != null ? Number(row.price) : null,
      status: row.status,
      activeBooking: row.booking_id
        ? {
            id: row.booking_id,
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            idProofType: row.id_proof_type,
            idProofNumber: row.id_proof_number,
            checkInAt: row.check_in_at,
            status: row.booking_status,
            paymentMethod: row.payment_method || "cash",
            paymentStatus: row.payment_status || "paid",
          }
        : null,
    };
  }

  async updateRoom(restaurantId, id, { roomNumber, type, floor, capacity, price, status }) {
    await db.query(
      `UPDATE guest_rooms
       SET room_number = COALESCE(?, room_number),
           room_type = COALESCE(?, room_type),
           floor = COALESCE(?, floor),
           capacity = COALESCE(?, capacity),
           price = COALESCE(?, price),
           status = COALESCE(?, status)
       WHERE restaurant_id = ? AND id = ?`,
      [roomNumber, type, floor, capacity, price, status, restaurantId, id]
    );
    return this.getRoomById(restaurantId, id);
  }

  async deleteRoom(restaurantId, id) {
    const [result] = await db.query(
      "DELETE FROM guest_rooms WHERE restaurant_id = ? AND id = ?",
      [restaurantId, id]
    );
    return result.affectedRows > 0;
  }

  async checkInRoom(restaurantId, roomId, { customerName, customerPhone, idProofType, idProofNumber, checkInAt, paymentMethod = "cash" }) {
    const checkInTimestamp = checkInAt ? new Date(checkInAt) : new Date();
    const paymentStatus = (paymentMethod === "unassigned" || paymentMethod === "pay_at_checkout") ? "pending" : "paid";

    // 1. Deactivate any existing active bookings for safety
    await db.query(
      `UPDATE room_bookings SET status = 'completed', check_out_at = CURRENT_TIMESTAMP WHERE room_id = ? AND status = 'active'`,
      [roomId]
    );

    // 2. Create new active room booking
    const [result] = await db.query(
      `INSERT INTO room_bookings (restaurant_id, room_id, customer_name, customer_phone, id_proof_type, id_proof_number, check_in_at, status, payment_method, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [restaurantId, roomId, customerName, customerPhone, idProofType, idProofNumber, checkInTimestamp, paymentMethod || "cash", paymentStatus]
    );

    // 3. Mark room status as occupied
    await db.query(
      `UPDATE guest_rooms SET status = 'occupied' WHERE restaurant_id = ? AND id = ?`,
      [restaurantId, roomId]
    );

    return this.getRoomById(restaurantId, roomId);
  }

  async checkOutRoom(restaurantId, roomId) {
    // 1. Update room booking to completed
    await db.query(
      `UPDATE room_bookings
       SET status = 'completed', check_out_at = CURRENT_TIMESTAMP
       WHERE restaurant_id = ? AND room_id = ? AND status = 'active'`,
      [restaurantId, roomId]
    );

    // 2. Update room status to available
    await db.query(
      `UPDATE guest_rooms SET status = 'available' WHERE restaurant_id = ? AND id = ?`,
      [restaurantId, roomId]
    );

    return this.getRoomById(restaurantId, roomId);
  }

  async getRoomQRCode(restaurantId, id) {
    const room = await this.getRoomById(restaurantId, id);
    if (!room) {
      const error = new Error("Room not found");
      error.status = 404;
      throw error;
    }

    const QRCode = require("qrcode");
    const { getEnv } = require("../config/env");

    const clientOrigin = getEnv().clientOrigin || "http://localhost:5173";
    const targetUrl = `${clientOrigin}/menu?roomId=${room.id}&roomNumber=${encodeURIComponent(room.roomNumber)}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      type: room.type,
      url: targetUrl,
      qrDataUrl,
    };
  }
}

module.exports = new RoomRepository();
