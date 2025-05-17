require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

async function executeMigration(filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  console.log(`Executing migration: ${path.basename(filePath)}`);
  try {
    await pool.query(sql);
    console.log(`✅ Migration successful: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${path.basename(filePath)}`);
    console.error(error);
    return false;
  }
}

async function runMigrations() {
  console.log("Starting migrations...");

  // Run init.sql first to set up extensions and functions
  const initPath = path.join(__dirname, "../schema/init.sql");
  try {
    if (fs.existsSync(initPath)) {
      const success = await executeMigration(initPath);
      if (!success) {
        console.error("Initialization failed. Stopping.");
        process.exit(1);
      }
    } else {
      console.warn("Warning: init.sql not found");
    }
  } catch (error) {
    console.error("Error during initialization:", error);
    process.exit(1);
  }

  // Read schema.sql next
  const schemaPath = path.join(__dirname, "../schema/schema.sql");
  try {
    if (fs.existsSync(schemaPath)) {
      const success = await executeMigration(schemaPath);
      if (!success) {
        console.error("Schema migration failed. Stopping.");
        process.exit(1);
      }
    } else {
      console.warn("Warning: schema.sql not found");
    }
  } catch (error) {
    console.error("Error reading schema file:", error);
    process.exit(1);
  }

  // Read and execute all migration files in order
  const migrationsDir = path.join(__dirname, "../schema/migrations");
  try {
    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort(); // Sort to ensure correct order

      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const success = await executeMigration(filePath);
        if (!success) {
          console.error(`Migration ${file} failed. Stopping.`);
          process.exit(1);
        }
      }
    } else {
      console.warn("Warning: migrations directory not found");
    }
  } catch (error) {
    console.error("Error reading migrations directory:", error);
    process.exit(1);
  }

  console.log("All migrations completed successfully.");
  await pool.end();
}

// Run migrations
runMigrations().catch((error) => {
  console.error("Unhandled error during migrations:", error);
  process.exit(1);
});
