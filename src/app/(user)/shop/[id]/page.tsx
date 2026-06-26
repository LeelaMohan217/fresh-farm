"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft, ShoppingCart, Plus, Minus, Package,
  Leaf, ShieldCheck, Truck, Star, ChevronRight, ChevronLeft as ChevLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

type Product = {
  id: number; name: string; description: string;
  price: number; unit: string; stock: number;
  imageUrls: string[]; categoryId: number;
  categoryName: string; categorySlug: string;
};

type Similar = {
  id: number; name: string; price: number; unit: string;
  stock: number; imageUrl: string | null; imageUrls: string[]; categorySlug: string; categoryName: string;
};

const CATEGORY_BG: Record<string, string> = {
  vegetables: "from-green-50 to-emerald-100",
  fruits: "from-rose-50 to-pink-100",
  herbs: "from-teal-50 to-green-100",
  equipment: "from-slate-50 to-blue-50",
  nutrients: "from-amber-50 to-yellow-100",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { items, add, update } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Similar[]>([]);
  const [topInCategory, setTopInCategory] = useState<Similar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  const cartItem = items.find((i) => i.id === product?.id);
  const bg = CATEGORY_BG[product?.categorySlug ?? ""] ?? "from-green-50 to-slate-100";

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data.product);
        setSimilar(data.similar ?? []);
        setTopInCategory(data.topInCategory ?? []);
        setActiveImg(0);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 pointer-events-none select-none">
        <Skeleton className="h-4 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image area */}
          <div className="space-y-3">
            <Skeleton className="w-full aspect-square rounded-2xl" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-16 h-16 rounded-xl" />)}
            </div>
          </div>
          {/* Info area */}
          <div className="space-y-4">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
            <div className="flex gap-3 mt-6">
              <Skeleton className="h-12 w-32 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
        {/* Similar products */}
        <div className="mt-10 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="w-full aspect-square rounded-2xl" />
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <Package className="w-12 h-12 text-slate-300" />
        <p className="text-lg font-medium">Product not found</p>
        <button onClick={() => router.push("/shop")} className="text-green-600 underline text-sm cursor-pointer">Back to shop</button>
      </div>
    );
  }

  const images = product.imageUrls.length > 0 ? product.imageUrls : [null];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">

        {/* ── Left: Image Gallery ── */}
        <div className="flex flex-col gap-3">
          {/* Main image */}
          <div className="relative bg-white rounded-2xl overflow-hidden aspect-square flex items-center justify-center border border-slate-100">
            {images[activeImg] ? (
              <Image src={images[activeImg]!} alt={product.name} fill className="object-contain p-4" />
            ) : (
              <Package className="w-24 h-24 text-slate-200" />
            )}

            {/* Prev/Next arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg((a) => (a - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg border border-slate-100 transition cursor-pointer"
                >
                  <ChevLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={() => setActiveImg((a) => (a + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg border border-slate-100 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip — centered */}
          {images.length > 1 && (
            <div className="flex gap-2 justify-center">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-white
                    ${i === activeImg ? "border-green-500" : "border-slate-100 hover:border-slate-300"}`}>
                  {img ? (
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-contain p-1" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Product Info ── */}
        <div className="flex flex-col gap-4">

          {/* Category + name */}
          <div>
            <span className="inline-block text-[11px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1">
              {product.categoryName}
            </span>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 leading-snug">{product.name}</h1>
              {product.stock === 0 ? (
                <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5">Out of stock</span>
              ) : product.stock <= 10 ? (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5">Only {product.stock} left</span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />In stock
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Per {product.unit} · Farm fresh · Zero pesticides</p>
          </div>

          {/* Price block */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-black text-slate-900">₹{product.price.toFixed(2)}</span>
            <span className="text-sm text-slate-400">/ {product.unit}</span>
            {/* Simulated MRP & discount */}
            <span className="text-sm text-slate-400 line-through">₹{(product.price * 1.15).toFixed(2)}</span>
            <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5">13% OFF</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 -mt-2">
            <span>MRP incl. of all taxes</span>
            <span className="text-green-600 font-semibold">You save ₹{(product.price * 0.15).toFixed(2)}</span>
          </div>

          {/* Add to cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              {!cartItem ? (
                <button
                  onClick={() => user ? add({ id: product.id, name: product.name, price: product.price, unit: product.unit }) : router.push("/auth/login")}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer text-sm shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to cart
                </button>
              ) : (
                <div className="flex items-center gap-1 border-2 border-green-600 rounded-xl overflow-hidden">
                  <button onClick={() => update(product.id, cartItem.quantity - 1)}
                    className="w-9 h-9 flex items-center justify-center text-green-600 hover:bg-green-50 transition cursor-pointer">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-slate-900 text-sm">{cartItem.quantity}</span>
                  <button onClick={() => update(product.id, cartItem.quantity + 1)}
                    className="w-9 h-9 flex items-center justify-center text-green-600 hover:bg-green-50 transition cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">About this product</p>
              <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Trust strip */}
          <div className="flex items-stretch gap-2 pt-1">
            {[
              { icon: <Leaf className="w-4 h-4 text-green-600" />, title: "100% Organic", desc: "Zero pesticides" },
              { icon: <Truck className="w-4 h-4 text-blue-500" />, title: "Fresh Delivery", desc: "Farm to doorstep" },
              { icon: <ShieldCheck className="w-4 h-4 text-purple-500" />, title: "Quality Assured", desc: "Always fresh" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex-1 flex flex-col items-center text-center gap-1.5 border border-slate-100 rounded-xl py-3 px-2 bg-white">
                {icon}
                <p className="text-[11px] font-bold text-slate-700 leading-tight">{title}</p>
                <p className="text-[10px] text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-extrabold text-slate-900">Similar Products</h2>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{similar.length} items</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similar.map((s) => {
              const cartEntry = items.find((i) => i.id === s.id);
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-green-200 transition-all duration-200 flex flex-col">
                  <div
                    className={`relative h-32 bg-gradient-to-br ${CATEGORY_BG[s.categorySlug] ?? "from-green-50 to-slate-100"} flex items-center justify-center overflow-hidden cursor-pointer`}
                    onClick={() => router.push(`/shop/${s.id}`)}
                  >
                    {s.imageUrl ? (
                      <Image src={s.imageUrl} alt={s.name} fill className="object-cover" />
                    ) : (
                      <Package className="w-10 h-10 text-slate-200" />
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <p
                      className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 cursor-pointer hover:text-green-700 transition-colors"
                      onClick={() => router.push(`/shop/${s.id}`)}
                    >{s.name}</p>
                    <p className="text-[11px] text-slate-400">/ {s.unit}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-sm font-bold text-slate-900">₹{s.price}</p>
                        <p className="text-[10px] text-slate-400 line-through">₹{(s.price * 1.15).toFixed(0)}</p>
                      </div>
                      {s.stock > 0 && (
                        cartEntry ? (
                          <div className="flex items-center gap-1 border-2 border-green-600 rounded-lg overflow-hidden">
                            <button onClick={() => update(s.id, cartEntry.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 transition cursor-pointer">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-slate-900">{cartEntry.quantity}</span>
                            <button onClick={() => update(s.id, cartEntry.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 transition cursor-pointer">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => user ? add({ id: s.id, name: s.name, price: s.price, unit: s.unit }) : router.push("/auth/login")}
                            className="text-xs font-bold text-green-600 border-2 border-green-600 px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition-all cursor-pointer"
                          >ADD</button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top products in category */}
      {topInCategory.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-extrabold text-slate-900">
              Top in {topInCategory[0]?.categoryName ?? product?.categoryName}
            </h2>
            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">Best sellers</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topInCategory.map((s) => {
              const isCurrentProduct = s.id === product?.id;
              const cartEntry = items.find((i) => i.id === s.id);
              return (
                <div key={s.id}
                  className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col
                    ${isCurrentProduct ? "border-green-400 ring-2 ring-green-200" : "border-slate-100 hover:border-green-200"}`}>
                  <div
                    className={`relative h-32 bg-gradient-to-br ${CATEGORY_BG[s.categorySlug] ?? "from-green-50 to-slate-100"} flex items-center justify-center overflow-hidden cursor-pointer`}
                    onClick={() => router.push(`/shop/${s.id}`)}
                  >
                    {s.imageUrl ? (
                      <Image src={s.imageUrl} alt={s.name} fill className="object-cover" />
                    ) : (
                      <Package className="w-10 h-10 text-slate-200" />
                    )}
                    {isCurrentProduct && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">Viewing</span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <p
                      className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 cursor-pointer hover:text-green-700 transition-colors"
                      onClick={() => router.push(`/shop/${s.id}`)}
                    >{s.name}</p>
                    <p className="text-[11px] text-slate-400">/ {s.unit}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-sm font-bold text-slate-900">₹{s.price}</p>
                        <p className="text-[10px] text-slate-400 line-through">₹{(s.price * 1.15).toFixed(0)}</p>
                      </div>
                      {s.stock > 0 && (
                        cartEntry ? (
                          <div className="flex items-center gap-1 border-2 border-green-600 rounded-lg overflow-hidden">
                            <button onClick={() => update(s.id, cartEntry.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 transition cursor-pointer">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-slate-900">{cartEntry.quantity}</span>
                            <button onClick={() => update(s.id, cartEntry.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 transition cursor-pointer">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => user ? add({ id: s.id, name: s.name, price: s.price, unit: s.unit }) : router.push("/auth/login")}
                            className="text-xs font-bold text-green-600 border-2 border-green-600 px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition-all cursor-pointer"
                          >ADD</button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
