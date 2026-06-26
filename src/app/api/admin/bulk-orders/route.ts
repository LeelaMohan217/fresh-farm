import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import pool from "@/lib/pg";
import { getAdminSessionFromRequest } from "@/lib/auth";

const VALID_STATUSES = ["Pending", "Confirmed", "Processing", "Cancelled"];

export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { id, status } = await req.json();
    if (!id) return NextResponse.json({ error: "Bulk order ID is required." }, { status: 400 });
    if (!VALID_STATUSES.includes(status))
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });

    await pool.query(
      `UPDATE bulk_orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    revalidateTag("bulk-orders");
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("PATCH BULK ORDER ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session || session.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Bulk order ID is required." }, { status: 400 });

    await pool.query(`DELETE FROM bulk_order_items WHERE bulk_order_id = $1`, [id]);
    await pool.query(`DELETE FROM bulk_orders WHERE id = $1`, [id]);
    revalidateTag("bulk-orders");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE BULK ORDER ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
