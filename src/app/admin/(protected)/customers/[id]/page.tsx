import { notFound, redirect } from "next/navigation";
import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import CustomerDetail from "@/components/admin/customers/CustomerDetail";

export const dynamic = "force-dynamic";

async function getCustomer(id: string, branchId: number | null) {
  const { rows: customerRows } = await pool.query(
    `SELECT id, name, email, phone, address, status, joined_date FROM customers WHERE id = $1`,
    [id]
  );
  if (customerRows.length === 0) return null;
  const customer = customerRows[0];

  // Branch admin: only fetch orders belonging to their branch
  const isBranchAdmin = branchId !== null;
  const { rows: orderRows } = await pool.query(
    `SELECT o.id, o.status, o.total, o.created_at,
      o.receiver_name, o.receiver_phone,
      STRING_AGG(p.name, ', ' ORDER BY p.name) FILTER (WHERE p.name IS NOT NULL) AS items,
      STRING_AGG(DISTINCT cat.name, ', ') FILTER (WHERE cat.name IS NOT NULL) AS categories,
      COALESCE(SUM(oi.quantity)::int, 0) AS total_qty
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories cat ON cat.id = p.category_id
    WHERE o.customer_id = $1 ${isBranchAdmin ? "AND o.branch_id = $2" : ""}
    GROUP BY o.id
    ORDER BY o.created_at DESC`,
    isBranchAdmin ? [id, branchId] : [id]
  );

  // Branch admin: if this customer has no orders in their branch, deny access
  if (isBranchAdmin && orderRows.length === 0) return null;

  return { customer, orders: orderRows };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, getAdminSession()]);
  if (!session) redirect("/admin/login");

  const branchId = session.role === "admin" ? (session.branchId ?? null) : null;
  const data = await getCustomer(id, branchId);

  if (!data) notFound();

  const { customer, orders } = data;

  const totalSpent = orders.reduce((s: number, o: { total: string }) => s + Number(o.total), 0);
  const avgOrderValue = orders.length > 0
    ? Math.round(totalSpent / orders.length)
    : 0;

  const categoryCount: Record<string, number> = {};
  for (const order of orders) {
    if (order.categories) {
      for (const cat of (order.categories as string).split(", ")) {
        const trimmed = cat.trim();
        if (trimmed) categoryCount[trimmed] = (categoryCount[trimmed] ?? 0) + (order.total_qty ?? 1);
      }
    }
  }
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  const joinedDate = new Date(customer.joined_date);
  const monthsActive = Math.max(
    1,
    Math.round((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  );

  const formattedCustomer = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    joinedDate: joinedDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    totalOrders: orders.length,
    totalSpent,
    avgOrderValue,
    monthlyAverage: Math.round(totalSpent / monthsActive),
    topCategories,
    lastOrder: orders[0]
      ? new Date(orders[0].created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "—",
    orders: orders.map((o: { id: string; items: string; created_at: string; total: string; status: string; receiver_name: string | null; receiver_phone: string | null }) => ({
      id: o.id,
      items: o.items ?? "",
      date: new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      amount: Number(o.total),
      status: o.status,
      receiverName: o.receiver_name ?? null,
      receiverPhone: o.receiver_phone ?? null,
    })),
  };

  return <div className="h-full"><CustomerDetail customer={formattedCustomer} /></div>;
}
