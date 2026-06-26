"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus, Loader2, Trash2, Tag, AlertCircle, Layers,
  Pencil, X, ImagePlus, ToggleLeft, ToggleRight,
  Eye, EyeOff, ArrowLeft,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CustomSelect from "./CustomSelect";
import type { SubCategoryRow, ParentRow } from "@/app/admin/(protected)/products/categories/subcategories/page";

const EMPTY = { name: "", imageUrl: null as string | null, active: true, parentId: "" };

export default function SubCategoriesClient({
  subCategories: initial,
  parents,
}: {
  subCategories: SubCategoryRow[];
  parents: ParentRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [subs, setSubs]           = useState(initial);
  const [form, setForm]           = useState({ ...EMPTY, parentId: parents[0]?.id?.toString() ?? "" });
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding]       = useState(false);
  const [formError, setFormError] = useState("");
  const [filterParent, setFilterParent] = useState<number | "all">("all");

  const [editSub, setEditSub]     = useState<SubCategoryRow | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok) setForm((f) => ({ ...f, imageUrl: d.url }));
    } finally { setUploading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.parentId) return;
    setFormError(""); setAdding(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), imageUrl: form.imageUrl, active: form.active, parentId: Number(form.parentId) }),
      });
      const d = await res.json();
      if (!res.ok) { setFormError(d.error); return; }
      const parentName = parents.find((p) => p.id === Number(form.parentId))?.name ?? "";
      setSubs((p) => [...p, {
        id: d.category.id, name: d.category.name, slug: d.category.slug,
        imageUrl: d.category.image_url ?? null, active: d.category.active,
        parentId: Number(form.parentId), parentName, productCount: 0,
      }].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((f) => ({ ...EMPTY, parentId: f.parentId }));
      startTransition(() => router.refresh());
    } catch { setFormError("Something went wrong."); }
    finally { setAdding(false); }
  }

  async function patchActive(sub: SubCategoryRow, active: boolean) {
    setSubs((p) => p.map((s) => s.id === sub.id ? { ...s, active } : s));
    await fetch("/api/admin/categories", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sub.id, name: sub.name, imageUrl: sub.imageUrl, active, parentId: sub.parentId }),
    });
    startTransition(() => router.refresh());
  }

  async function doDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (!res.ok) { alert(d.error); return; }
      setSubs((p) => p.filter((s) => s.id !== id));
      startTransition(() => router.refresh());
    } finally { setDeletingId(null); }
  }

  const filteredSubs = filterParent === "all" ? subs : subs.filter((s) => s.parentId === filterParent);
  const confirmSub = subs.find((s) => s.id === confirmId);

  return (
    <div className="h-full flex flex-col gap-5">
      <ConfirmDialog open={!!confirmId} title="Delete Sub-category"
        description={`Delete "${confirmSub?.name}"?${confirmSub?.productCount ? ` ${confirmSub.productCount} product(s) use this.` : ""}`}
        confirmLabel="Delete" loading={deletingId === confirmId}
        onConfirm={() => { const id = confirmId!; setConfirmId(null); doDelete(id); }}
        onCancel={() => setConfirmId(null)} />

      {editSub && (
        <EditModal sub={editSub} parents={parents} onClose={() => setEditSub(null)}
          onSaved={(u) => {
            setSubs((p) => p.map((s) => s.id === u.id ? { ...s, ...u } : s).sort((a, b) => a.name.localeCompare(b.name)));
            setEditSub(null);
            startTransition(() => router.refresh());
          }} />
      )}

      {/* Header */}
      <div className="shrink-0 flex items-center gap-3">
        <button onClick={() => router.push("/admin/products/categories")}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Sub-categories</h1>
          <p className="text-sm text-slate-400 mt-0.5">Organise products within each category</p>
        </div>
      </div>

      {parents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-20 text-center">
          <Layers className="w-8 h-8 text-slate-200 mb-2" />
          <p className="text-sm font-medium text-slate-500">No categories found</p>
          <p className="text-xs text-slate-400 mt-1">Add at least one category before creating sub-categories</p>
          <button onClick={() => router.push("/admin/products/categories")}
            className="mt-4 h-9 px-4 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors cursor-pointer">
            Go to Categories
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 flex-1 min-h-0">

          {/* ── LEFT: Add form ── */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 sticky top-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> New Sub-category
              </p>

              <form onSubmit={handleAdd} className="space-y-4">
                {/* Parent selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Under Category *
                  </label>
                  <CustomSelect required value={form.parentId}
                    onChange={(v) => setForm((f) => ({ ...f, parentId: v }))}
                    options={parents.map((p) => ({ value: String(p.id), label: p.name }))}
                    placeholder="Select a category..." />
                </div>

                {/* Image upload */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Image</label>
                  <div onClick={() => fileRef.current?.click()}
                    className="relative w-full h-28 rounded-xl border-2 border-dashed border-slate-200 hover:border-green-400 cursor-pointer overflow-hidden flex items-center justify-center bg-slate-50 transition-colors">
                    {form.imageUrl
                      ? <Image src={form.imageUrl} alt="preview" fill className="object-cover" />
                      : <div className="flex flex-col items-center gap-1 text-slate-400"><ImagePlus className="w-5 h-5" /><p className="text-[11px]">Click to upload</p></div>}
                    {uploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-green-600" /></div>}
                  </div>
                  {form.imageUrl && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}
                      className="text-xs text-red-500 mt-1 hover:underline cursor-pointer">Remove</button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Name *
                  </label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Leafy Vegetables" maxLength={50} required
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all" />
                  {form.name && (
                    <p className="text-[11px] text-slate-400">Slug: <span className="font-mono">{form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}</span></p>
                  )}
                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    {form.active ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{form.active ? "Visible in shop" : "Hidden from shop"}</p>
                      <p className="text-[10px] text-slate-400">{form.active ? "Customers can browse" : "Only admins see this"}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, active: !f.active }))} className="cursor-pointer">
                    {form.active ? <ToggleRight className="w-8 h-8 text-green-600" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>

                {formError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{formError}</p>}

                <button type="submit" disabled={adding || uploading || !form.name.trim() || !form.parentId}
                  className="w-full h-10 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : "Add Sub-category"}
                </button>
              </form>
            </div>
          </div>

          {/* ── RIGHT: List ── */}
          <div className="md:col-span-3 flex flex-col gap-3 min-h-0">
            <div className="shrink-0 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Sub-categories <span className="font-normal text-slate-400 normal-case ml-1">({filteredSubs.length})</span>
              </p>
            </div>

            {/* Filter pills */}
            <div className="shrink-0 flex items-center gap-2 flex-wrap">
              <button onClick={() => setFilterParent("all")}
                className={`h-7 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${filterParent === "all" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                All
              </button>
              {parents.map((p) => (
                <button key={p.id} onClick={() => setFilterParent(filterParent === p.id ? "all" : p.id)}
                  className={`h-7 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${filterParent === p.id ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-green-200 hover:text-green-700"}`}>
                  {p.name}
                </button>
              ))}
            </div>

            {filteredSubs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-16 text-center flex-1">
                <Layers className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm font-medium text-slate-500">
                  {filterParent === "all"
                    ? "No sub-categories yet"
                    : `No sub-categories under "${parents.find((p) => p.id === filterParent)?.name}"`}
                </p>
                <p className="text-xs text-slate-400 mt-1">Use the form on the left to add one</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 min-h-0 scrollbar-none">
                {filteredSubs.map((sub) => (
                  <div key={sub.id}
                    className="bg-white rounded-xl border border-slate-100 px-3 py-2.5 flex items-center gap-3 group hover:border-slate-200 transition-colors">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
                      {sub.imageUrl
                        ? <Image src={sub.imageUrl} alt={sub.name} fill className="object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{sub.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">{sub.parentName}</span>
                        <span className="text-[10px] text-slate-400">{sub.productCount} {sub.productCount === 1 ? "product" : "products"}</span>
                      </div>
                    </div>
                    <button onClick={() => patchActive(sub, !sub.active)} className="cursor-pointer shrink-0">
                      {sub.active ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setEditSub(sub)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-green-600 hover:bg-green-50 transition-colors cursor-pointer">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => setConfirmId(sub.id)} disabled={deletingId === sub.id}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                        {deletingId === sub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ sub, parents, onClose, onSaved }: {
  sub: SubCategoryRow;
  parents: ParentRow[];
  onClose: () => void;
  onSaved: (u: Partial<SubCategoryRow> & { id: number }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: sub.name, imageUrl: sub.imageUrl, active: sub.active, parentId: String(sub.parentId) });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sub.id, name: form.name.trim(), imageUrl: form.imageUrl, active: form.active, parentId: Number(form.parentId) }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      const parentName = parents.find((p) => p.id === Number(form.parentId))?.name ?? sub.parentName;
      onSaved({ id: sub.id, name: d.category.name, slug: d.category.slug, imageUrl: d.category.image_url ?? null, active: d.category.active, parentId: Number(form.parentId), parentName });
    } catch { setError("Save failed."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-bold text-slate-900">Edit Sub-category</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CustomSelect required value={form.parentId} onChange={(v) => setForm((f) => ({ ...f, parentId: v }))}
            options={parents.map((p) => ({ value: String(p.id), label: p.name }))}
            placeholder="Select category..." />

          <div>
            <div onClick={() => fileRef.current?.click()}
              className="relative w-full h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-green-400 cursor-pointer overflow-hidden flex items-center justify-center bg-slate-50 transition-colors">
              {form.imageUrl
                ? <Image src={form.imageUrl} alt="preview" fill className="object-cover" />
                : <div className="flex flex-col items-center gap-1 text-slate-400"><ImagePlus className="w-5 h-5" /><p className="text-[11px]">Click to upload</p></div>}
              {uploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-green-600" /></div>}
            </div>
            {form.imageUrl && <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: null }))} className="text-xs text-red-500 mt-1 hover:underline cursor-pointer">Remove</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); const fd = new FormData(); fd.append("file", f); const r = await fetch("/api/admin/upload", { method: "POST", body: fd }); const d = await r.json(); if (r.ok) setForm((p) => ({ ...p, imageUrl: d.url })); setUploading(false); e.target.value = ""; }} />

          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Sub-category name" required
            className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all" />

          <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              {form.active ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
              <p className="text-xs font-semibold text-slate-800">{form.active ? "Visible" : "Hidden"}</p>
            </div>
            <button type="button" onClick={() => setForm((f) => ({ ...f, active: !f.active }))} className="cursor-pointer">
              {form.active ? <ToggleRight className="w-8 h-8 text-green-600" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
            </button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-10 border border-slate-200 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving || uploading || !form.name.trim()}
              className="flex-1 h-10 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
