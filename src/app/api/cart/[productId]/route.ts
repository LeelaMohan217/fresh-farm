import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;
  const { quantity } = await req.json();
  if (typeof quantity !== "number" || quantity < 1)
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

  const custRes = await pool.query("SELECT id FROM customers WHERE email = $1", [session.email]);
  if (!custRes.rowCount) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  const customerId = custRes.rows[0].id;

  const { rows } = await pool.query(
    `UPDATE cart_items SET quantity = $1, updated_at = NOW()
     WHERE customer_id = $2 AND product_id = $3
     RETURNING quantity`,
    [quantity, customerId, Number(productId)]
  );

  if (!rows.length) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  return NextResponse.json({ ok: true, quantity: rows[0].quantity });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await params;

  const custRes = await pool.query("SELECT id FROM customers WHERE email = $1", [session.email]);
  if (!custRes.rowCount) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  await pool.query(
    "DELETE FROM cart_items WHERE customer_id = $1 AND product_id = $2",
    [custRes.rows[0].id, Number(productId)]
  );

  return NextResponse.json({ ok: true });
}
