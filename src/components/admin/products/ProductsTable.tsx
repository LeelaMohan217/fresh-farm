"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Package, Pencil, Trash2, Loader2, Plus, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  categoryName: string;
  branchId: number | null;
  branchName: string | null;
};


export default function ProductsTable({
  products: initial,
  isBranchAdmin = false,
}: {
  products: Product[];
  isBranchAdmin?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [products, setProducts]         = useState(initial);
  const [search, setSearch]             = useState("");
  const [deletingId, setDeletingId]     = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Product | null>(null);
  const [deleteError, setDeleteError]   = useState("");
  const [sortKey, setSortKey]           = useState<"price" | "stock" | null>(null);
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");

  const toggleSort = (key: "price" | "stock") => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: "price" | "stock" }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 text-green-600" />
      : <ArrowDown className="w-3 h-3 text-green-600" />;
  };

  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) =>
        sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
      );
    }
    return list;
  }, [products, search, sortKey, sortDir]);

  const handleDelete = (p: Product) => { setDeleteError(""); setConfirmTarget(p); };

  const confirmDelete = async () => {
    const p = confirmTarget;
    if (!p) return;
    setConfirmTarget(null);
    setDeletingId(p.id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      if (!res.ok) { setDeleteError((await res.json()).error ?? "Delete failed."); return; }
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      startTransition(() => router.refresh());
    } catch {
      setDeleteError("Delete failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Product"
        description={`Delete "${confirmTarget?.name}"? This cannot be undone and will remove it from order history.`}
        confirmLabel="Delete"
        loading={deletingId === confirmTarget?.id}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* ── Sticky header ── */}
      <div className="shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-sm text-slate-400 mt-0.5">{products.length} items in catalogue</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* ── Sticky search + error ── */}
      <div className="shrink-0 space-y-2">
        <div className="flex gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-9 w-full pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-400 transition-all"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {deleteError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg">{deleteError}</p>
        )}
      </div>

      {/* ── Scrollable table area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none rounded-xl border border-slate-100 bg-white">
        {products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No products yet</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Start by adding your first product.</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try a different search term.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50/95 backdrop-blur-sm">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Product</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Category</th>
                {!isBranchAdmin && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Branch</th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">
                  <button onClick={() => toggleSort("price")} className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer">
                    Price <SortIcon col="price" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Unit</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">
                  <button onClick={() => toggleSort("stock")} className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer">
                    Stock <SortIcon col="stock" />
                  </button>
                </th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 leading-tight">{p.name}</p>
                        {p.description && (
                          <p className="text-[11px] text-slate-400 leading-tight truncate max-w-xs">{p.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">
                      {p.categoryName}
                    </span>
                  </td>
                  {!isBranchAdmin && (
                    <td className="px-5 py-3.5">
                      {p.branchName ? (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {p.branchName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">All branches</span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5 font-semibold text-slate-800">
                    ₹{p.price.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{p.unit}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium ${
                      p.stock === 0 ? "text-red-600" :
                      p.stock < 10 ? "text-amber-600" : "text-green-700"
                    }`}>
                      {p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === p.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer count ── */}
      {filtered.length > 0 && products.length > 0 && (
        <p className="shrink-0 text-xs text-slate-400">
          Showing {filtered.length} of {products.length} products
        </p>
      )}
    </div>
  );
}
