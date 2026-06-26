"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShoppingBag, Tag, AlertCircle, Clock } from "lucide-react";

const DELIVERY_FEE = 49;
const FREE_DELIVERY_THRESHOLD = 500;

export default function CartPage() {
  const { items, update, remove, total, count } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [outOfStock, setOutOfStock] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user || items.length === 0) { setOutOfStock(new Set()); return; }
    fetch("/api/cart/validate")
      .then((r) => r.json())
      .then((data: { id: number; outOfStock: boolean }[]) => {
        setOutOfStock(new Set(data.filter((d) => d.outOfStock).map((d) => d.id)));
      })
      .catch(() => {});
  }, [user, items]);

  const hasUnavailable = outOfStock.size > 0;

  const availableTotal = items
    .filter((i) => !outOfStock.has(i.id))
    .reduce((s, i) => s + i.price * i.quantity, 0);

  const deliveryFee = availableTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal  = availableTotal + deliveryFee;
  const toFreeDelivery = FREE_DELIVERY_THRESHOLD - availableTotal;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart className="w-9 h-9 text-green-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
          <p className="text-sm text-slate-500">Add items from the shop to get started.</p>
          <Link href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> Browse Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F8FA] min-h-screen">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* Page title — mobile only (desktop shows in sidebar) */}
        <h1 className="text-[18px] font-bold text-slate-900 mb-4 sm:mb-6 lg:hidden">My Cart</h1>

        {/* Unavailable banner */}
        {hasUnavailable && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-700 font-medium">
              Some items are out of stock. Remove them to proceed.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

          {/* ── Left: items ── */}
          <div className="space-y-3">

            {/* Delivery estimate strip */}
            <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Delivery in 30–45 minutes</p>
                <p className="text-[12px] text-slate-400">Shipment of {count} item{count !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Item cards */}
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
              {items.map((item) => {
                const unavailable = outOfStock.has(item.id);
                return (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3.5 ${unavailable ? "opacity-50" : ""}`}>

                    {/* Product image */}
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🌱</div>
                      )}
                    </div>

                    {/* Name + price */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900 leading-tight truncate">{item.name}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">{item.unit}</p>
                      <p className="text-[13px] font-bold text-slate-800 mt-1">₹{item.price}</p>
                      {unavailable && (
                        <p className="text-[11px] font-semibold text-red-500 mt-0.5">Currently unavailable</p>
                      )}
                    </div>

                    {/* Qty stepper — Blinkit style: – qty + */}
                    <div className="flex items-center gap-0 shrink-0">
                      <button
                        onClick={() => update(item.id, item.quantity - 1)}
                        disabled={unavailable}
                        className="w-8 h-8 rounded-l-lg border border-green-600 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors disabled:opacity-30"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      </button>
                      <div className="w-9 h-8 border-t border-b border-green-600 flex items-center justify-center">
                        <span className="text-[13px] font-bold text-green-700">{item.quantity}</span>
                      </div>
                      <button
                        onClick={() => update(item.id, item.quantity + 1)}
                        disabled={unavailable}
                        className="w-8 h-8 rounded-r-lg bg-green-600 flex items-center justify-center text-white hover:bg-green-700 transition-colors disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line total */}
                    <p className="text-[14px] font-bold text-slate-900 w-14 text-right shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Free delivery progress */}
            {!hasUnavailable && deliveryFee > 0 && (
              <div className="bg-[#FFF8E7] border border-amber-100 rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-semibold text-amber-800">
                    Add ₹{toFreeDelivery.toLocaleString("en-IN")} more for free delivery
                  </p>
                  <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                </div>
                <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((availableTotal / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {!hasUnavailable && deliveryFee === 0 && (
              <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-[13px] font-semibold text-green-700">You get free delivery on this order!</p>
              </div>
            )}
          </div>

          {/* ── Right: Bill details ── */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100">
              <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                <h2 className="text-[14px] font-semibold text-slate-900">Bill details</h2>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between text-[13px] text-slate-600">
                  <span>Items total</span>
                  <span className="font-semibold text-slate-800">₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[13px] text-slate-600">
                  <span>Delivery charge</span>
                  {deliveryFee === 0
                    ? <span className="font-semibold text-green-600">FREE</span>
                    : <span className="font-semibold text-slate-800">₹{deliveryFee}</span>
                  }
                </div>
                <div className="flex justify-between text-[14px] font-bold text-slate-900 border-t border-dashed border-slate-200 pt-3 mt-1">
                  <span>Grand total</span>
                  <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={() => {
                    if (!user) { router.push("/auth/login"); return; }
                    router.push("/checkout");
                  }}
                  disabled={hasUnavailable}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-[13px]">
                    ₹{grandTotal.toLocaleString("en-IN")}<br />
                    <span className="text-[10px] font-medium text-green-200">TOTAL</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[14px]">
                    Proceed <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
                {hasUnavailable && (
                  <p className="text-[12px] text-red-500 text-center font-medium mt-2">
                    Remove unavailable items to continue
                  </p>
                )}
                {!user && !hasUnavailable && (
                  <p className="text-[12px] text-slate-400 text-center mt-2">Sign in required to checkout</p>
                )}
              </div>
            </div>

            {/* organic badge */}
            <div className="bg-green-600 rounded-2xl px-5 py-4 text-white text-center">
              <p className="text-[11px] font-semibold text-green-200 mb-0.5">100% Organic</p>
              <p className="text-[13px] font-bold">Zero pesticides · Daily fresh harvest</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
