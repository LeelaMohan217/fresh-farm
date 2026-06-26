import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Verify order belongs to this customer and get its items
  const { rows: orderItems } = await pool.query(
    `SELECT oi.product_id, oi.quantity
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN customers c ON c.id = o.customer_id
     WHERE o.id = $1 AND c.email = $2`,
    [orderId, session.email]
  );

  if (!orderItems.length)
    return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Get customer id
  const { rows: custRows } = await pool.query(
    "SELECT id FROM customers WHERE email = $1",
    [session.email]
  );
  const customerId = custRows[0].id;

  // Clear existing cart
  await pool.query("DELETE FROM cart_items WHERE customer_id = $1", [customerId]);

  // Add all order items to cart at original quantities
  for (const item of orderItems) {
    await pool.query(
      `INSERT INTO cart_items (customer_id, product_id, quantity, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (customer_id, product_id)
       DO UPDATE SET quantity = $3, updated_at = NOW()`,
      [customerId, item.product_id, item.quantity]
    );
  }

  // Check which products are out of stock
  const productIds = orderItems.map((i) => i.product_id);
  const { rows: stockRows } = await pool.query(
    "SELECT id, name, stock FROM products WHERE id = ANY($1)",
    [productIds]
  );

  const outOfStock = stockRows
    .filter((p) => p.stock === 0)
    .map((p) => p.name as string);

  return NextResponse.json({ ok: true, outOfStock });
}
