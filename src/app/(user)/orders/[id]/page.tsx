"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle, Package, MapPin, CreditCard, Clock, ChevronLeft, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type OrderItem = { name: string; qty: number; price: number; unit: string; image: string | null };
type Order = {
  id: string;
  status: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: string;
  pincode: string | null;
  created_at: string;
  receiver_name: string | null;
  receiver_phone: string | null;
  receiver_email: string | null;
  items: OrderItem[];
};

const STATUS_STYLE: Record<string, string> = {
  Pending:    "bg-amber-50 text-amber-700 border-amber-200",
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
  Shipped:    "bg-purple-50 text-purple-700 border-purple-200",
  Delivered:  "bg-green-50 text-green-700 border-green-200",
  Cancelled:  "bg-red-50 text-red-600 border-red-200",
};

const STATUS_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get("unserviced") !== null || searchParams.has("unserviced");
  const unserviced = searchParams.get("unserviced") === "1";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [showCancelledPopup, setShowCancelledPopup] = useState(false);
  const [reordering, setReordering] = useState(false);

  async function handleReorder() {
    if (!order) return;
    setReordering(true);
    try {
      const res = await fetch("/api/auth/me/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (!res.ok) return;
      router.push("/cart");
    } finally {
      setReordering(false);
    }
  }
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const REDIRECT_DELAY = 4000;

  useEffect(() => {
    if (!showCancelledPopup) { setProgress(0); return; }
    setProgress(0);
    const step = 100 / (REDIRECT_DELAY / 50);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + step;
        if (next >= 100) {
          clearInterval(timerRef.current!);
          return 100;
        }
        return next;
      });
    }, 50);
    const redirectTimer = setTimeout(() => router.push("/account/orders"), REDIRECT_DELAY);
    return () => { clearInterval(timerRef.current!); clearTimeout(redirectTimer); };
    return () => clearInterval(timerRef.current!);
  }, [showCancelledPopup, router]);

  const CANCEL_REASONS = [
    "Changed my mind",
    "Ordered by mistake",
    "Duplicate order",
    "Delivery time too long",
    "Other",
  ];

  async function handleCancel() {
    if (!cancelReason) { setCancelError("Please select a reason."); return; }
    setCancelling(true);
    setCancelError("");
    try {
      const res = await fetch(`/api/auth/me/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) { setCancelError(data.error ?? "Failed to cancel."); return; }
      setOrder((prev) => prev ? { ...prev, status: "Cancelled" } : prev);
      setShowCancel(false);
      setCancelReason("");
      setShowCancelledPopup(true);
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    fetch(`/api/auth/me/orders/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setOrder(data); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    document.body.style.overflow = (showCancel || showCancelledPopup) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showCancel, showCancelledPopup]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 pointer-events-none select-none">
        <Skeleton className="h-4 w-24 mb-6" />
        {/* Order ID card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        {/* Progress tracker */}
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-6 mb-4">
          <div className="flex items-center gap-2">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                {i < 3 && <Skeleton className="flex-1 h-0.5" />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-3 w-14" />)}
          </div>
        </div>
        {/* Items */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 space-y-4">
          <Skeleton className="h-4 w-24" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-14 shrink-0" />
            </div>
          ))}
        </div>
        {/* Delivery + Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <Package className="w-12 h-12 text-slate-300" />
        <p className="text-lg font-medium">Order not found</p>
        <button onClick={() => router.push("/account/orders")} className="text-green-600 underline text-sm">View all orders</button>
      </div>
    );
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "Cancelled";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Back */}
      <button onClick={() => router.push("/account/orders")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-600 mb-6 transition-colors cursor-pointer">
        <ChevronLeft className="w-4 h-4" /> Back to orders
      </button>

      {/* Success banner — shown right after placing */}
      {isNew && !unserviced && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Order placed successfully!</p>
            <p className="text-sm text-green-700 mt-0.5">We'll start preparing your items shortly.</p>
          </div>
        </div>
      )}

      {/* Unserviced warning */}
      {unserviced && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Order placed — delivery not yet confirmed</p>
            <p className="text-sm text-amber-700 mt-0.5">Your pincode isn't assigned to a branch yet. Our team will reach out to confirm delivery.</p>
          </div>
        </div>
      )}

      {/* Order ID + status */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Order</p>
          <p className="font-bold text-slate-900 text-lg">{order.id}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_STYLE[order.status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
          {order.status}
        </span>
      </div>

      {/* Progress tracker */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-6 mb-4">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                {/* Step */}
                <div className="flex flex-col items-center gap-2 z-10">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                    ${i < stepIndex  ? "bg-green-600 border-green-600 text-white"
                    : i === stepIndex ? "bg-green-600 border-green-600 text-white ring-4 ring-green-100"
                    :                   "bg-white border-slate-200 text-slate-400"}`}>
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span className={`text-[11px] font-medium whitespace-nowrap ${i <= stepIndex ? "text-green-700" : "text-slate-400"}`}>
                    {step}
                  </span>
                </div>
                {/* Connector */}
                {i < STATUS_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-5 bg-slate-100 relative">
                    <div className={`absolute inset-y-0 left-0 bg-green-500 transition-all ${i < stepIndex ? "w-full" : "w-0"}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-green-600" /> Items ({order.items.length})
        </h2>
        <div className="divide-y divide-slate-50">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <Package className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{item.name}</p>
                <p className="text-xs text-slate-400">{item.qty} {item.unit} × ₹{Number(item.price).toFixed(2)}</p>
              </div>
              <p className="font-semibold text-slate-800 text-sm">₹{(item.qty * Number(item.price)).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery + Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-green-600" /> Delivery address
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{order.delivery_address}</p>
          {order.pincode && <p className="text-xs text-slate-400 mt-1">Pincode: {order.pincode}</p>}
          {order.receiver_name && (
            <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-500 space-y-0.5">
              <p>{order.receiver_name}</p>
              {order.receiver_phone && <p>{order.receiver_phone}</p>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-green-600" /> Payment
          </h2>
          <p className="text-sm text-slate-600 capitalize">{order.payment_method}</p>
          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery</span>
              <span>{Number(order.delivery_fee) === 0 ? <span className="text-green-600">Free</span> : `₹${Number(order.delivery_fee).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 pt-1.5 border-t border-slate-100">
              <span>Total</span><span>₹{Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button onClick={() => router.push("/shop")}
          className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors cursor-pointer">
          Continue shopping
        </button>
        {(order.status === "Pending" || order.status === "Processing") && (
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-green-600 text-sm font-semibold rounded-xl border border-green-200 hover:bg-green-50 transition-colors cursor-pointer disabled:opacity-60"
          >
            {reordering ? <RotateCcw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Reorder
          </button>
        )}
        {(order.status === "Pending" || order.status === "Processing") && (
          <button onClick={() => setShowCancel(true)}
            className="px-6 py-2.5 bg-white text-red-600 text-sm font-semibold rounded-xl border border-red-200 hover:bg-red-50 transition-colors cursor-pointer">
            Cancel order
          </button>
        )}
      </div>

      {/* Order cancelled popup */}
      {showCancelledPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
            <div className="text-6xl mb-4 select-none">😢</div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">Order Cancelled</h2>
            <p className="text-xs font-medium text-slate-400 mb-4">{order?.id}</p>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              We're sorry to see your order go. Your cancellation has been confirmed and no charges will be applied.
              We hope to serve you better next time! 🌱
            </p>
            <button
              onClick={() => { clearInterval(timerRef.current!); router.push("/account/orders"); }}
              className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-colors cursor-pointer mb-4"
            >
              Go to Orders
            </button>
            <div className="w-full space-y-1.5">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Redirecting to orders in {Math.ceil((REDIRECT_DELAY / 1000) * (1 - progress / 100))}s…
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Cancel order?</p>
                <p className="text-xs text-slate-400">Order {order.id}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">Please select a reason for cancellation:</p>

            <div className="space-y-2 mb-4">
              {CANCEL_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50/40 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={() => { setCancelReason(r); setCancelError(""); }}
                    className="accent-red-500"
                  />
                  <span className="text-sm text-slate-700">{r}</span>
                </label>
              ))}
            </div>

            {cancelError && <p className="text-xs text-red-500 mb-3">{cancelError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancel(false); setCancelReason(""); setCancelError(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Keep order
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-60"
              >
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
