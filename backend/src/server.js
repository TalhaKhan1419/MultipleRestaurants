require("dotenv").config();
const app = require("./app");
const { getEnv } = require("./config/env");
const db = require("./config/database");

const { port } = getEnv();

async function startServer() {
  try {
    const connection = await db.getConnection();
    connection.release();
    console.log("MySQL database connected successfully.");
  } catch (error) {
    console.warn("MySQL Connection Warning:", error.message);
    console.warn("Starting API server in standalone mode without active database connection.");
  }

  app.listen(port, () => console.log(`API listening on port ${port}`));
}
startServer();

