function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.name === "MulterError") {
    return res.status(400).json({ success: false, message: error.code === "LIMIT_FILE_SIZE" ? "Image must be 20 MB or smaller" : error.message });
  }
  if (error.name === "ZodError") {
    return res.status(400).json({ success: false, message: "Invalid request data", errors: error.issues });
  }
  res.status(error.status || 500).json({ success: false, message: error.message || "Internal server error" });
}

module.exports = { notFound, errorHandler };
