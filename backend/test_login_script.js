const bcrypt = require("./node_modules/bcryptjs");
const mysql = require("./node_modules/mysql2/promise");
const path = require("path");
require("./node_modules/dotenv").config({ path: path.resolve(__dirname, ".env") });
const { getEnv } = require("./src/config/env");

async function verify() {
  const connection = await mysql.createConnection(getEnv().db);
  const [rows] = await connection.query("SELECT id, email, password_hash, role, is_active FROM admins WHERE email IN ('superadmin@restaurant.local', 'owner@demorestaurant.local')");
  
  for (const admin of rows) {
    const isMatch = await bcrypt.compare("Password123!", admin.password_hash);
    console.log(`Admin ${admin.email} (${admin.role}): password match = ${isMatch}`);
  }

  await connection.end();
}

verify();
