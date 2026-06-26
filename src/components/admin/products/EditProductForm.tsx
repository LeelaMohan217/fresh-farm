"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Loader2, Package, IndianRupee,
  Tag, Layers, Archive, FileText, CheckCircle2,
  ImagePlus, X, Star, GitBranch,
} from "lucide-react";
import CustomSelect from "./CustomSelect";

type Category = { id: number; name: string };
type Branch   = { id: number; name: string };

type ImageEntry = {
  id: string;           // unique local key
  preview: string;      // URL for display (object URL or server URL)
  url: string | null;   // server URL after upload
  uploading: boolean;
  error: string;
  existing: boolean;    // true = was already saved, false = newly uploaded
};

const UNITS = ["kg", "pcs", "bunch", "box", "litre", "bag", "unit"];
const MAX_IMAGES = 5;

const CATEGORY_EMOJI: Record<string, string> = {
  Vegetables: "🥬", Fruits: "🍓", Herbs: "🌿",
  Equipment: "⚙️", Nutrients: "🧪",
};

type Props = {
  categories: Category[];
  branches?: Branch[];
  isBranchAdmin?: boolean;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    unit: string;
    categoryId: number;
    stock: number;
    imageUrls: string[];
    branchId?: number | null;
  };
};

export default function EditProductForm({ categories, branches = [], isBranchAdmin = false, product }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  // Pre-populate images from existing image_urls
  const [images, setImages] = useState<ImageEntry[]>(() =>
    product.imageUrls.map((url, i) => ({
      id: `existing-${i}-${url}`,
      preview: url,
      url,
      uploading: false,
      error: "",
      existing: true,
    }))
  );

  const [form, setForm] = useState({
    name:        product.name,
    description: product.description,
    price:       product.price.toString(),
    unit:        product.unit,
    categoryId:  product.categoryId.toString(),
    stock:       product.stock.toString(),
    branchId:    product.branchId?.toString() ?? "",
  });

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const anyUploading = images.some((i) => i.uploading);

  /* ── Pick files ── */
  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const slots = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, slots);

    const newEntries: ImageEntry[] = toAdd.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(f),
      url: null,
      uploading: true,
      error: "",
      existing: false,
    }));

    setImages((prev) => [...prev, ...newEntries]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    await Promise.all(
      toAdd.map(async (file, idx) => {
        const entryId = newEntries[idx].id;
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
          const data = await res.json();
          setImages((prev) =>
            prev.map((img) =>
              img.id === entryId
                ? { ...img, uploading: false, url: res.ok ? data.url : null, error: res.ok ? "" : data.error }
                : img
            )
          );
        } catch {
          setImages((prev) =>
            prev.map((img) =>
              img.id === entryId
                ? { ...img, uploading: false, error: "Upload failed." }
                : img
            )
          );
        }
      })
    );
  };

  const removeImage = (id: string) =>
    setImages((prev) => prev.filter((i) => i.id !== id));

  const makePrimary = (id: string) =>
    setImages((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const [item] = updated.splice(idx, 1);
      updated.unshift(item);
      return updated;
    });

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (anyUploading) return;
    setError("");
    setLoading(true);

    try {
      const imageUrls = images.filter((i) => i.url).map((i) => i.url as string);
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          ...form,
          price: parseFloat(form.price),
          stock: parseInt(form.stock) || 0,
          categoryId: parseInt(form.categoryId),
          branchId: form.branchId ? parseInt(form.branchId) : null,
          imageUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(true);
      setTimeout(() => router.push("/admin/products"), 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 text-center space-y-3">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <p className="text-lg font-bold text-slate-900">Product updated successfully!</p>
        <p className="text-sm text-slate-400">Redirecting to products list...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/products")}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Edit Product</h1>
          <p className="text-sm text-slate-400 mt-0.5">Update details for {product.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Images ── */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Product Images
            </p>
            <span className="text-xs text-slate-400">
              {images.length}/{MAX_IMAGES} uploaded
            </span>
          </div>

          {/* Grid of uploaded images */}
          {images.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, idx) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                  <Image
                    src={img.preview}
                    alt={`Product image ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={img.preview.startsWith("blob:")}
                  />

                  {/* Uploading overlay */}
                  {img.uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                    </div>
                  )}

                  {/* Error overlay */}
                  {img.error && !img.uploading && (
                    <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center p-1">
                      <p className="text-[10px] text-red-600 text-center leading-tight">{img.error}</p>
                    </div>
                  )}

                  {/* Primary badge */}
                  {idx === 0 && img.url && (
                    <div className="absolute bottom-1 left-1 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-white" /> Main
                    </div>
                  )}

                  {/* Hover actions */}
                  {!img.uploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {idx !== 0 && img.url && (
                        <button
                          type="button"
                          onClick={() => makePrimary(img.id)}
                          title="Set as main image"
                          className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-700 hover:text-green-600 transition-colors"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-700 hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add more slot */}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-green-400 hover:bg-green-50/50 flex flex-col items-center justify-center gap-1 transition-all group"
                >
                  <ImagePlus className="w-5 h-5 text-slate-300 group-hover:text-green-500 transition-colors" />
                  <span className="text-[10px] text-slate-400 group-hover:text-green-600">Add</span>
                </button>
              )}
            </div>
          )}

          {/* Empty state — full drop area */}
          {images.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 hover:border-green-400 hover:bg-green-50/50 flex flex-col items-center justify-center gap-2 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-green-600 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 group-hover:text-green-700 transition-colors">
                  Click to upload images
                </p>
                <p className="text-xs text-slate-400 mt-0.5">JPG, PNG or WebP · Max 5MB each · Up to 5 images</p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />

          {images.length > 0 && (
            <p className="text-[11px] text-slate-400">
              Hover an image to set it as the main photo or remove it.
              {images.length < MAX_IMAGES && " Click the + tile to add more."}
            </p>
          )}
        </div>

        {/* ── Basic Info ── */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Basic Info</p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-400" /> Product Name *
            </label>
            <input
              required value={form.name} onChange={set("name")}
              placeholder="e.g. Organic Spinach"
              className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Description
            </label>
            <textarea
              value={form.description} onChange={set("description")}
              placeholder="Describe the product — freshness, growing method, benefits..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all resize-none"
            />
          </div>
        </div>

        {/* ── Pricing & Unit ── */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pricing & Unit</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> Price (₹) *
              </label>
              <input
                required type="number" min="0" step="0.01"
                value={form.price} onChange={set("price")}
                placeholder="0.00"
                className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Unit *
              </label>
              <CustomSelect
                required
                value={form.unit}
                onChange={(v) => setForm((p) => ({ ...p, unit: v }))}
                options={UNITS.map((u) => ({ value: u, label: u }))}
              />
            </div>
          </div>
        </div>

        {/* ── Category & Stock ── */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Category & Inventory</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Category *
              </label>
              {categories.length > 0 ? (
                <CustomSelect
                  required
                  value={form.categoryId}
                  onChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}
                  placeholder="Select category"
                  options={categories.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                    emoji: CATEGORY_EMOJI[c.name] ?? "📦",
                  }))}
                />
              ) : (
                <div className="h-10 px-3 flex items-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
                  No categories —{" "}
                  <a href="/admin/products/categories" className="underline ml-1">add one first</a>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-slate-400" /> Stock Quantity
              </label>
              <input
                type="number" min="0"
                value={form.stock} onChange={set("stock")}
                placeholder="0"
                className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Branch (superadmin only) ── */}
        {!isBranchAdmin && (
          <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Branch Assignment</p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" /> Assign to Branch
              </label>
              <CustomSelect
                value={form.branchId}
                onChange={(v) => setForm((p) => ({ ...p, branchId: v }))}
                placeholder="Select branch (optional)"
                options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
              />
              <p className="text-[11px] text-slate-400">Leave unassigned to make this product visible across all branches.</p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={loading || anyUploading || categories.length === 0}
            className="h-10 px-6 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : anyUploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              : "Save Changes"
            }
          </button>
          <button
            type="button" onClick={() => router.push("/admin/products")}
            className="h-10 px-4 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
