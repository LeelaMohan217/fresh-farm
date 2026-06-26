"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ChevronDown, ChevronUp, Loader2, Package, User, Phone, XCircle, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type OrderItem = { name: string; qty: number; price: number; unit: string; image: string | null };
type Order = {
  id: string; status: string; payment_method: string;
  subtotal: number; delivery_fee: number; total: number;
  delivery_address: string; created_at: string;
  receiver_name: string | null; receiver_phone: string | null; receiver_email: string | null;
  items: OrderItem[];
};

const STATUS_STYLE: Record<string, string> = {
  Pending:    "bg-amber-50 text-amber-700 border-amber-200",
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
  Shipped:    "bg-purple-50 text-purple-700 border-purple-200",
  Delivered:  "bg-green-50 text-green-700 border-green-200",
  Cancelled:  "bg-red-50 text-red-600 border-red-200",
};

const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Duplicate order",
  "Delivery time too long",
  "Other",
];

const REDIRECT_DELAY = 4000;

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling]     = useState(false);
  const [cancelError, setCancelError]   = useState("");
  const [cancelledOrderId, setCancelledOrderId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);

  async function handleReorder(orderId: string) {
    setReordering(orderId);
    try {
      const res = await fetch("/api/auth/me/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) return;
      router.push("/cart");
    } finally {
      setReordering(null);
    }
  }

  useEffect(() => {
    if (!cancelledOrderId) { setProgress(0); return; }
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
  }, [cancelledOrderId, router]);

  async function handleCancel() {
    if (!cancelTarget) return;
    if (!cancelReason) { setCancelError("Please select a reason."); return; }
    setCancelling(true);
    setCancelError("");
    try {
      const res = await fetch(`/api/auth/me/orders/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) { setCancelError(data.error ?? "Failed to cancel."); return; }
      setOrders((prev) => prev.map((o) => o.id === cancelTarget.id ? { ...o, status: "Cancelled" } : o));
      const id = cancelTarget.id;
      setCancelTarget(null);
      setCancelReason("");
      setCancelledOrderId(id);
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    fetch("/api/auth/me/orders")
      .then((r) => r.json())
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.body.style.overflow = (cancelTarget || cancelledOrderId) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cancelTarget, cancelledOrderId]);

  if (loading) {
    return (
      <div className="space-y-4 pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5">
          <Skeleton className="h-4 w-24 mb-1.5" />
          <Skeleton className="h-3 w-16" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="w-4 h-4 rounded shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5">
        <h2 className="text-base font-bold text-slate-900">My Orders</h2>
        <p className="text-xs text-slate-400 mt-0.5">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No orders yet</p>
          <p className="text-xs text-slate-400 mt-1">Your order history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const isOpen = expanded === o.id;
            const statusClass = STATUS_STYLE[o.status] ?? "bg-slate-50 text-slate-600 border-slate-200";
            const date = new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

            return (
              <div key={o.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-green-200 hover:shadow-sm transition-all duration-200">
                {/* Order header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-slate-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>{o.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{date} · {o.items.length} item{o.items.length !== 1 ? "s" : ""} · ₹{Number(o.total).toLocaleString("en-IN")}</p>
                  </div>

                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    {/* Items */}
                    <div className="space-y-3">
                      {o.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0 text-lg">
                            🌱
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                            <p className="text-xs text-slate-400">Qty: {item.qty} {item.unit}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900 shrink-0">₹{(Number(item.price) * item.qty).toLocaleString("en-IN")}</p>
                        </div>
                      ))}
                    </div>

                    {/* Bill summary */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span><span>₹{Number(o.subtotal).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery fee</span>
                        <span>{Number(o.delivery_fee) === 0 ? <span className="text-green-600 font-semibold">FREE</span> : `₹${Number(o.delivery_fee).toLocaleString("en-IN")}`}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 mt-1">
                        <span>Total</span><span>₹{Number(o.total).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Delivery address + payment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-xl p-3.5">
                        <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Delivered to</p>
                        <p className="text-slate-700 leading-relaxed">{o.delivery_address || "—"}</p>
                        {o.receiver_name && (
                          <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                            <p className="font-bold text-slate-500 uppercase tracking-wider">Receiver</p>
                            <p className="text-slate-700 flex items-center gap-1"><User className="w-3 h-3" /> {o.receiver_name}</p>
                            {o.receiver_phone && <p className="text-slate-700 flex items-center gap-1"><Phone className="w-3 h-3" /> {o.receiver_phone}</p>}
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3.5">
                        <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">Payment</p>
                        <p className="text-slate-700">{o.payment_method || "—"}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                      {(o.status === "Delivered" || o.status === "Cancelled") && (
                        <button
                          onClick={() => handleReorder(o.id)}
                          disabled={reordering === o.id}
                          className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {reordering === o.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <RotateCcw className="w-3 h-3" />}
                          Reorder
                        </button>
                      )}
                      {(o.status === "Pending" || o.status === "Processing") && (
                        <button
                          onClick={() => { setCancelTarget(o); setCancelReason(""); setCancelError(""); }}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Order cancelled popup */}
      {cancelledOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
            <div className="text-6xl mb-4 select-none">😢</div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">Order Cancelled</h2>
            <p className="text-xs font-medium text-slate-400 mb-4">{cancelledOrderId}</p>
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
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Cancel order?</p>
                <p className="text-xs text-slate-400">Order {cancelTarget.id}</p>
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
                onClick={() => { setCancelTarget(null); setCancelReason(""); setCancelError(""); }}
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
