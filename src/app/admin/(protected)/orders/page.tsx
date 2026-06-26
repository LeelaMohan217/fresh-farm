import { redirect } from "next/navigation";
import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import OrdersTable, { type OrderRow } from "@/components/admin/orders/OrdersTable";

export const dynamic = "force-dynamic";

async function getOrders(branchId: number | null): Promise<OrderRow[]> {
  const isBranchAdmin = branchId !== null;
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.payment_method, o.total, o.created_at,
      c.name as customer_name,
      STRING_AGG(p.name, ', ' ORDER BY p.name) as items,
      b.name as branch_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN branches b ON b.id = o.branch_id
    ${isBranchAdmin ? "WHERE o.branch_id = $1" : ""}
    GROUP BY o.id, c.name, b.name
    ORDER BY o.created_at DESC`,
    isBranchAdmin ? [branchId] : []
  );

  const validStatuses = new Set(["Delivered", "Processing", "Cancelled", "Pending"]);

  return rows.map((r) => ({
    id: String(r.id),
    item: r.items ?? "",
    user: r.customer_name,
    date: new Date(r.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    }),
    status: validStatuses.has(r.status)
      ? (r.status as OrderRow["status"])
      : "Pending",
    price: Number(r.total),
    method: r.payment_method ?? "",
    branch: (r.branch_name ?? null) as string | null,
  }));
}

export default async function OrdersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const branchId = session.role === "admin" ? (session.branchId ?? null) : null;
  const orders = await getOrders(branchId);

  return <div className="h-full"><OrdersTable orders={orders} currentAdminRole={session.role} /></div>;
}
