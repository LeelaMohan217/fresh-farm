"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShoppingBag, Tag, AlertCircle } from "lucide-react";

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
  const savings     = deliveryFee === 0 ? DELIVERY_FEE : 0;

  if (items.length === 0) {
    return (
      <div className="bg-[#F8FAFC] min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart className="w-9 h-9 text-green-300" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Your cart is empty</h2>
          <p className="text-sm text-slate-500">Add items from the shop to get started.</p>
          <Link href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" /> Browse Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My Cart</h1>
            <p className="text-sm text-slate-500 mt-0.5">{count} item{count !== 1 ? "s" : ""} in your cart</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        {/* Unavailable banner */}
        {hasUnavailable && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              <span className="font-semibold">Some items are currently out of stock.</span> Remove them to proceed to checkout.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Items list ── */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const unavailable = outOfStock.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border px-4 py-4 flex items-center gap-4 transition-all ${
                    unavailable ? "border-red-200 bg-red-50/40" : "border-slate-100"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl ${unavailable ? "bg-red-100" : "bg-green-50"}`}>
                    🌱
                  </div>

                  {/* Name + price */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-tight ${unavailable ? "text-red-700" : "text-slate-900"}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">₹{item.price}/{item.unit}</p>
                    {unavailable && (
                      <p className="text-[11px] font-semibold text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Currently unavailable
                      </p>
                    )}
                  </div>

                  {/* Qty stepper — disabled if unavailable */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => !unavailable && update(item.id, item.quantity - 1)}
                      disabled={unavailable}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`w-8 text-center text-sm font-bold ${unavailable ? "text-red-400" : "text-slate-900"}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => !unavailable && update(item.id, item.quantity + 1)}
                      disabled={unavailable}
                      className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white hover:bg-green-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line total */}
                  <p className={`text-sm font-extrabold w-16 text-right shrink-0 ${unavailable ? "text-red-400 line-through" : "text-slate-900"}`}>
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>

                  {/* Remove */}
                  <button onClick={() => remove(item.id)}
                    className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Free delivery progress */}
            {!hasUnavailable && deliveryFee > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-amber-700">
                    Add ₹{(FREE_DELIVERY_THRESHOLD - availableTotal).toLocaleString("en-IN")} more for free delivery
                  </p>
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
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
                <p className="text-sm font-semibold text-green-700">You get free delivery on this order!</p>
              </div>
            )}
          </div>

          {/* ── Bill summary ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Bill Summary</h3>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Items ({count})</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery fee</span>
                  {deliveryFee === 0
                    ? <span className="text-green-600 font-semibold">FREE</span>
                    : <span>₹{deliveryFee}</span>
                  }
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>You save</span>
                    <span>-₹{savings}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-100 pt-3 mt-1">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-2">
                <button
                  onClick={() => {
                    if (!user) { router.push("/auth/login"); return; }
                    router.push("/checkout");
                  }}
                  disabled={hasUnavailable}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
                {hasUnavailable && (
                  <p className="text-xs text-red-500 text-center font-medium">
                    Remove unavailable items to continue
                  </p>
                )}
                {!user && !hasUnavailable && (
                  <p className="text-xs text-slate-400 text-center">Login required to checkout</p>
                )}
              </div>
            </div>

            {/* Savings badge */}
            <div className="bg-green-600 rounded-2xl px-5 py-4 text-white text-center">
              <p className="text-xs font-semibold text-green-200 mb-0.5">100% Organic</p>
              <p className="text-sm font-bold">Zero pesticides · Daily fresh harvest</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
