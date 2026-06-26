import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://postgres:admin@localhost:5432/farmfresh",
});

async function main() {
  await pool.query(`
    ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'order',
      ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE CASCADE;
  `);
  console.log("notifications: type + product_id columns added.");
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
