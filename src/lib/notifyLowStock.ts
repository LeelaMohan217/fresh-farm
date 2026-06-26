import pool from "@/lib/pg";

const LOW_STOCK_THRESHOLD = 10;

/**
 * Fire a low_stock notification for a product if its current stock is at or
 * below the threshold. The branch is derived from the product itself.
 * Skips if an unread low_stock alert already exists to avoid spamming.
 */
export async function notifyLowStock(productId: number) {
  const { rows } = await pool.query(
    `SELECT name, stock, branch_id FROM products WHERE id = $1`,
    [productId]
  );
  if (!rows.length) return;

  const { name, stock, branch_id: branchId } = rows[0];
  if (Number(stock) > LOW_STOCK_THRESHOLD) return;

  // Deduplicate: skip if an unread low_stock alert already exists for this product + branch
  const { rows: existing } = await pool.query(
    `SELECT 1 FROM notifications n
     WHERE n.type = 'low_stock' AND n.product_id = $1
       AND (n.branch_id = $2 OR (n.branch_id IS NULL AND $2::int IS NULL))
       AND NOT EXISTS (
         SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id
       )
     LIMIT 1`,
    [productId, branchId]
  );
  if (existing.length > 0) return;

  const stockLabel = Number(stock) === 0 ? "Out of stock" : `Only ${stock} left`;
  await pool.query(
    `INSERT INTO notifications (branch_id, product_id, title, body, type)
     VALUES ($1, $2, $3, $4, 'low_stock')`,
    [branchId, productId, `Low stock: ${name}`, `${stockLabel} — restock soon`]
  );
}
