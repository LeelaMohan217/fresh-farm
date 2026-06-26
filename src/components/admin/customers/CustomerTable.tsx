"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Users, Trash2, Loader2, Mail, Phone,
  IndianRupee, ShoppingBag, TrendingUp, ChevronLeft, ChevronRight, RotateCcw,
} from "lucide-react";

const STAT_ICONS: Record<string, React.ElementType> = {
  Users, TrendingUp, IndianRupee, ShoppingBag,
};
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Customer = {
  id: string; name: string; email: string; phone: string;
  status: string; joinedDate: string;
  totalOrders: number; totalSpent: number; lastOrder: string | null;
};

type Stat = {
  label: string; value: string;
  icon: string; color: string;
};

const AVATAR_COLORS = [
  "bg-green-100 text-green-700", "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700", "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",   "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",   "bg-teal-100 text-teal-700",
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

const PAGE_SIZE = 25;
const FILTER_OPTIONS = ["All", "Active", "Inactive"] as const;
type FilterType = (typeof FILTER_OPTIONS)[number];

export default function CustomerTable({
  customers: initial, stats, currentAdminRole,
}: {
  customers: Customer[];
  stats: Stat[];
  currentAdminRole: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [customers, setCustomers]         = useState(initial);
  const [filter, setFilter]               = useState<FilterType>("All");
  const [search, setSearch]               = useState("");
  const [page, setPage]                   = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<Customer | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [deleteError, setDeleteError]     = useState("");

  const filtered = useMemo(() => {
    let list = customers;
    if (filter !== "All") list = list.filter((c) => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [customers, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilter = (f: FilterType) => { setFilter(f); setPage(1); };
  const handleSearch = (v: string)      => { setSearch(v); setPage(1); };

  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to   = Math.min(safePage * PAGE_SIZE, filtered.length);

  const confirmDelete = async () => {
    const customer = confirmTarget;
    if (!customer) return;
    setConfirmTarget(null);
    setDeleteError("");
    setDeletingId(customer.id);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id }),
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error); return; }
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      startTransition(() => router.refresh());
    } catch {
      setDeleteError("Delete failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Customer"
        description={`Delete "${confirmTarget?.name}"? This will permanently remove their account, orders, and all associated data.`}
        confirmLabel="Delete Customer"
        loading={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* ── Sticky header ── */}
      <div className="shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Customers</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage and view your customer base</p>
      </div>

      {/* ── Sticky stat cards ── */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = STAT_ICONS[s.icon] ?? Users;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-900 tracking-tight">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sticky search + filters ── */}
      <div className="shrink-0 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by customer name..."
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
          <div className="flex gap-1.5">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => handleFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                  filter === f
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {deleteError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg">{deleteError}</p>
        )}
      </div>

      {/* ── Scrollable table ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none rounded-xl border border-slate-100 bg-white">
        {filtered.length > 0 ? (
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50/95 backdrop-blur-sm">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Orders</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Total Spent</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Last Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Status</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((customer, i) => (
                <tr
                  key={customer.id}
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  className="cursor-pointer group transition-all duration-200 ease-in-out hover:bg-green-50/50 hover:-translate-y-px"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 leading-tight">{customer.name}</p>
                        <p className="text-[11px] text-slate-400 leading-tight">{customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />{customer.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />{customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{customer.totalOrders}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">
                    ₹{customer.totalSpent.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{customer.lastOrder ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{customer.joinedDate}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                      customer.status === "Active"
                        ? "bg-green-50 text-green-700 ring-1 ring-green-200/60"
                        : "bg-slate-100 text-slate-500 ring-1 ring-slate-200/60"
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    {currentAdminRole === "superadmin" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmTarget(customer); }}
                        disabled={deletingId === customer.id}
                        title="Delete customer"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-40"
                      >
                        {deletingId === customer.id
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
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No customers found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      {/* ── Pagination footer ── */}
      {filtered.length > 0 && (
        <div className="shrink-0 flex items-center justify-between text-xs text-slate-400">
          <p>Showing {from}–{to} of {filtered.length} customers</p>

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
