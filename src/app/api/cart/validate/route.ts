import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT ci.product_id AS id, p.stock
     FROM cart_items ci
     JOIN customers c ON c.id = ci.customer_id
     JOIN products p ON p.id = ci.product_id
     WHERE c.email = $1`,
    [session.email]
  );

  return NextResponse.json(
    rows.map((r) => ({ id: r.id as number, outOfStock: r.stock === 0 }))
  );
}
