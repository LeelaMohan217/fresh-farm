import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import BulkOrdersTable, { type BulkOrderRow } from "@/components/admin/orders/BulkOrdersTable";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["Confirmed", "Pending", "Processing", "Cancelled"]);

async function getBulkOrders(): Promise<BulkOrderRow[]> {
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.event_type, b.status, b.items_desc, b.total,
             b.delivery_date, b.created_at,
             c.name AS customer_name
      FROM bulk_orders b
      JOIN customers c ON c.id = b.customer_id
      ORDER BY b.created_at DESC
    `);

    return rows.map((r) => ({
      id: String(r.id),
      items: (r.items_desc as string) ?? "",
      user: (r.customer_name as string) ?? "Unknown",
      eventType: (r.event_type as string) ?? "Other",
      bookingDate: new Date(r.created_at as string).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      }),
      deliveryDate: r.delivery_date
        ? new Date(r.delivery_date as string).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          })
        : "—",
      status: VALID_STATUSES.has(r.status as string)
        ? (r.status as BulkOrderRow["status"])
        : "Pending",
      price: Number(r.total),
    }));
  } catch (err) {
    console.error("[bulk-orders] query failed:", err);
    return [];
  }
}

export default async function BulkOrdersPage() {
  const [orders, session] = await Promise.all([getBulkOrders(), getAdminSession()]);
  return <div className="h-full"><BulkOrdersTable orders={orders} currentAdminRole={session?.role ?? "admin"} /></div>;
}
