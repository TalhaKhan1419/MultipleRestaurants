const router = require("express").Router();
const roomController = require("../controllers/room.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireTenant } = require("../middleware/tenant.middleware");

router.use(authenticate, requireTenant);

router.get("/", roomController.listRooms);
router.post("/", roomController.createRoom);
router.get("/:id", roomController.getRoom);
router.put("/:id", roomController.updateRoom);
router.delete("/:id", roomController.deleteRoom);
router.post("/:id/check-in", roomController.checkInRoom);
router.post("/:id/check-out", roomController.checkOutRoom);

module.exports = router;
