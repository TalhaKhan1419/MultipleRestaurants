const { pool } = require("./src/config/db");
const { hashPassword } = require("./src/utils/password");

async function main() {
  const email = "sahbazkhan@gmail.com";
  const rawPassword = "podium1419";
  const fullName = "Shahbaz Khan";
  const phone = "9999999999";
  const role = "super_admin";

  try {
    const passwordHash = await hashPassword(rawPassword);

    const [existing] = await pool.query("SELECT * FROM admins WHERE email = ?", [email]);

    if (existing.length > 0) {
      await pool.query(
        "UPDATE admins SET password_hash = ?, role = ?, is_active = 1 WHERE email = ?",
        [passwordHash, role, email]
      );
      console.log(`Successfully updated existing admin ${email} to role '${role}' and updated password.`);
    } else {
      await pool.query(
        "INSERT INTO admins (restaurant_id, full_name, phone, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
        [null, fullName, phone, email, passwordHash, role]
      );
      console.log(`Successfully created new admin ${email} with role '${role}'.`);
    }

    const [rows] = await pool.query("SELECT id, full_name, email, phone, role, is_active FROM admins WHERE email = ?", [email]);
    console.log("Current user record in DB:", rows[0]);
  } catch (err) {
    console.error("Error setting up superadmin:", err);
  } finally {
    process.exit(0);
  }
}

main();
