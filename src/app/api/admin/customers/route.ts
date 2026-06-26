import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import pool from "@/lib/pg";
import { getAdminSessionFromRequest } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session || session.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });

    // Delete order_items → orders → bulk_orders → customer (FK chain)
    await pool.query(
      `DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = $1)`, [id]
    );
    await pool.query(`DELETE FROM orders WHERE customer_id = $1`, [id]);
    await pool.query(`DELETE FROM bulk_orders WHERE customer_id = $1`, [id]);
    await pool.query(`DELETE FROM customers WHERE id = $1`, [id]);
    revalidateTag("customers");
    revalidateTag("orders");      // cascade-deleted orders no longer exist
    revalidateTag("bulk-orders"); // cascade-deleted bulk orders no longer exist
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE CUSTOMER ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
