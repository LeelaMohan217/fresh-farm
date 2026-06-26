import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://postgres:admin@localhost:5432/farmfresh",
});

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notification_reads (
      notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      admin_id        TEXT NOT NULL,
      read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (notification_id, admin_id)
    );
    ALTER TABLE notifications DROP COLUMN IF EXISTS read;
  `);
  console.log("notification_reads table created, read column dropped.");
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
