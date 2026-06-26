import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://postgres:admin@localhost:5432/farmfresh",
});

async function main() {
  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
  `);
  console.log("products: branch_id column added.");
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
