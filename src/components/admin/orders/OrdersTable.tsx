"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Download, ShoppingCart, ChevronLeft, ChevronRight,
  Trash2, Loader2, RotateCcw,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export type OrderRow = {
  id: string;
  item: string;
  user: string;
  date: string;
  status: "Delivered" | "Processing" | "Cancelled" | "Pending";
  price: number;
  method: string;
  branch: string | null;
};

const PAGE_SIZE = 25;
const STATUSES = ["All", "Pending", "Processing", "Delivered", "Cancelled"] as const;
type FilterStatus = (typeof STATUSES)[number];

const STATUS_STYLE: Record<OrderRow["status"], string> = {
  Delivered:  "bg-green-50 text-green-700 ring-1 ring-green-200/60",
  Processing: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  Pending:    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  Cancelled:  "bg-red-50 text-red-600 ring-1 ring-red-200/60",
};

export default function OrdersTable({ orders: initial, currentAdminRole }: { orders: OrderRow[]; currentAdminRole: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [orders, setOrders]           = useState(initial);
  const [filter, setFilter]           = useState<FilterStatus>("All");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<OrderRow | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<Record<string, string>>({});

  useEffect(() => {
    const es = new EventSource("/api/admin/stream");
    es.onmessage = async () => {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) return;
      const data = await res.json();
      setOrders(data);
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  const confirmDelete = async () => {
    const order = confirmTarget;
    if (!order) return;
    setConfirmTarget(null);
    setDeletingId(order.id);
    try {
      const res  = await fetch("/api/admin/orders", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id }),
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError((p) => ({ ...p, [order.id]: data.error })); return; }
      setOrders((p) => p.filter((o) => o.id !== order.id));
      startTransition(() => router.refresh());
    } catch { setDeleteError((p) => ({ ...p, [order.id]: "Delete failed." })); }
    finally { setDeletingId(null); }
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (filter !== "All") list = list.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.item.toLowerCase().includes(q) ||
          o.user.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, search, orders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 whenever filter/search changes
  const handleFilter = (s: FilterStatus) => { setFilter(s); setPage(1); };
  const handleSearch = (v: string)        => { setSearch(v);  setPage(1); };

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: orders.length };
    for (const s of STATUSES) if (s !== "All") c[s] = orders.filter((o) => o.status === s).length;
    return c;
  }, [orders]);

  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to   = Math.min(safePage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto gap-5">
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Order"
        description={`Delete order "${confirmTarget?.id}"? This will permanently remove the order and all its items.`}
        confirmLabel="Delete"
        loading={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* ── Header (sticky) ── */}
      <div className="shrink-0 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Orders</h1>
            <p className="text-sm text-slate-400 mt-0.5">{orders.length} total orders</p>
          </div>
          <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by order #, product or customer..."
                className="h-9 w-full pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-400 transition-all"
              />
            </div>
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                  filter === s
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {s}
                <span className="ml-1 opacity-60">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table (scrollable) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none rounded-xl border border-slate-100 bg-white">
        {paginated.length > 0 ? (
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50/95 backdrop-blur-sm">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Products</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Branch</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Status</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="cursor-pointer group transition-all duration-200 ease-in-out hover:bg-green-50/50"
                >
                  <td className="px-5 py-3 font-semibold text-slate-800 text-xs whitespace-nowrap">{order.id}</td>
                  <td className="px-5 py-3 text-slate-700 font-medium text-sm whitespace-nowrap">{order.user}</td>
                  <td className="px-5 py-3 text-slate-500 text-sm max-w-[200px] truncate">{order.item}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{order.date}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800 whitespace-nowrap">₹{order.price.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3">
                    {order.branch
                      ? <span className="text-xs font-medium text-slate-600">{order.branch}</span>
                      : <span className="text-xs text-amber-500 font-medium">Unassigned</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {currentAdminRole === "superadmin" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmTarget(order); }}
                        disabled={deletingId === order.id}
                        title="Delete order"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-40 opacity-0 group-hover:opacity-100"
                      >
                        {deletingId === order.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <ShoppingCart className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No orders found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      {/* ── Pagination footer (sticky) ── */}
      {filtered.length > 0 && (
        <div className="shrink-0 flex items-center justify-between text-xs text-slate-400">
          <p>Showing {from}–{to} of {filtered.length} orders</p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={safePage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-slate-300 text-xs">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium border transition-colors ${
                      safePage === p
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
