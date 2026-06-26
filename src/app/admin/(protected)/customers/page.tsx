import { redirect } from "next/navigation";
import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import CustomerTable from "@/components/admin/customers/CustomerTable";

export const dynamic = "force-dynamic";

async function getCustomers(branchId: number | null) {
  const isBranchAdmin = branchId !== null;

  // For branch admin: only customers who have at least one order in that branch.
  // Stats (total_orders, total_spent) are scoped to that branch too.
  const { rows } = isBranchAdmin
    ? await pool.query(
        `SELECT
          c.id, c.name, c.email, c.phone, c.status,
          c.joined_date,
          COUNT(o.id)::int AS total_orders,
          COALESCE(SUM(o.total), 0)::float AS total_spent,
          MAX(o.created_at) AS last_order_date
        FROM customers c
        JOIN orders o ON o.customer_id = c.id AND o.branch_id = $1
        GROUP BY c.id
        ORDER BY c.joined_date DESC`,
        [branchId]
      )
    : await pool.query(
        `SELECT
          c.id, c.name, c.email, c.phone, c.status,
          c.joined_date,
          COUNT(o.id)::int AS total_orders,
          COALESCE(SUM(o.total), 0)::float AS total_spent,
          MAX(o.created_at) AS last_order_date
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id
        ORDER BY c.joined_date DESC`
      );

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    status: c.status,
    joinedDate: new Date(c.joined_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    totalOrders: c.total_orders,
    totalSpent: c.total_spent,
    lastOrder: c.last_order_date
      ? new Date(c.last_order_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : null,
  }));
}

export default async function CustomersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const branchId = session.role === "admin" ? (session.branchId ?? null) : null;
  const customers = await getCustomers(branchId);

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders  = customers.reduce((s, c) => s + c.totalOrders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const stats = [
    { label: "Total Customers", value: customers.length.toString(),                                              icon: "Users",       color: "bg-blue-50 text-blue-600"   },
    { label: "Active",          value: customers.filter((c) => c.status === "Active").length.toString(),         icon: "TrendingUp",  color: "bg-green-50 text-green-600" },
    { label: "Total Revenue",   value: `₹${totalRevenue.toLocaleString("en-IN")}`,                              icon: "IndianRupee", color: "bg-amber-50 text-amber-600" },
    { label: "Avg Order Value", value: `₹${avgOrderValue.toLocaleString("en-IN")}`,                             icon: "ShoppingBag", color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="h-full max-w-7xl mx-auto">
      <CustomerTable customers={customers} stats={stats} currentAdminRole={session.role} />
    </div>
  );
}
