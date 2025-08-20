require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Create PostgreSQL connection pool using environment variables
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'clavehr_identity',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function applySchema(schemaFilePath) {
    console.log(`Applying consolidated schema: ${path.basename(schemaFilePath)}`);
    const sql = fs.readFileSync(schemaFilePath, 'utf8');
    await pool.query(sql);
    console.log('✅ Schema applied successfully');
}

async function main() {
    try {
        const schemaPath = path.join(__dirname, '../schema/schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.error(
                '❌ schema.sql not found. Generate it first via docker/init-all-db.sh or docker/build-schemas.js',
            );
            process.exit(1);
        }
        await applySchema(schemaPath);
    } catch (error) {
        console.error('❌ Error applying schema:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
