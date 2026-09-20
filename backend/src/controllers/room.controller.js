const roomRepo = require("../repositories/room.repository");

const getRestaurantId = (req) => {
  return req.tenant?.restaurantId || req.tenantId || req.user?.restaurantId;
};

exports.listRooms = async (req, res, next) => {
  try {
    const restaurantId = getRestaurantId(req);
    const rooms = await roomRepo.getRooms(restaurantId);
    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { roomNumber, type, floor, capacity, price, status } = req.body;
    if (!roomNumber) {
      return res.status(400).json({ message: "Room number is required" });
    }
    const room = await roomRepo.createRoom(restaurantId, {
      roomNumber,
      type,
      floor,
      capacity,
      price,
      status,
    });
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};

exports.getRoom = async (req, res, next) => {
  try {
    const restaurantId = getRestaurantId(req);
    const room = await roomRepo.getRoomById(restaurantId, req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    next(error);
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const restaurantId = getRestaurantId(req);
    const room = await roomRepo.updateRoom(restaurantId, req.params.id, req.body);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    next(error);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    const restaurantId = getRestaurantId(req);
    const success = await roomRepo.deleteRoom(restaurantId, req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.checkInRoom = async (req, res, next) => {
  try {
    const restaurantId = getRestaurantId(req);
    const { customerName, customerPhone, idProofType, idProofNumber, checkInAt, paymentMethod } = req.body;

    if (!customerName || !customerPhone || !idProofType || !idProofNumber) {
      return res.status(400).json({
        message: "Customer name, phone number, ID proof type, and ID proof number are mandatory for room check-in.",
      });
    }

    const room = await roomRepo.checkInRoom(restaurantId, req.params.id, {
      customerName,
      customerPhone,
      idProofType,
      idProofNumber,
      checkInAt,
      paymentMethod: paymentMethod || "cash",
    });

    res.json(room);
  } catch (error) {
    next(error);
  }
};

exports.checkOutRoom = async (req, res, next) => {
  try {
    const restaurantId = getRestaurantId(req);
    const room = await roomRepo.checkOutRoom(restaurantId, req.params.id);
    res.json(room);
  } catch (error) {
    next(error);
  }
};
