"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Phone, MapPin,
  Package, Calendar, Truck, CheckCircle2, Clock, XCircle,
  Printer, MoreHorizontal,
} from "lucide-react";

const STATUS_STEPS = ["Pending", "Confirmed", "Processing"] as const;
type BulkOrderStatus = (typeof STATUS_STEPS)[number] | "Cancelled";

const NEXT_STATUS: Record<string, BulkOrderStatus> = {
  Pending:   "Confirmed",
  Confirmed: "Processing",
};

const NEXT_LABEL: Record<string, string> = {
  Pending:   "Confirm Order",
  Confirmed: "Start Processing",
};

const STATUS_STYLE: Record<string, string> = {
  Confirmed:  "bg-green-50 text-green-700 ring-1 ring-green-200/60",
  Processing: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  Pending:    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  Cancelled:  "bg-red-50 text-red-600 ring-1 ring-red-200/60",
};

const EVENT_COLORS: Record<string, string> = {
  Wedding:   "bg-pink-50 text-pink-700",
  Birthday:  "bg-purple-50 text-purple-700",
  Corporate: "bg-sky-50 text-sky-700",
  Festival:  "bg-orange-50 text-orange-700",
  Other:     "bg-slate-100 text-slate-600",
};

type BulkOrderDetail = {
  id: string;
  eventType: string;
  status: string;
  bookingDate: string;
  deliveryDate: string;
  customer: { name: string; email: string; phone: string; address: string };
  items: { name: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }[];
  total: number;
};

function StatusIcon({ status }: { status: string }) {
  if (status === "Confirmed" || status === "Delivered") return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (status === "Cancelled") return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
}

function formatQty(qty: number) {
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(1);
}

export default function BulkOrderDetailClient({ order }: { order: BulkOrderDetail }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(order.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentStep = status === "Cancelled"
    ? -1
    : STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);

  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.Pending;
  const eventStyle  = EVENT_COLORS[order.eventType] ?? EVENT_COLORS.Other;

  async function updateStatus(newStatus: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/bulk-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update status.");
        return;
      }
      setStatus(newStatus);
      router.refresh();
    } catch {
      setError("Failed to update status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">

      {/* ── Header (static) ── */}
      <div className="shrink-0 flex items-start justify-between py-1 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{order.id}</h1>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${statusStyle}`}>
                <StatusIcon status={status} />
                {status}
              </span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${eventStyle}`}>
                {order.eventType}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">{order.bookingDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Invoice
          </button>
          <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-6 pb-2">

      {/* ── Status timeline ── */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Order Progress</p>
        {status === "Cancelled" ? (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="w-4 h-4 shrink-0" />
            This bulk order has been cancelled.
          </div>
        ) : (
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                      ${done ? "bg-green-500 border-green-500 text-white" : "bg-white border-slate-200 text-slate-400"}
                      ${isCurrent ? "ring-4 ring-green-100" : ""}
                    `}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-[11px] font-medium ${done ? "text-slate-700" : "text-slate-400"}`}>
                      {step}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full ${i < currentStep ? "bg-green-400" : "bg-slate-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Grid: Customer + Event Info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Customer */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Customer</p>
          <div className="space-y-3">
            {[
              { icon: User,   label: "Name",    value: order.customer.name },
              { icon: Mail,   label: "Email",   value: order.customer.email },
              { icon: Phone,  label: "Phone",   value: order.customer.phone },
              { icon: MapPin, label: "Address", value: order.customer.address },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                  <p className="text-sm text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event & Delivery */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Event & Delivery</p>
          <div className="space-y-3">
            {[
              { icon: Package,  label: "Event Type",   value: order.eventType },
              { icon: Calendar, label: "Booking Date", value: order.bookingDate },
              { icon: Truck,    label: "Delivery Date", value: order.deliveryDate },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                  <p className="text-sm text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-5 pt-4 border-t border-slate-50 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Items</span>
              <span className="text-slate-700">{order.items.length} line items</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-100">
              <span>Total</span>
              <span>₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Items table ── */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <p className="text-sm font-semibold text-slate-900">Order Items</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Item</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Quantity</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 tracking-wide">Price</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {order.items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                <td className="px-5 py-3.5 font-medium text-slate-800">{item.name}</td>
                <td className="px-5 py-3.5 text-slate-500">{formatQty(item.quantity)} {item.unit}</td>
                <td className="px-5 py-3.5 text-right text-slate-600">₹{item.unitPrice.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-slate-800">₹{item.totalPrice.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
        {status !== "Processing" && status !== "Cancelled" && (
          <>
            {NEXT_STATUS[status] && (
              <button
                onClick={() => updateStatus(NEXT_STATUS[status])}
                disabled={loading}
                className="h-9 px-4 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Updating…" : NEXT_LABEL[status]}
              </button>
            )}
            <button
              onClick={() => updateStatus("Cancelled")}
              disabled={loading}
              className="h-9 px-4 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Cancel Order
            </button>
          </>
        )}
      </div>

      </div>{/* end scrollable */}
    </div>
  );
}
