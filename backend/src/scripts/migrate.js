const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { getEnv } = require("../config/env");

const migrationsDirectory = path.resolve(__dirname, "../migrations");

async function runMigrations() {
  const connection = await mysql.createConnection({ ...getEnv().db, multipleStatements: true });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_schema_migrations_filename (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [appliedRows] = await connection.query("SELECT filename FROM schema_migrations");
    const applied = new Set(appliedRows.map(({ filename }) => filename));
    const files = (await fs.readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipped ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDirectory, file), "utf8");
      await connection.query(sql);
      await connection.query("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
      console.log(`Applied ${file}`);
    }
  } finally {
    await connection.end();
  }
}

runMigrations().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
