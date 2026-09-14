const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(Object.assign(new Error("Only image files are allowed"), { status: 400 }));
    }
    return callback(null, true);
  },
});
module.exports = { upload };
