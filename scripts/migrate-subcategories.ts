import pool from "../src/lib/pg";

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Allow products.category_id to be NULL temporarily
    await client.query(`ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL`);

    // Null out all product category references
    await client.query(`UPDATE products SET category_id = NULL`);

    // Delete all existing categories
    await client.query(`DELETE FROM categories`);

    // Add parent_id column
    await client.query(`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES categories(id) ON DELETE CASCADE
    `);

    await client.query("COMMIT");
    console.log("✓ Subcategories migration complete — all old categories removed, parent_id added.");
    console.log("  Products category_id is now nullable until you re-assign them.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
