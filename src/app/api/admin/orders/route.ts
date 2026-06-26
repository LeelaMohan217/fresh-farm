import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import pool from "@/lib/pg";
import { getAdminSessionFromRequest } from "@/lib/auth";

const VALID_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const isBranchAdmin = session.role === "admin" && session.branchId !== null;

  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.payment_method, o.total, o.created_at,
       c.name AS customer_name,
       STRING_AGG(p.name, ', ' ORDER BY p.name) AS items,
       b.name AS branch_name
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     LEFT JOIN branches b ON b.id = o.branch_id
     ${isBranchAdmin ? "WHERE o.branch_id = $1" : ""}
     GROUP BY o.id, c.name, b.name
     ORDER BY o.created_at DESC`,
    isBranchAdmin ? [session.branchId] : []
  );

  const validStatuses = new Set(["Delivered", "Processing", "Cancelled", "Pending"]);
  return NextResponse.json(rows.map((r) => ({
    id: String(r.id),
    item: r.items ?? "",
    user: r.customer_name,
    date: new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    status: validStatuses.has(r.status) ? r.status : "Pending",
    price: Number(r.total),
    method: r.payment_method ?? "",
    branch: r.branch_name ?? null,
  })));
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { id, status } = await req.json();
    if (!id) return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    if (!VALID_STATUSES.includes(status))
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });

    const prev = await pool.query(`SELECT status FROM orders WHERE id = $1`, [id]);
    const prevStatus = prev.rows[0]?.status;

    await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    // Restore stock when an order is cancelled
    if (status === "Cancelled" && prevStatus !== "Cancelled") {
      await pool.query(
        `UPDATE products p SET stock = stock + oi.quantity
         FROM order_items oi WHERE oi.order_id = $1 AND oi.product_id = p.id`,
        [id]
      );
      revalidateTag("products");
    }

    revalidateTag("orders");
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("PATCH ORDER ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session || session.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Order ID is required." }, { status: 400 });

    await pool.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);
    await pool.query(`DELETE FROM orders WHERE id = $1`, [id]);
    revalidateTag("orders");
    revalidateTag("customers"); // customer order stats (total_orders, total_spent) changed
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE ORDER ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
