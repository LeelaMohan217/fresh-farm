import pool from "../src/lib/pg";

async function migrate() {
  await pool.query(`
    ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS image_url    TEXT,
      ADD COLUMN IF NOT EXISTS active       BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS display_order INT    NOT NULL DEFAULT 0
  `);
  console.log("✓ categories table migrated");
  await pool.end();
}

migrate().catch((e) => { console.error(e); process.exit(1); });
