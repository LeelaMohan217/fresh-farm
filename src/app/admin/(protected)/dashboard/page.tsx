import {
  TrendingUp, ShoppingCart, PackageSearch, Users,
  ArrowUpRight, ArrowDownRight, GitBranch, Package,
  AlertTriangle, Star, Clock, CheckCircle2, XCircle, Truck,
} from "lucide-react";
import RevenueChart from "@/components/admin/charts/RevenueChart";
import OrdersBarChart from "@/components/admin/charts/OrdersBarChart";
import CategoryDonut from "@/components/admin/charts/CategoryDonut";
import BranchRevenueBar from "@/components/admin/charts/BranchRevenueBar";
import DailyTrendBar from "@/components/admin/charts/DailyTrendBar";
import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// ── Shared helpers ──────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", emoji: "🌅" };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", emoji: "☀️" };
  if (hour >= 17 && hour < 21) return { text: "Good evening", emoji: "🌆" };
  return { text: "Good night", emoji: "🌙" };
}

const DONUT_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const STATUS_STYLE: Record<string, string> = {
  Delivered:  "bg-green-50 text-green-700 ring-1 ring-green-200/60",
  Processing: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  Pending:    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  Shipped:    "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60",
  Cancelled:  "bg-red-50 text-red-500 ring-1 ring-red-200/60",
};

