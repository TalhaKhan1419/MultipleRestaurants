const bcrypt = require("./node_modules/bcryptjs");
const mysql = require("./node_modules/mysql2/promise");
const path = require("path");
require("./node_modules/dotenv").config({ path: path.resolve(__dirname, ".env") });
const { getEnv } = require("./src/config/env");

async function fixPasswords() {
  const correctHash = await bcrypt.hash("Password123!", 12);
  console.log("Generated valid bcrypt hash for Password123!:", correctHash);

  const testMatch = await bcrypt.compare("Password123!", correctHash);
  console.log("Verification test match:", testMatch);

  try {
    const connection = await mysql.createConnection(getEnv().db);
    
    // Update superadmin@restaurant.local and owner@demorestaurant.local passwords
    await connection.query(
      "UPDATE admins SET password_hash = ? WHERE email IN ('superadmin@restaurant.local', 'owner@demorestaurant.local')",
      [correctHash]
    );

    console.log("Successfully updated password_hash in database for superadmin@restaurant.local and owner@demorestaurant.local!");

    const [rows] = await connection.query("SELECT id, email, role, is_active FROM admins");
    console.log("Updated admins:", rows);

    await connection.end();
  } catch (err) {
    console.error("DB Error:", err.message);
  }
}

fixPasswords();
