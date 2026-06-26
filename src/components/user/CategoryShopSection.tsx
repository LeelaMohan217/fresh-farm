"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Plus, Minus, Package, Clock } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

type SubCategory = { id: number; name: string; slug: string; imageUrl: string | null };
type Product = {
  id: number; name: string; description: string;
  price: number; unit: string; stock: number;
  categoryId: number; categoryName: string; categorySlug: string;
  imageUrl: string | null; imageUrls: string[];
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&h=120&fit=crop";

function ProductCard({ product }: { product: Product }) {
  const { items, add, update } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const cartItem = items.find((i) => i.id === product.id);
  const discountPct = 13;
  const mrp = +(product.price * (100 / (100 - discountPct))).toFixed(0);

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-sm transition-all duration-200 flex flex-col">
      <div
        className="relative h-40 bg-[#f5f5f5] flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => router.push(`/shop/product/${product.id}`)}
      >
        {product.imageUrl
          ? <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
          : <Package className="w-14 h-14 text-slate-200" />
        }
        <div className="absolute top-0 left-0 bg-[#3f51b5] text-white text-[10px] font-extrabold px-1.5 py-1 leading-tight rounded-br-lg">
          {discountPct}%<br />OFF
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border">Out of stock</span>
          </div>
        )}
      </div>

      <div className="px-3 pt-2 pb-3 flex flex-col flex-1 gap-1">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <Clock className="w-3 h-3" /> 8 MINS
        </div>
        <p className="text-sm font-bold text-slate-900 leading-snug cursor-pointer hover:text-green-700 transition-colors line-clamp-2"
          onClick={() => router.push(`/shop/product/${product.id}`)}>
          {product.name}
        </p>
        <p className="text-xs text-slate-400">{product.unit}</p>

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

export default function CategoryShopSection({
  categoryName,
  categorySlug,
  subCategories,
  products,
}: {
  categoryName: string;
  categorySlug: string;
  subCategories: SubCategory[];
  products: Product[];
}) {
  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const { count, total } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!selectedSub) return products;
    return products.filter((p) => p.categoryId === selectedSub);
  }, [products, selectedSub]);

  const selectedSubName = subCategories.find((s) => s.id === selectedSub)?.name;

  return (
    <div>
      <div className="flex gap-0 bg-white rounded-2xl border border-slate-100 overflow-hidden min-h-[80vh]">

        {/* ── Sub-category sidebar ── */}
        <aside
          className="w-24 sm:w-28 shrink-0 border-r border-slate-100 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 120px)", position: "sticky", top: 80 }}
        >
          {/* All */}
          <button
            onClick={() => setSelectedSub(null)}
            className={`w-full flex flex-col items-center gap-1.5 py-3 px-1 transition-all border-l-2 ${
              !selectedSub ? "border-green-600 bg-green-50" : "border-transparent hover:bg-slate-50"
            }`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-xl">🛒</span>
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight ${!selectedSub ? "text-green-700" : "text-slate-600"}`}>
              All
            </span>
          </button>

          {subCategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSub(sub.id === selectedSub ? null : sub.id)}
              className={`w-full flex flex-col items-center gap-1.5 py-3 px-1 transition-all border-l-2 ${
                selectedSub === sub.id ? "border-green-600 bg-green-50" : "border-transparent hover:bg-slate-50"
              }`}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-100 relative">
                <Image
                  src={sub.imageUrl ?? FALLBACK_IMAGE}
                  alt={sub.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className={`text-[10px] font-semibold text-center leading-tight line-clamp-2 ${selectedSub === sub.id ? "text-green-700" : "text-slate-600"}`}>
                {sub.name}
              </span>
            </button>
          ))}
        </aside>

        {/* ── Product grid ── */}
        <div className="flex-1 min-w-0 p-4">
          <h2 className="text-base font-extrabold text-slate-900 mb-4">
            {selectedSubName ?? categoryName}
          </h2>

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
              <p className="text-sm text-slate-400 mt-1">Try a different sub-category</p>
            </div>
          )}
        </div>
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
            <Link href="/auth/login" className="flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl hover:bg-slate-800 transition-all cursor-pointer">
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