function ChartCard({
  title, subtitle, children, action, className,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
  action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 flex flex-col ${className ?? ""}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 shrink-0">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 py-4 flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

// ── Superadmin Dashboard ─────────────────────────────────────────────────────

async function SuperadminDashboard({ name }: { name: string }) {
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const [
    revenueRes, ordersRes, branchCountRes, customerRes,
    prevRevenueRes, prevOrdersRes,
    monthlyRevenueRes, monthlyOrdersRes,
    branchRevenueRes, branchOrdersRes, branchPerfRes,
    categoryRevenueRes, recentOrdersRes,
    topProductsRes, lowStockRes,
    bulkOrdersRes,
  ] = await Promise.all([
    // Current totals
    pool.query(`SELECT COALESCE(SUM(total),0)::float AS revenue FROM orders`),
    pool.query(`SELECT COUNT(*)::int AS count FROM orders`),
    pool.query(`SELECT COUNT(*)::int AS count FROM branches WHERE active = TRUE`),
    pool.query(`SELECT COUNT(*)::int AS count FROM customers`),
    // Previous month for % change
    pool.query(`SELECT COALESCE(SUM(total),0)::float AS revenue FROM orders
                WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                  AND created_at < DATE_TRUNC('month', NOW())`),
    pool.query(`SELECT COUNT(*)::int AS count FROM orders
                WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                  AND created_at < DATE_TRUNC('month', NOW())`),
    // Revenue chart — 6 months
    pool.query(`SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
                       DATE_TRUNC('month', created_at) AS month_date,
                       COALESCE(SUM(total),0)::float AS revenue
                FROM orders
                WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
                GROUP BY month_date ORDER BY month_date ASC`),
    // Orders bar chart — 6 months
    pool.query(`SELECT TO_CHAR(m, 'Mon') AS month, m AS month_date,
                       COALESCE(o.regular,0)::int AS regular,
                       COALESCE(b.bulk,0)::int AS bulk
                FROM generate_series(DATE_TRUNC('month',NOW())-INTERVAL '5 months',
                                     DATE_TRUNC('month',NOW()),'1 month') AS m
                LEFT JOIN (SELECT DATE_TRUNC('month',created_at) AS mo, COUNT(*)::int AS regular FROM orders GROUP BY mo) o ON o.mo=m
                LEFT JOIN (SELECT DATE_TRUNC('month',created_at) AS mo, COUNT(*)::int AS bulk FROM bulk_orders GROUP BY mo) b ON b.mo=m
                ORDER BY m ASC`),
    // Branch revenue leaderboard
    pool.query(`SELECT b.name AS branch, COALESCE(SUM(o.total),0)::float AS revenue
                FROM branches b
                LEFT JOIN orders o ON o.branch_id = b.id
                WHERE b.active = TRUE
                GROUP BY b.id, b.name
                ORDER BY revenue DESC`),
    // Orders by branch (for donut)
    pool.query(`SELECT b.name, COUNT(o.id)::int AS orders
                FROM branches b
                LEFT JOIN orders o ON o.branch_id = b.id
                WHERE b.active = TRUE
                GROUP BY b.id, b.name
                ORDER BY orders DESC`),
    // Branch performance table
    pool.query(`SELECT b.name,
                       COUNT(DISTINCT o.id)::int AS orders,
                       COALESCE(SUM(o.total),0)::float AS revenue,
                       COALESCE(AVG(o.total),0)::float AS avg_order,
                       COUNT(DISTINCT o.customer_id)::int AS customers
                FROM branches b
                LEFT JOIN orders o ON o.branch_id = b.id
                WHERE b.active = TRUE
                GROUP BY b.id, b.name
                ORDER BY revenue DESC`),
    // Category donut
    pool.query(`SELECT cat.name, COALESCE(SUM(oi.total_price),0)::float AS total
                FROM categories cat
                LEFT JOIN products p ON p.category_id = cat.id
                LEFT JOIN order_items oi ON oi.product_id = p.id
                GROUP BY cat.id, cat.name
                HAVING SUM(oi.total_price) > 0
                ORDER BY total DESC LIMIT 5`),
    // Recent orders
    pool.query(`SELECT o.id, c.name AS customer, o.total, o.status, o.payment_method,
                       o.created_at, b.name AS branch_name
                FROM orders o
                JOIN customers c ON c.id = o.customer_id
                LEFT JOIN branches b ON b.id = o.branch_id
                ORDER BY o.created_at DESC LIMIT 7`),
    // Top 5 products by revenue
    pool.query(`SELECT p.name, COALESCE(SUM(oi.total_price),0)::float AS revenue,
                       SUM(oi.quantity)::int AS qty_sold
                FROM products p
                JOIN order_items oi ON oi.product_id = p.id
                GROUP BY p.id, p.name
                ORDER BY revenue DESC LIMIT 5`),
    // Low stock alerts (only products with a valid category)
    pool.query(`SELECT p.name, p.stock, b.name AS branch_name
                FROM products p
                JOIN categories c ON c.id = p.category_id
                LEFT JOIN branches b ON b.id = p.branch_id
                WHERE p.stock <= 10
                ORDER BY p.stock ASC LIMIT 8`),
    // Bulk orders count
    pool.query(`SELECT COUNT(*)::int AS count FROM bulk_orders`),
  ]);

  const revenue      = revenueRes.rows[0].revenue as number;
  const orderCount   = ordersRes.rows[0].count as number;
  const branchCount  = branchCountRes.rows[0].count as number;
  const customerCount = customerRes.rows[0].count as number;
  const prevRevenue  = prevRevenueRes.rows[0].revenue as number;
  const prevOrders   = prevOrdersRes.rows[0].count as number;
  const bulkCount    = bulkOrdersRes.rows[0].count as number;

  const revChange = prevRevenue > 0
    ? (((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
    : null;
  const ordChange = prevOrders > 0
    ? (((orderCount - prevOrders) / prevOrders) * 100).toFixed(1)
    : null;

  const revenueChartData = monthlyRevenueRes.rows.map((r) => ({
    month: r.month as string, revenue: Number(r.revenue),
  }));
  const ordersChartData = monthlyOrdersRes.rows.map((r) => ({
    month: r.month as string, regular: r.regular as number, bulk: r.bulk as number,
  }));

  const branchRevenueData = branchRevenueRes.rows.map((r) => ({
    branch: r.branch as string, revenue: Number(r.revenue),
  }));

  const totalBranchOrders = branchOrdersRes.rows.reduce((s, r) => s + (r.orders as number), 0);
  const branchOrdersDonutData = branchOrdersRes.rows.map((r, i) => ({
    name: r.name as string,
    value: totalBranchOrders > 0 ? Math.round(((r.orders as number) / totalBranchOrders) * 100) : 0,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const catTotal = categoryRevenueRes.rows.reduce((s, r) => s + Number(r.total), 0);
  const categoryData = categoryRevenueRes.rows.map((r, i) => ({
    name: r.name as string,
    value: catTotal > 0 ? Math.round((Number(r.total) / catTotal) * 100) : 0,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const STATS = [
    {
      label: "Total Revenue",
      value: `₹${revenue.toLocaleString("en-IN")}`,
      change: revChange ? `${Number(revChange) >= 0 ? "+" : ""}${revChange}%` : "—",
      up: revChange ? Number(revChange) >= 0 : true,
      icon: TrendingUp,
      note: "vs last month",
    },
    {
      label: "Total Orders",
      value: orderCount.toLocaleString("en-IN"),
      change: ordChange ? `${Number(ordChange) >= 0 ? "+" : ""}${ordChange}%` : "—",
      up: ordChange ? Number(ordChange) >= 0 : true,
      icon: ShoppingCart,
      note: "vs last month",
    },
    {
      label: "Active Branches",
      value: branchCount.toString(),
      change: `${bulkCount} bulk`,
      up: true,
      icon: GitBranch,
      note: "orders pending",
    },
    {
      label: "Total Customers",
      value: customerCount.toLocaleString("en-IN"),
      change: "—",
      up: true,
      icon: Users,
      note: "registered",
    },
  ];

  const QUICK_ACTIONS = [
    { label: "Add Product",     sub: "List a new item",         href: "/admin/products/new",   dot: "bg-green-500" },
    { label: "Add Branch",      sub: "Open a new location",     href: "/admin/branches/new",   dot: "bg-blue-500" },
    { label: "View Bulk Orders",sub: "Manage bulk requests",    href: "/admin/orders/bulk",    dot: "bg-amber-500" },
    { label: "Manage Admins",   sub: "Users & permissions",     href: "/admin/admins",         dot: "bg-purple-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full gap-6">
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {greeting.text}, {name.split(" ")[0]} {greeting.emoji}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{today}</p>
        </div>
        <a href="/admin/orders"
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors">
          View all orders <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-none min-h-0 -mr-6 pr-6 space-y-6 pb-2">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-4 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-slate-500 tracking-wide">{s.label}</p>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">{s.value}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md
                      ${s.up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {s.change}
                    </span>
                    <span className="text-xs text-slate-400">{s.note}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 2: Revenue chart + Branch leaderboard */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard className="xl:col-span-2" title="Revenue Overview" subtitle="Monthly revenue — last 6 months">
            <RevenueChart data={revenueChartData} />
          </ChartCard>
          <ChartCard title="Branch Leaderboard" subtitle="Total revenue by branch">
            <BranchRevenueBar data={branchRevenueData} />
          </ChartCard>
        </div>

        {/* Row 3: Branch performance table + Category donut + Orders by branch */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Branch performance table */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100">
            <div className="px-5 py-4 border-b border-slate-50">
              <p className="text-sm font-semibold text-slate-900">Branch Performance</p>
              <p className="text-xs text-slate-400 mt-0.5">Revenue, orders and customers per branch</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/80">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Branch</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Orders</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Revenue</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Avg Order</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Customers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {branchPerfRes.rows.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400">No branch data yet</td></tr>
                  ) : branchPerfRes.rows.map((b, i) => (
                    <tr key={b.name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          <span className="font-medium text-slate-800 text-xs">{b.name}</span>
                          {i === 0 && b.orders > 0 && (
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Top
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-slate-700">{(b.orders as number).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-3.5 text-right text-xs font-semibold text-slate-800">₹{Number(b.revenue).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-3.5 text-right text-xs text-slate-500">₹{Math.round(Number(b.avg_order)).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-3.5 text-right text-xs text-slate-700">{(b.customers as number).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column: Category donut + Orders by branch — fixed height, no stretch */}
          <div className="flex flex-col gap-4">
            <ChartCard title="Sales by Category" subtitle="Share of total revenue" className="h-[280px]">
              <CategoryDonut data={categoryData} />
            </ChartCard>
            <ChartCard title="Orders by Branch" subtitle="Volume distribution" className="h-[280px]">
              <CategoryDonut data={branchOrdersDonutData} />
            </ChartCard>
          </div>
        </div>

        {/* Row 4: Recent orders + Top products + Low stock */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Recent orders */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-900">Recent Orders</p>
                <p className="text-xs text-slate-400 mt-0.5">Latest 7 across all branches</p>
              </div>
              <a href="/admin/orders" className="text-xs font-medium text-green-600 hover:text-green-700">View all →</a>
            </div>
            <div className="divide-y divide-slate-50">
              {recentOrdersRes.rows.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">No orders yet.</div>
              ) : recentOrdersRes.rows.map((row) => {
                const status = (row.status as string) in STATUS_STYLE ? row.status as string : "Pending";
                return (
                  <a key={row.id} href={`/admin/orders/${row.id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 border-l-2 border-l-transparent hover:border-l-green-400 hover:bg-green-50/30 transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-green-100 flex items-center justify-center shrink-0 transition-colors">
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-500 group-hover:text-green-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{row.customer}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {row.id} · {row.branch_name ?? "Unassigned"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-900">₹{Number(row.total).toLocaleString("en-IN")}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                      {status}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-green-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Right column: Top products + Low stock */}
          <div className="flex flex-col gap-4">
            {/* Top 5 products */}
            <div className="bg-white rounded-xl border border-slate-100">
              <div className="px-5 py-4 border-b border-slate-50">
                <p className="text-sm font-semibold text-slate-900">Top Products</p>
                <p className="text-xs text-slate-400 mt-0.5">By revenue</p>
              </div>
              <div className="px-5 py-3 space-y-3">
                {topProductsRes.rows.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No sales data yet</p>
                ) : topProductsRes.rows.map((p, i) => {
                  const maxRevenue = Number(topProductsRes.rows[0].revenue);
                  const pct = maxRevenue > 0 ? Math.round((Number(p.revenue) / maxRevenue) * 100) : 0;
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-bold text-slate-400 w-4 shrink-0">{i + 1}</span>
                          <span className="text-xs font-medium text-slate-700 truncate">{p.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800 shrink-0 ml-2">
                          ₹{Number(p.revenue).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low stock alerts */}
            <div className="bg-white rounded-xl border border-slate-100 flex-1">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Low Stock</p>
                  <p className="text-xs text-slate-400 mt-0.5">Needs restocking</p>
                </div>
                {lowStockRes.rows.length > 0 && (
                  <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                    {lowStockRes.rows.length} items
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-50">
                {lowStockRes.rows.length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-slate-400">All products well stocked</div>
                ) : lowStockRes.rows.map((p) => (
                  <div key={p.name} className="flex items-center justify-between px-5 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${p.stock === 0 ? "text-red-500" : "text-amber-500"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{p.name}</p>
                        {p.branch_name && (
                          <p className="text-[10px] text-slate-400">{p.branch_name}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ml-2 ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                      {p.stock === 0 ? "Out" : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-slate-100">
          <div className="px-5 py-4 border-b border-slate-50">
            <p className="text-sm font-semibold text-slate-900">Quick Actions</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y divide-slate-50">
            {QUICK_ACTIONS.map((action) => (
              <a key={action.label} href={action.href}
                className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors group">
                <span className={`shrink-0 w-2 h-2 rounded-full ${action.dot}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{action.label}</p>
                  <p className="text-xs text-slate-400 leading-tight">{action.sub}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Branch Admin Dashboard ───────────────────────────────────────────────────

async function BranchAdminDashboard({ name, branchId }: { name: string; branchId: number }) {
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const [
    branchRes,
    // Stat cards
    monthRevenueRes, prevMonthRevenueRes, todayOrdersRes, pendingRes, lowStockRes,
    // Order status pipeline
    statusBreakdownRes,
    // 7-day daily trend
    dailyTrendRes,
    // Today's action queue
    todayQueueRes,
    // Top products
    topProductsRes,
    // Low stock products list
    lowStockListRes,
    // Category donut
    categoryRevenueRes,
    // New vs returning customers
    newCustomersRes, returningCustomersRes,
  ] = await Promise.all([
    pool.query(`SELECT name FROM branches WHERE id = $1`, [branchId]),

    // This month's revenue
    pool.query(`SELECT COALESCE(SUM(total),0)::float AS revenue FROM orders
                WHERE branch_id = $1 AND created_at >= DATE_TRUNC('month', NOW())`, [branchId]),
    // Last month's revenue (for % change)
    pool.query(`SELECT COALESCE(SUM(total),0)::float AS revenue FROM orders
                WHERE branch_id = $1
                  AND created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                  AND created_at < DATE_TRUNC('month', NOW())`, [branchId]),
    // Today's orders count
    pool.query(`SELECT COUNT(*)::int AS count FROM orders
                WHERE branch_id = $1 AND DATE(created_at) = CURRENT_DATE`, [branchId]),
    // Pending + Processing (needs action)
    pool.query(`SELECT COUNT(*)::int AS count FROM orders
                WHERE branch_id = $1 AND status IN ('Pending','Processing')`, [branchId]),
    // Low stock count (only products with a valid category)
    pool.query(`SELECT COUNT(*)::int AS count FROM products p
                JOIN categories c ON c.id = p.category_id
                WHERE (p.branch_id = $1 OR p.branch_id IS NULL) AND p.stock <= 10`, [branchId]),

    // Order status breakdown
    pool.query(`SELECT status, COUNT(*)::int AS count FROM orders
                WHERE branch_id = $1 GROUP BY status`, [branchId]),

    // 7-day daily trend
    pool.query(`SELECT TO_CHAR(d, 'Dy') AS day,
                       COALESCE(o.cnt, 0)::int AS orders,
                       COALESCE(o.rev, 0)::float AS revenue
                FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS d
                LEFT JOIN (
                  SELECT DATE(created_at) AS dt, COUNT(*)::int AS cnt, SUM(total)::float AS rev
                  FROM orders WHERE branch_id = $1
                    AND created_at >= CURRENT_DATE - INTERVAL '6 days'
                  GROUP BY dt
                ) o ON o.dt = d
                ORDER BY d ASC`, [branchId]),

    // Today's action queue (pending + processing orders placed today)
    pool.query(`SELECT o.id, c.name AS customer, o.total, o.status, o.created_at
                FROM orders o
                JOIN customers c ON c.id = o.customer_id
                WHERE o.branch_id = $1
                  AND DATE(o.created_at) = CURRENT_DATE
                ORDER BY o.created_at ASC
                LIMIT 10`, [branchId]),

    // Top 5 products by revenue in this branch
    pool.query(`SELECT p.name, COALESCE(SUM(oi.total_price),0)::float AS revenue,
                       SUM(oi.quantity)::int AS qty_sold
                FROM products p
                JOIN order_items oi ON oi.product_id = p.id
                JOIN orders o ON o.id = oi.order_id AND o.branch_id = $1
                GROUP BY p.id, p.name
                ORDER BY revenue DESC LIMIT 5`, [branchId]),

    // Low stock products list (branch-specific, only valid category products)
    pool.query(`SELECT p.name, p.stock FROM products p
                JOIN categories c ON c.id = p.category_id
                WHERE (p.branch_id = $1 OR p.branch_id IS NULL) AND p.stock <= 10
                ORDER BY p.stock ASC LIMIT 6`, [branchId]),

    // Category breakdown
    pool.query(`SELECT cat.name, COALESCE(SUM(oi.total_price),0)::float AS total
                FROM categories cat
                LEFT JOIN products p ON p.category_id = cat.id
                LEFT JOIN order_items oi ON oi.product_id = p.id
                LEFT JOIN orders o ON o.id = oi.order_id AND o.branch_id = $1
                GROUP BY cat.id, cat.name HAVING SUM(oi.total_price) > 0
                ORDER BY total DESC LIMIT 5`, [branchId]),

    // New customers this month (first order ever in this branch)
    pool.query(`SELECT COUNT(DISTINCT o.customer_id)::int AS count
                FROM orders o
                WHERE o.branch_id = $1
                  AND o.created_at >= DATE_TRUNC('month', NOW())
                  AND NOT EXISTS (
                    SELECT 1 FROM orders o2
                    WHERE o2.customer_id = o.customer_id
                      AND o2.branch_id = $1
                      AND o2.created_at < DATE_TRUNC('month', NOW())
                  )`, [branchId]),
    // Returning customers this month
    pool.query(`SELECT COUNT(DISTINCT o.customer_id)::int AS count
                FROM orders o
                WHERE o.branch_id = $1
                  AND o.created_at >= DATE_TRUNC('month', NOW())
                  AND EXISTS (
                    SELECT 1 FROM orders o2
                    WHERE o2.customer_id = o.customer_id
                      AND o2.branch_id = $1
                      AND o2.created_at < DATE_TRUNC('month', NOW())
                  )`, [branchId]),
  ]);

  const branchName      = branchRes.rows[0]?.name ?? "Branch";
  const monthRevenue    = monthRevenueRes.rows[0].revenue as number;
  const prevRevenue     = prevMonthRevenueRes.rows[0].revenue as number;
  const todayCount      = todayOrdersRes.rows[0].count as number;
  const pendingCount    = pendingRes.rows[0].count as number;
  const lowStockCount   = lowStockRes.rows[0].count as number;
  const newCustomers    = newCustomersRes.rows[0].count as number;
  const returning       = returningCustomersRes.rows[0].count as number;

  const revChange = prevRevenue > 0
    ? (((monthRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
    : null;

  // Status pipeline
  const statusMap: Record<string, number> = {};
  for (const r of statusBreakdownRes.rows) statusMap[r.status as string] = r.count as number;
  const totalOrders = Object.values(statusMap).reduce((a, b) => a + b, 0);

  const PIPELINE = [
    { label: "Pending",    key: "Pending",    icon: Clock,         color: "text-amber-600",  bg: "bg-amber-50",  bar: "bg-amber-400" },
    { label: "Processing", key: "Processing", icon: PackageSearch, color: "text-blue-600",   bg: "bg-blue-50",   bar: "bg-blue-400" },
    { label: "Shipped",    key: "Shipped",    icon: Truck,         color: "text-purple-600", bg: "bg-purple-50", bar: "bg-purple-400" },
    { label: "Delivered",  key: "Delivered",  icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50",  bar: "bg-green-400" },
    { label: "Cancelled",  key: "Cancelled",  icon: XCircle,       color: "text-red-500",    bg: "bg-red-50",    bar: "bg-red-400" },
  ];

  const dailyTrendData = dailyTrendRes.rows.map((r) => ({
    day: r.day as string,
    orders: r.orders as number,
    revenue: Number(r.revenue),
  }));

  const catTotal = categoryRevenueRes.rows.reduce((s, r) => s + Number(r.total), 0);
  const categoryData = categoryRevenueRes.rows.map((r, i) => ({
    name: r.name as string,
    value: catTotal > 0 ? Math.round((Number(r.total) / catTotal) * 100) : 0,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const QUICK_ACTIONS = [
    { label: "Add Product",      sub: "List a new item",        href: "/admin/products/new", dot: "bg-green-500" },
    { label: "View Bulk Orders", sub: "Manage bulk requests",   href: "/admin/orders/bulk",  dot: "bg-amber-500" },
    { label: "All Orders",       sub: "View & manage orders",   href: "/admin/orders",       dot: "bg-blue-500" },
    { label: "Customers",        sub: "Browse branch customers",href: "/admin/customers",    dot: "bg-purple-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full gap-6">
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {greeting.text}, {name.split(" ")[0]} {greeting.emoji}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {today}
            <span className="ml-2 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
              {branchName}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {todayCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
              {todayCount} order{todayCount !== 1 ? "s" : ""} today
            </span>
          )}
          <a href="/admin/orders"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors">
            View orders <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-none min-h-0 -mr-6 pr-6 space-y-6 pb-2">

        {/* Row 1: Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue this month */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-slate-500">Revenue this month</p>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">₹{monthRevenue.toLocaleString("en-IN")}</p>
              {revChange !== null && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md mt-1.5
                  ${Number(revChange) >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {Number(revChange) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Number(revChange) >= 0 ? "+" : ""}{revChange}% vs last month
                </span>
              )}
            </div>
          </div>
          {/* Today's orders */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-slate-500">Today&apos;s Orders</p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">{todayCount}</p>
              <p className="text-xs text-slate-400 mt-1">placed today</p>
            </div>
          </div>
          {/* Needs attention */}
          <div className={`bg-white rounded-xl border p-5 flex flex-col gap-3 hover:shadow-sm transition-all ${pendingCount > 0 ? "border-amber-200" : "border-slate-100"}`}>
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-slate-500">Needs Attention</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pendingCount > 0 ? "bg-amber-50" : "bg-slate-50"}`}>
                <PackageSearch className={`w-4 h-4 ${pendingCount > 0 ? "text-amber-600" : "text-slate-400"}`} />
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold tracking-tight ${pendingCount > 0 ? "text-amber-600" : "text-slate-900"}`}>{pendingCount}</p>
              <p className="text-xs text-slate-400 mt-1">pending / processing</p>
            </div>
          </div>
          {/* Low stock */}
          <div className={`bg-white rounded-xl border p-5 flex flex-col gap-3 hover:shadow-sm transition-all ${lowStockCount > 0 ? "border-red-200" : "border-slate-100"}`}>
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-slate-500">Low Stock Items</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? "text-red-500" : "text-slate-400"}`} />
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold tracking-tight ${lowStockCount > 0 ? "text-red-600" : "text-slate-900"}`}>{lowStockCount}</p>
              <p className="text-xs text-slate-400 mt-1">products ≤ 10 units</p>
            </div>
          </div>
        </div>

        {/* Row 2: Order status pipeline */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Order Pipeline</p>
              <p className="text-xs text-slate-400 mt-0.5">All-time status breakdown · {totalOrders} total orders</p>
            </div>
            <a href="/admin/orders" className="text-xs font-medium text-green-600 hover:text-green-700">Manage →</a>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {PIPELINE.map(({ label, key, icon: Icon, color, bg, bar }) => {
              const count = statusMap[key] ?? 0;
              const pct   = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={key} className={`rounded-xl p-4 ${bg} flex flex-col gap-2`}>
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className={`text-[10px] font-semibold ${color}`}>{pct}%</span>
                  </div>
                  <p className={`text-xl font-bold ${color}`}>{count}</p>
                  <div>
                    <p className="text-[11px] font-medium text-slate-600">{label}</p>
                    <div className="h-1 bg-white/60 rounded-full mt-1.5 overflow-hidden">
                      <div className={`h-full ${bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: 7-day trend + Top products */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard className="xl:col-span-2" title="This Week's Performance"
            subtitle="Daily orders (line) and revenue (bars) — last 7 days"
            action={
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400/40 inline-block" />Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-blue-500 inline-block rounded" />Orders</span>
              </div>
            }>
            <DailyTrendBar data={dailyTrendData} />
          </ChartCard>

          {/* Top products */}
          <div className="bg-white rounded-xl border border-slate-100">
            <div className="px-5 py-4 border-b border-slate-50">
              <p className="text-sm font-semibold text-slate-900">Top Products</p>
              <p className="text-xs text-slate-400 mt-0.5">By revenue in {branchName}</p>
            </div>
            <div className="px-5 py-3 space-y-3">
              {topProductsRes.rows.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No sales data yet</p>
              ) : topProductsRes.rows.map((p, i) => {
                const maxRev = Number(topProductsRes.rows[0].revenue);
                const pct = maxRev > 0 ? Math.round((Number(p.revenue) / maxRev) * 100) : 0;
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 w-4 shrink-0">{i + 1}</span>
                        <span className="text-xs font-medium text-slate-700 truncate">{p.name}</span>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <span className="text-xs font-semibold text-slate-800">₹{Number(p.revenue).toLocaleString("en-IN")}</span>
                        <span className="text-[10px] text-slate-400 ml-1">· {p.qty_sold} sold</span>
                      </div>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 4: Today's queue + Low stock + Category + Customers */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Today's order queue */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-900">Today&apos;s Queue</p>
                <p className="text-xs text-slate-400 mt-0.5">Orders placed today — process in order</p>
              </div>
              <a href="/admin/orders" className="text-xs font-medium text-green-600 hover:text-green-700">All orders →</a>
            </div>
            <div className="divide-y divide-slate-50">
              {todayQueueRes.rows.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">All clear!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No orders placed today yet.</p>
                </div>
              ) : todayQueueRes.rows.map((row) => {
                const status = (row.status as string) in STATUS_STYLE ? row.status as string : "Pending";
                const time = new Date(row.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                return (
                  <a key={row.id} href={`/admin/orders/${row.id}`}
                    className="group flex items-center gap-4 px-5 py-3 border-l-2 border-l-transparent hover:border-l-green-400 hover:bg-green-50/30 transition-all cursor-pointer">
                    <div className="text-center shrink-0 w-10">
                      <p className="text-[11px] font-semibold text-slate-500">{time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{row.customer}</p>
                      <p className="text-xs text-slate-400">{row.id}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 shrink-0">₹{Number(row.total).toLocaleString("en-IN")}</p>
                    <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                      {status}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-green-500 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* New vs Returning customers */}
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <p className="text-sm font-semibold text-slate-900 mb-1">Customers This Month</p>
              <p className="text-xs text-slate-400 mb-4">New vs returning buyers</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{newCustomers}</p>
                  <p className="text-[11px] font-medium text-green-600 mt-0.5">New</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{returning}</p>
                  <p className="text-[11px] font-medium text-blue-600 mt-0.5">Returning</p>
                </div>
              </div>
              {(newCustomers + returning) > 0 && (
                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-400 rounded-l-full transition-all"
                    style={{ width: `${Math.round((newCustomers / (newCustomers + returning)) * 100)}%` }} />
                  <div className="h-full bg-blue-400 rounded-r-full flex-1" />
                </div>
              )}
            </div>

            {/* Low stock list */}
            <div className="bg-white rounded-xl border border-slate-100 flex-1">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Low Stock</p>
                  <p className="text-xs text-slate-400 mt-0.5">Restock soon</p>
                </div>
                <a href="/admin/products" className="text-xs font-medium text-green-600 hover:text-green-700">Manage →</a>
              </div>
              <div className="divide-y divide-slate-50">
                {lowStockListRes.rows.length === 0 ? (
                  <div className="px-5 py-5 text-center text-xs text-slate-400">All stocked up ✓</div>
                ) : lowStockListRes.rows.map((p) => (
                  <div key={p.name} className="flex items-center justify-between px-5 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${p.stock === 0 ? "text-red-500" : "text-amber-500"}`} />
                      <span className="text-xs font-medium text-slate-700 truncate">{p.name}</span>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ml-2 ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                      {p.stock === 0 ? "Out" : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category donut */}
            <ChartCard title="Sales by Category" subtitle="What&apos;s popular" className="h-[280px]">
              <CategoryDonut data={categoryData} />
            </ChartCard>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-slate-100">
          <div className="px-5 py-4 border-b border-slate-50">
            <p className="text-sm font-semibold text-slate-900">Quick Actions</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y divide-slate-50">
            {QUICK_ACTIONS.map((action) => (
              <a key={action.label} href={action.href}
                className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors group">
                <span className={`shrink-0 w-2 h-2 rounded-full ${action.dot}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{action.label}</p>
                  <p className="text-xs text-slate-400 leading-tight">{action.sub}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Page entry point ─────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const isBranchAdmin = session.role === "admin" && session.branchId !== null;

  if (isBranchAdmin) {
    return <BranchAdminDashboard name={session.name} branchId={session.branchId!} />;
  }

  return <SuperadminDashboard name={session.name} />;
}
