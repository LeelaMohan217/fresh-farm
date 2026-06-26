"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Plus, Minus, ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

type Product = {
  id: number; name: string; description: string;
  price: number; unit: string; stock: number;
  imageUrl: string | null; imageUrls: string[];
  categoryName: string; categorySlug: string;
  topName: string; topSlug: string;
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { user } = useAuth();
  const { items, add, update } = useCart();
  const cartItem = items.find((i) => i.id === product.id);

  const images = product.imageUrls.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);
  const [activeImg, setActiveImg] = useState(0);

  const handleAdd = () => {
    if (!user) { router.push("/auth/login"); return; }
    add({ id: product.id, name: product.name, price: product.price, unit: product.unit });
  };

  return (
    <div className="bg-[#F7F8FA] min-h-screen">

      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <p className="text-[15px] font-semibold text-slate-900 truncate flex-1">{product.name}</p>
        <Link href="/cart" className="relative">
          <ShoppingCart className="w-5 h-5 text-slate-600" />
          {cartItem && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {cartItem.quantity}
            </span>
          )}
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">

        {/* Image */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="relative h-64 sm:h-80 bg-slate-50 flex items-center justify-center">
            {images.length > 0 ? (
              <Image
                src={images[activeImg]}
                alt={product.name}
                fill
                className="object-contain p-4"
                priority
              />
            ) : (
              <Package className="w-20 h-20 text-slate-200" />
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 px-4 pb-4 mt-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    i === activeImg ? "border-green-500" : "border-slate-100"
                  }`}>
                  <Image src={src} alt="" width={56} height={56} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-3">
            <Link href="/shop" className="hover:text-green-600 transition-colors">Shop</Link>
            <span>›</span>
            <Link href={`/shop/category/${product.topSlug}`} className="hover:text-green-600 transition-colors">{product.topName}</Link>
            <span>›</span>
            <span className="text-slate-600">{product.categoryName}</span>
          </div>

          <h1 className="text-[18px] font-bold text-slate-900 leading-snug">{product.name}</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">{product.unit}</p>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-[22px] font-bold text-slate-900">₹{product.price}</span>
            <span className="text-[13px] text-slate-400">/{product.unit}</span>
          </div>

          {product.stock === 0 && (
            <p className="text-[13px] font-semibold text-red-500 mt-2">Currently out of stock</p>
          )}

          {product.description && (
            <p className="text-[13px] text-slate-500 leading-relaxed mt-4 border-t border-slate-100 pt-4">
              {product.description}
            </p>
          )}
        </div>

        {/* Add to cart */}
        {product.stock > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
            {cartItem ? (
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-slate-700">In your cart</p>
                <div className="flex items-center border-2 border-green-600 rounded-xl overflow-hidden">
                  <button onClick={() => update(product.id, cartItem.quantity - 1)}
                    className="w-10 h-10 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-[15px] font-bold text-slate-900">{cartItem.quantity}</span>
                  <button onClick={() => update(product.id, cartItem.quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleAdd}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-[15px] font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add to cart
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
