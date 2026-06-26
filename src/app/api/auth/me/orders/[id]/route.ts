import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";
import orderEvents from "@/lib/orderEvents";

const CANCELLABLE = ["Pending", "Processing"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason } = await req.json();

  if (!reason?.trim()) return NextResponse.json({ error: "Cancellation reason is required." }, { status: 400 });

  const { rows } = await pool.query(
    `SELECT o.status, o.branch_id, o.total, c.name AS customer_name
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE c.email = $1 AND o.id = $2`,
    [session.email, id]
  );

  if (!rows.length) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!CANCELLABLE.includes(rows[0].status))
    return NextResponse.json({ error: `Orders with status "${rows[0].status}" cannot be cancelled.` }, { status: 409 });

  const { branch_id, total, customer_name } = rows[0];

  await pool.query(
    `UPDATE orders SET status = 'Cancelled', cancel_reason = $1, updated_at = NOW()
     WHERE id = $2`,
    [reason.trim(), id]
  );

  // Restore stock for each item in the cancelled order
  await pool.query(
    `UPDATE products p
     SET stock = stock + oi.quantity
     FROM order_items oi
     WHERE oi.order_id = $1 AND oi.product_id = p.id`,
    [id]
  );

  await pool.query(
    `INSERT INTO notifications (branch_id, order_id, title, body, type)
     VALUES ($1, $2, $3, $4, 'order')`,
    [
      branch_id ?? null,
      id,
      `Order cancelled`,
      `${customer_name} cancelled order ${id} · ₹${Number(total).toLocaleString("en-IN")} · Reason: ${reason.trim()}`,
    ]
  );

  orderEvents.emit("order-update");
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.payment_method, o.subtotal, o.delivery_fee, o.total,
            o.delivery_address, o.pincode, o.created_at,
            o.receiver_name, o.receiver_phone, o.receiver_email,
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
     WHERE c.email = $1 AND o.id = $2
     GROUP BY o.id`,
    [session.email, id]
  );

  if (!rows.length) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
