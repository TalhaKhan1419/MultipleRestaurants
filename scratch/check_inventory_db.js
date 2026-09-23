process.env.DB_HOST = "localhost";
process.env.DB_PORT = "3306";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = "root";
process.env.DB_NAME = "restaurant_management";

const db = require("../backend/src/config/database");

async function check() {
  const [cols] = await db.query("SHOW COLUMNS FROM users");
  console.log("User columns:", cols.map(c => c.Field));

  const [restaurants] = await db.query("SELECT id, name FROM restaurants");
  console.log("Restaurants:", restaurants);

  const [items] = await db.query("SELECT id, restaurant_id, item_name FROM inventory_items");
  console.log("Inventory items count:", items.length);
  console.log("Items per restaurant:", items.reduce((acc, i) => {
    acc[i.restaurant_id] = (acc[i.restaurant_id] || 0) + 1;
    return acc;
  }, {}));

  process.exit(0);
}

check();
