"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Plus, Minus, Package, Clock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

type Product  = { id: number; name: string; description: string; price: number; unit: string; stock: number; categoryId: number; categoryName: string; categorySlug: string; imageUrl: string | null; imageUrls: string[] };
type Category = { id: number; name: string; slug: string; imageUrl: string | null };

// Dummy category images using Unsplash (food-themed)
const CATEGORY_IMAGES: Record<string, string> = {
  "fresh-vegetables":    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&h=120&fit=crop",
  "vegetables":          "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&h=120&fit=crop",
  "organic-vegetables":  "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&h=120&fit=crop",
  "bulb-vegetables":     "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120&h=120&fit=crop",
  "leafy-vegetables":    "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=120&h=120&fit=crop",
  "fruits":              "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=120&h=120&fit=crop",
  "fresh-fruits":        "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=120&h=120&fit=crop",
  "organic-fruits":      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=120&h=120&fit=crop",
  "mangoes-melons":      "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=120&h=120&fit=crop",
  "herbs":               "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=120&h=120&fit=crop",
  "seasonal":            "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=120&h=120&fit=crop",
  "exotics":             "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=120&h=120&fit=crop",
  "equipment":           "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=120&h=120&fit=crop",
  "nutrients":           "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=120&h=120&fit=crop",
};

const FALLBACK_CAT_IMAGE = "https://images.unsplash.com/photo-1506484381205-f7945653044d?w=120&h=120&fit=crop";

function getCategoryImage(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? FALLBACK_CAT_IMAGE;
}

function ProductCard({ product }: { product: Product }) {
  const { items, add, update } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const cartItem = items.find((i) => i.id === product.id);
  const discountPct = 13;
  const mrp = +(product.price * (100 / (100 - discountPct))).toFixed(0);

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-sm transition-all duration-200 flex flex-col">
      {/* Image */}
      <div
        className="relative h-40 bg-[#f5f5f5] flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => router.push(`/shop/${product.id}`)}
      >
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <Package className="w-14 h-14 text-slate-200" />
        )}
        {/* Discount badge */}
        <div className="absolute top-0 left-0 bg-[#3f51b5] text-white text-[10px] font-extrabold px-1.5 py-1 leading-tight rounded-br-lg">
          {discountPct}%<br />OFF
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">Out of stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pt-2 pb-3 flex flex-col flex-1 gap-1">
        {/* Delivery time */}
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <Clock className="w-3 h-3" /> 8 MINS
        </div>

        {/* Name + unit */}
        <p
          className="text-sm font-bold text-slate-900 leading-snug cursor-pointer hover:text-green-700 transition-colors line-clamp-2"
          onClick={() => router.push(`/shop/${product.id}`)}
        >{product.name}</p>
        <p className="text-xs text-slate-400">{product.unit}</p>

        {/* Price row + ADD button */}
        <div className="flex items-end justify-between mt-1 gap-2">
          <div>
            <p className="text-sm font-extrabold text-slate-900">₹{product.price}</p>
            <p className="text-[11px] text-slate-400 line-through">₹{mrp}</p>
          </div>

          {product.stock > 0 && (
            cartItem ? (
              <div className="flex items-center border-2 border-green-600 rounded-lg overflow-hidden shrink-0">
                <button onClick={() => update(product.id, cartItem.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 transition cursor-pointer">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-slate-900">{cartItem.quantity}</span>
                <button onClick={() => update(product.id, cartItem.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 transition cursor-pointer">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => user ? add({ id: product.id, name: product.name, price: product.price, unit: product.unit }) : router.push("/auth/login")}
                className="shrink-0 text-sm font-bold text-green-600 border-2 border-green-600 px-4 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition-all cursor-pointer"
              >ADD</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopSection({ products, categories }: { products: Product[]; categories: Category[]; initialSearch?: string }) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const { count, total } = useCart();
  const { user }         = useAuth();
  const router           = useRouter();
  const sidebarRef       = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory) list = list.filter((p) => p.categoryId === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedCategory, search]);

  // Scroll active category into view in sidebar
  useEffect(() => {
    if (!sidebarRef.current || !selectedCategory) return;
    const el = sidebarRef.current.querySelector(`[data-cat="${selectedCategory}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedCategory]);

  const selectedCatName = categories.find(c => c.id === selectedCategory)?.name;

  return (
    <div className="flex gap-0 bg-white rounded-2xl border border-slate-100 overflow-hidden min-h-[80vh]">

      {/* ── Sidebar ── */}
      <aside
        ref={sidebarRef}
        className="w-20 sm:w-24 shrink-0 border-r border-slate-100 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 100px)", position: "sticky", top: 80 }}
      >
        {/* All */}
        <button
          data-cat="all"
          onClick={() => setSelectedCategory(null)}
          className={`w-full flex flex-col items-center gap-1.5 py-3 px-1 transition-all border-l-2 ${
            !selectedCategory ? "border-green-600 bg-green-50" : "border-transparent hover:bg-slate-50"
          }`}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
            <span className="text-xl">🛒</span>
          </div>
          <span className={`text-[10px] font-semibold text-center leading-tight ${!selectedCategory ? "text-green-700" : "text-slate-600"}`}>
            All
          </span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            data-cat={cat.id}
            onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
            className={`w-full flex flex-col items-center gap-1.5 py-3 px-1 transition-all border-l-2 ${
              selectedCategory === cat.id ? "border-green-600 bg-green-50" : "border-transparent hover:bg-slate-50"
            }`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-100 relative">
              <Image
                src={cat.imageUrl ?? getCategoryImage(cat.slug)}
                alt={cat.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight line-clamp-2 ${selectedCategory === cat.id ? "text-green-700" : "text-slate-600"}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 p-4">

        {/* Section heading */}
        <h2 className="text-base font-extrabold text-slate-900 mb-4">
          {search.trim() ? `Results for "${search}"` : selectedCatName ?? "All Products"}
        </h2>

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-700 font-semibold">No products found</p>
            <p className="text-sm text-slate-400 mt-1">Try a different category</p>
          </div>
        )}
      </div>

      {/* Floating cart */}
      {count > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          {user ? (
            <button
              onClick={() => router.push("/checkout")}
              className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{count}</span>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 leading-none">{count} item{count !== 1 ? "s" : ""}</p>
                <p className="text-sm font-bold leading-tight">₹{total.toLocaleString("en-IN")}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <span className="text-sm font-semibold">Checkout</span>
            </button>
          ) : (
            <Link href="/auth/login"
              className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm font-semibold">{count} item{count !== 1 ? "s" : ""} · ₹{total.toLocaleString("en-IN")}</span>
              <div className="w-px h-5 bg-white/20" />
              <span className="text-sm font-semibold text-green-400">Login to checkout</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
