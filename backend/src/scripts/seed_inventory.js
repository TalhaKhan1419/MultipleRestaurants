const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const db = require("../config/database");

async function seedInventory() {
  console.log("Starting Inventory Seeder...");

  try {
    const [restaurants] = await db.query("SELECT id, name FROM restaurants");
    if (!restaurants.length) {
      console.log("No restaurants found in database.");
      process.exit(0);
    }

    for (const rest of restaurants) {
      const restId = rest.id;
      console.log(`Seeding inventory for restaurant #${restId}: ${rest.name}`);

      // 1. Insert Categories
      const categoriesData = [
        { name: "Vegetables & Produce", desc: "Fresh daily farm vegetables" },
        { name: "Meat & Poultry", desc: "Fresh chicken, mutton, and meats" },
        { name: "Dairy Products", desc: "Milk, paneer, butter, ghee, cream" },
        { name: "Spices & Seasonings", desc: "Whole and powdered Indian spices" },
        { name: "Grocery & Staples", desc: "Rice, flour, pulses, cooking oils" },
        { name: "Beverages & Drinks", desc: "Soft drinks, syrups, tea, coffee" },
      ];

      const catMap = new Map();
      for (const cat of categoriesData) {
        const [existing] = await db.query(
          "SELECT id FROM inventory_categories WHERE restaurant_id = ? AND name = ?",
          [restId, cat.name]
        );
        let catId;
        if (existing.length) {
          catId = existing[0].id;
        } else {
          const [res] = await db.query(
            "INSERT INTO inventory_categories (restaurant_id, name, description) VALUES (?, ?, ?)",
            [restId, cat.name, cat.desc]
          );
          catId = res.insertId;
        }
        catMap.set(cat.name, catId);
      }

      // 2. Insert Suppliers
      const suppliersData = [
        { name: "Fresh Farm Produce Co.", phone: "9876543210", email: "orders@freshfarms.com", address: "Market Yard, Gate #2" },
        { name: "Metro Wholesale Supermarket", phone: "9812345678", email: "supply@metrowholesale.in", address: "Industrial Area, Plot 45" },
        { name: "Royal Quality Dairy", phone: "9765432109", email: "info@royaldairy.com", address: "Dairy Colony, Main Road" },
      ];

      const supMap = new Map();
      for (const sup of suppliersData) {
        const [existing] = await db.query(
          "SELECT id FROM suppliers WHERE restaurant_id = ? AND name = ?",
          [restId, sup.name]
        );
        let supId;
        if (existing.length) {
          supId = existing[0].id;
        } else {
          const [res] = await db.query(
            "INSERT INTO suppliers (restaurant_id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)",
            [restId, sup.name, sup.phone, sup.email, sup.address]
          );
          supId = res.insertId;
        }
        supMap.set(sup.name, supId);
      }

      // 3. Insert Inventory Items (Mix of In Stock, Low Stock, and Out of Stock)
      const itemsData = [
        {
          itemName: "Basmati Rice 1121",
          catName: "Grocery & Staples",
          supName: "Metro Wholesale Supermarket",
          unit: "KG",
          currentStock: 120,
          minimumStock: 20,
          maximumStock: 200,
          purchasePrice: 110.0,
          status: "in_stock",
          description: "Premium long grain royal basmati rice",
        },
        {
          itemName: "Refined Sunflower Oil",
          catName: "Grocery & Staples",
          supName: "Metro Wholesale Supermarket",
          unit: "LITRE",
          currentStock: 45,
          minimumStock: 10,
          maximumStock: 100,
          purchasePrice: 140.0,
          status: "in_stock",
          description: "Fortune refined sunflower oil tin",
        },
        {
          itemName: "Fresh Chicken Breast",
          catName: "Meat & Poultry",
          supName: "Fresh Farm Produce Co.",
          unit: "KG",
          currentStock: 35,
          minimumStock: 5,
          maximumStock: 50,
          purchasePrice: 240.0,
          status: "in_stock",
          description: "Boneless fresh chicken cuts",
        },
        {
          itemName: "Fresh Malai Paneer",
          catName: "Dairy Products",
          supName: "Royal Quality Dairy",
          unit: "KG",
          currentStock: 18,
          minimumStock: 4,
          maximumStock: 30,
          purchasePrice: 360.0,
          status: "in_stock",
          description: "Soft fresh malai paneer blocks",
        },
        {
          itemName: "Fresh Full Cream Milk",
          catName: "Dairy Products",
          supName: "Royal Quality Dairy",
          unit: "LITRE",
          currentStock: 40,
          minimumStock: 10,
          maximumStock: 60,
          purchasePrice: 56.0,
          status: "in_stock",
          description: "Daily fresh pasteurized milk",
        },
        // LOW STOCK ITEMS
        {
          itemName: "Red Tomatoes",
          catName: "Vegetables & Produce",
          supName: "Fresh Farm Produce Co.",
          unit: "KG",
          currentStock: 8,
          minimumStock: 15,
          maximumStock: 50,
          purchasePrice: 35.0,
          status: "low_stock",
          description: "Farm fresh red ripe tomatoes",
        },
        {
          itemName: "Fresh Onions",
          catName: "Vegetables & Produce",
          supName: "Fresh Farm Produce Co.",
          unit: "KG",
          currentStock: 12,
          minimumStock: 25,
          maximumStock: 80,
          purchasePrice: 30.0,
          status: "low_stock",
          description: "Nasik red onions 50kg bag",
        },
        {
          itemName: "Amul Butter 500g",
          catName: "Dairy Products",
          supName: "Royal Quality Dairy",
          unit: "PACKET",
          currentStock: 3,
          minimumStock: 10,
          maximumStock: 30,
          purchasePrice: 275.0,
          status: "low_stock",
          description: "Amul salted butter 500g packs",
        },
        {
          itemName: "Special Garam Masala",
          catName: "Spices & Seasonings",
          supName: "Metro Wholesale Supermarket",
          unit: "KG",
          currentStock: 1.5,
          minimumStock: 3.0,
          maximumStock: 10.0,
          purchasePrice: 450.0,
          status: "low_stock",
          description: "Aromatic blend ground masala powder",
        },
        // OUT OF STOCK ITEMS
        {
          itemName: "Pure Kashmiri Kesar",
          catName: "Spices & Seasonings",
          supName: "Metro Wholesale Supermarket",
          unit: "GRAM",
          currentStock: 0,
          minimumStock: 5,
          maximumStock: 20,
          purchasePrice: 350.0,
          status: "out_of_stock",
          description: "Organic Kashmiri saffron strands",
        },
        {
          itemName: "Fresh Heavy Cream",
          catName: "Dairy Products",
          supName: "Royal Quality Dairy",
          unit: "LITRE",
          currentStock: 0,
          minimumStock: 4,
          maximumStock: 15,
          purchasePrice: 210.0,
          status: "out_of_stock",
          description: "Amul fresh cooking cream 1L",
        },
        {
          itemName: "Ginger Garlic Paste",
          catName: "Grocery & Staples",
          supName: "Metro Wholesale Supermarket",
          unit: "KG",
          currentStock: 0,
          minimumStock: 5,
          maximumStock: 20,
          purchasePrice: 160.0,
          status: "out_of_stock",
          description: "Ready homemade style GG paste",
        },
      ];

      for (const item of itemsData) {
        const catId = catMap.get(item.catName) || null;
        const supId = supMap.get(item.supName) || null;

        const [existing] = await db.query(
          "SELECT id FROM inventory_items WHERE restaurant_id = ? AND item_name = ?",
          [restId, item.itemName]
        );

        let itemId;
        if (existing.length) {
          itemId = existing[0].id;
          await db.query(
            `UPDATE inventory_items
             SET category_id = ?, unit = ?, current_stock = ?, minimum_stock = ?,
                 maximum_stock = ?, purchase_price = ?, supplier_id = ?, description = ?, status = ?
             WHERE id = ? AND restaurant_id = ?`,
            [
              catId,
              item.unit,
              item.currentStock,
              item.minimumStock,
              item.maximumStock,
              item.purchasePrice,
              supId,
              item.description,
              item.status,
              itemId,
              restId,
            ]
          );
        } else {
          const [res] = await db.query(
            `INSERT INTO inventory_items
               (restaurant_id, category_id, item_name, unit, current_stock, minimum_stock, maximum_stock, purchase_price, supplier_id, description, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              restId,
              catId,
              item.itemName,
              item.unit,
              item.currentStock,
              item.minimumStock,
              item.maximumStock,
              item.purchasePrice,
              supId,
              item.description,
              item.status,
            ]
          );
          itemId = res.insertId;
        }

        // Insert sample stock transaction logs for testing history
        const [txCount] = await db.query(
          "SELECT COUNT(*) AS c FROM inventory_transactions WHERE restaurant_id = ? AND inventory_item_id = ?",
          [restId, itemId]
        );

        if (txCount[0].c === 0) {
          // Log initial Stock In
          await db.query(
            `INSERT INTO inventory_transactions
               (restaurant_id, inventory_item_id, transaction_type, quantity, previous_stock, new_stock, reason, note, created_by)
             VALUES (?, ?, 'STOCK_IN', ?, 0.000, ?, 'Initial Restock Purchase', 'Bulk supplier delivery', 'Store Manager')`,
            [restId, itemId, item.currentStock + 10, item.currentStock + 10]
          );

          if (item.currentStock > 0) {
            // Log kitchen consumption
            await db.query(
              `INSERT INTO inventory_transactions
                 (restaurant_id, inventory_item_id, transaction_type, quantity, previous_stock, new_stock, reason, note, created_by)
               VALUES (?, ?, 'STOCK_OUT', 10.000, ?, ?, 'Kitchen Consumption', 'Daily food preparation', 'Head Chef')`,
              [restId, itemId, item.currentStock + 10, item.currentStock]
            );
          }
        }
      }

      console.log(`Successfully seeded inventory items & transactions for restaurant #${restId}!`);
    }

    console.log("ALL INVENTORY SEEDING COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedInventory();
