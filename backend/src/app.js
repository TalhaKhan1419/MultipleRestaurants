const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { getEnv } = require("./config/env");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();
const env = getEnv();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== "test") app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/restaurants", require("./routes/restaurant.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/menu", require("./routes/menu.routes"));
app.use("/api/public", require("./routes/public.routes"));
app.use("/api/tables", require("./routes/table.routes"));
app.use("/api/rooms", require("./routes/room.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/inventory", require("./routes/inventory.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use(notFound);
app.use(errorHandler);

module.exports = app;
