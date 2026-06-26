import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://postgres:admin@localhost:5432/farmfresh",
});

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          SERIAL PRIMARY KEY,
      branch_id   INTEGER REFERENCES branches(id) ON DELETE CASCADE,
      order_id    TEXT,
      title       TEXT NOT NULL,
      body        TEXT,
      read        BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_branch_read
      ON notifications (branch_id, read, created_at DESC);
  `);
  console.log("notifications table created (or already exists).");
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
