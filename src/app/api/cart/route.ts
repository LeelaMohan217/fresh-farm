import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.price, p.unit, p.image_url, p.image_urls, ci.quantity
     FROM cart_items ci
     JOIN customers c ON c.id = ci.customer_id
     JOIN products p ON p.id = ci.product_id
     WHERE c.email = $1
     ORDER BY ci.created_at ASC`,
    [session.email]
  );

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      unit: r.unit,
      quantity: r.quantity,
      imageUrl: (r.image_urls?.[0]) || r.image_url || null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, quantity = 1 } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const custRes = await pool.query("SELECT id FROM customers WHERE email = $1", [session.email]);
  if (!custRes.rowCount) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  const customerId = custRes.rows[0].id;

  await pool.query(
    `INSERT INTO cart_items (customer_id, product_id, quantity, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (customer_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + 1, updated_at = NOW()`,
    [customerId, productId, quantity]
  );

  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.price, p.unit, p.image_url, p.image_urls, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.customer_id = $1 AND ci.product_id = $2`,
    [customerId, productId]
  );

  const item = rows[0];
  return NextResponse.json({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    unit: item.unit,
    quantity: item.quantity,
    imageUrl: (item.image_urls?.[0]) || item.image_url || null,
  });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const custRes = await pool.query("SELECT id FROM customers WHERE email = $1", [session.email]);
  if (!custRes.rowCount) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  await pool.query("DELETE FROM cart_items WHERE customer_id = $1", [custRes.rows[0].id]);
  return NextResponse.json({ ok: true });
}
