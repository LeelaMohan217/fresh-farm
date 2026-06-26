import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import BulkOrdersTable, { type BulkOrderRow } from "@/components/admin/orders/BulkOrdersTable";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["Confirmed", "Pending", "Processing", "Cancelled"]);

async function getBulkOrders(): Promise<BulkOrderRow[]> {
  const { rows } = await pool.query(`
    SELECT b.*, c.name as customer_name,
      COALESCE(
        STRING_AGG(bi.item_name, ', ' ORDER BY bi.id),
        b.items_desc
      ) AS items_list
    FROM bulk_orders b
    JOIN customers c ON c.id = b.customer_id
    LEFT JOIN bulk_order_items bi ON bi.bulk_order_id = b.id
    GROUP BY b.id, c.name
    ORDER BY b.created_at DESC
  `);

  return rows.map((r) => ({
    id: String(r.id),
    items: r.items_list ?? "",
    user: r.customer_name,
    eventType: r.event_type ?? "Other",
    bookingDate: new Date(r.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    }),
    deliveryDate: r.delivery_date
      ? new Date(r.delivery_date).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
      : "—",
    status: VALID_STATUSES.has(r.status)
      ? (r.status as BulkOrderRow["status"])
      : "Pending",
    price: Number(r.total),
  }));
}

const getCachedBulkOrders = unstable_cache(
  getBulkOrders,
  ["bulk-orders"],
  { tags: ["bulk-orders"] }
);

export default async function BulkOrdersPage() {
  const [orders, session] = await Promise.all([getCachedBulkOrders(), getAdminSession()]);
  return <div className="h-full"><BulkOrdersTable orders={orders} currentAdminRole={session?.role ?? "admin"} /></div>;
}
