import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.payment_method, o.subtotal, o.delivery_fee, o.total,
            o.delivery_address, o.created_at, o.receiver_name, o.receiver_phone, o.receiver_email,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT('name', p.name, 'qty', oi.quantity, 'price', oi.unit_price, 'unit', p.unit, 'image', p.image_url)
                ORDER BY oi.id
              ) FILTER (WHERE oi.id IS NOT NULL), '[]'
            ) AS items
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE c.email = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [session.email]
  );

  return NextResponse.json(rows);
}
