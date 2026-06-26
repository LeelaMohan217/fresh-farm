"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Phone, MapPin,
  Package, CreditCard, Truck, CheckCircle2, Clock, XCircle,
  Printer, MoreHorizontal, UserCheck, ShoppingCart,
  Copy, Ban, Trash2,
} from "lucide-react";

const STATUS_STEPS = ["Pending", "Processing", "Shipped", "Delivered"] as const;
type OrderStatus = (typeof STATUS_STEPS)[number] | "Cancelled";

const NEXT_STATUS: Record<string, OrderStatus> = {
  Pending:    "Processing",
  Processing: "Shipped",
  Shipped:    "Delivered",
};

const NEXT_LABEL: Record<string, string> = {
  Pending:    "Mark as Processing",
  Processing: "Mark as Shipped",
  Shipped:    "Mark as Delivered",
};

type OrderDetail = {
  id: string;
  date: string;
  status: string;
  payment: string;
  customer: { name: string; email: string; phone: string };
  receiver: { name: string; phone: string | null; email: string | null } | null;
  deliveryAddress: string | null;
  pincode: string | null;
  items: { name: string; qty: number; unit: string; price: number }[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
};

function StatusIcon({ status }: { status: string }) {
  if (status === "Delivered") return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (status === "Cancelled") return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === "Processing") return <Clock className="w-4 h-4 text-blue-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div>
        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
        <p className="text-sm text-slate-800">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function OrderDetailClient({ order, role }: { order: OrderDetail; role: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(order.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function printInvoice() {
    window.print();
  }

  async function copyOrderId() {
    await navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function deleteOrder() {
    if (!confirm(`Permanently delete order ${order.id}? This cannot be undone.`)) return;
    setDeleting(true);
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/admin/orders?id=${order.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete order.");
        return;
      }
      router.push("/admin/orders");
    } catch {
      setError("Failed to delete order.");
    } finally {
      setDeleting(false);
    }
  }

  const currentStep = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
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

      {/* Header */}
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
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{order.id}</h1>
                <button onClick={copyOrderId} className="relative text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" title="Copy order ID">
                  {copied && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap">
                      Copied
                    </span>
                  )}
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200/60">
                <StatusIcon status={status} />
                {status}
              </span>
              {order.receiver && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-200/60">
                  <UserCheck className="w-3 h-3" /> Third-party delivery
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-0.5">{order.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={printInvoice}
            className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer print:hidden"
          >
            <Printer className="w-3.5 h-3.5" /> Invoice
          </button>
          <div className="relative print:hidden" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 w-48 bg-white rounded-xl border border-slate-100 shadow-lg z-50 overflow-hidden py-1">
                {role === "superadmin" && status !== "Delivered" && status !== "Cancelled" && (
                  <>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => { updateStatus("Cancelled"); setMenuOpen(false); }}
                      disabled={loading}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" /> Cancel Order
                    </button>
                  </>
                )}
                <div className="my-1 border-t border-slate-100" />
                {role === "superadmin" ? (
                  <button
                    onClick={deleteOrder}
                    disabled={deleting}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> {deleting ? "Deleting…" : "Delete Order"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 cursor-not-allowed select-none" title="Only super admins can delete orders">
                    <Trash2 className="w-4 h-4" /> Delete Order
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-4 pb-2">

        {/* Status timeline */}
        <div className="bg-white rounded-xl border border-slate-100 px-5 py-4">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all
                      ${done ? "bg-green-500 border-green-500 text-white" : "bg-white border-slate-200 text-slate-400"}
                      ${isCurrent ? "ring-4 ring-green-100" : ""}
                    `}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-[10px] font-medium ${done ? "text-slate-700" : "text-slate-400"}`}>{step}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full ${i < currentStep ? "bg-green-400" : "bg-slate-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Holder + Delivery Recipient */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Account Holder */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Account Holder</p>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Who placed the order</span>
            </div>
            <div className="space-y-3">
              <InfoRow icon={User}  label="Full Name"     value={order.customer.name} />
              <InfoRow icon={Mail}  label="Email Address" value={order.customer.email} />
              <InfoRow icon={Phone} label="Phone Number"  value={order.customer.phone} />
            </div>
          </div>

          {/* Delivery Recipient */}
          <div className={`bg-white rounded-xl border p-5 ${order.receiver ? "border-purple-200 bg-purple-50/30" : "border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Delivery Recipient</p>
              {order.receiver ? (
                <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Different person</span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Same as account holder</span>
              )}
            </div>
            <div className="space-y-3">
              {order.receiver ? (
                <>
                  <InfoRow icon={UserCheck} label="Recipient Name"  value={order.receiver.name} />
                  {order.receiver.email && <InfoRow icon={Mail}  label="Email Address" value={order.receiver.email} />}
                  {order.receiver.phone && <InfoRow icon={Phone} label="Phone Number"  value={order.receiver.phone} />}
                </>
              ) : (
                <>
                  <InfoRow icon={User}  label="Name"  value={order.customer.name} />
                  <InfoRow icon={Phone} label="Phone" value={order.customer.phone} />
                </>
              )}
              <InfoRow
                icon={MapPin}
                label="Delivery Address"
                value={[order.deliveryAddress, order.pincode ? `Pincode: ${order.pincode}` : ""].filter(Boolean).join(" — ") || "Not provided"}
              />
            </div>
          </div>
        </div>

        {/* Payment & Delivery */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Payment &amp; Delivery</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <div className="space-y-3">
              <InfoRow icon={CreditCard} label="Payment Method" value={order.payment} />
              <InfoRow icon={Truck}      label="Delivery Fee"   value={order.delivery > 0 ? `₹${order.delivery}` : "Free"} />
              <InfoRow icon={Package}    label="Items"          value={`${order.items.length} item${order.items.length !== 1 ? "s" : ""}`} />
            </div>
            <div className="sm:border-l sm:border-slate-100 sm:pl-8">
              <p className="text-[11px] text-slate-400 font-medium mb-3">Bill Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Delivery</span>
                  <span>{order.delivery > 0 ? `₹${order.delivery}` : "Free"}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Order Items</p>
          </div>

          {order.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                <ShoppingCart className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No items in this order</p>
              <p className="text-xs text-slate-400 mt-0.5">This order was placed without any products.</p>
            </div>
          ) : (
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
                    <td className="px-5 py-3.5 text-slate-500">{item.qty} {item.unit}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600">₹{item.price}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800">₹{(item.qty * item.price).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap pb-1 print:hidden">
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
          {status !== "Delivered" && status !== "Cancelled" && NEXT_STATUS[status] && (
            <button
              onClick={() => updateStatus(NEXT_STATUS[status])}
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating…" : NEXT_LABEL[status]}
            </button>
          )}
        </div>

      </div>

      {/* ── Print-only invoice ── */}
      <div data-invoice className="hidden print:block fixed inset-0 bg-white p-10 text-slate-900 z-[9999]" style={{ fontFamily: "sans-serif" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, background: "#16a34a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontSize: 18, fontWeight: 700 }}>F</span>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>FarmFresh</p>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Organic & Hydroponic</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>admin@farmfresh.in · www.farmfresh.in</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>INVOICE</p>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{order.id}</p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{order.date}</p>
            <span style={{ display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: status === "Delivered" ? "#dcfce7" : status === "Cancelled" ? "#fee2e2" : "#dbeafe", color: status === "Delivered" ? "#16a34a" : status === "Cancelled" ? "#dc2626" : "#2563eb" }}>
              {status}
            </span>
          </div>
        </div>

        <hr style={{ borderColor: "#e2e8f0", marginBottom: 24 }} />

        {/* Billing / Shipping */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Billed To</p>
            <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 3px" }}>{order.customer.name}</p>
            <p style={{ fontSize: 12, color: "#475569", margin: "0 0 2px" }}>{order.customer.email}</p>
            <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>{order.customer.phone}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Deliver To</p>
            <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 3px" }}>{order.receiver?.name ?? order.customer.name}</p>
            {order.receiver?.phone && <p style={{ fontSize: 12, color: "#475569", margin: "0 0 2px" }}>{order.receiver.phone}</p>}
            <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>{[order.deliveryAddress, order.pincode ? `PIN: ${order.pincode}` : ""].filter(Boolean).join(", ") || "—"}</p>
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Item</th>
              <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Qty</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Unit Price</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 600, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "9px 12px", fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: "9px 12px", textAlign: "center", color: "#64748b" }}>{item.qty} {item.unit}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", color: "#64748b" }}>₹{item.price.toLocaleString("en-IN")}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>₹{(item.qty * item.price).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 240 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 6 }}>
              <span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 6 }}>
              <span>Delivery</span><span>{order.delivery > 0 ? `₹${order.delivery}` : "Free"}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16a34a", marginBottom: 6 }}>
                <span>Discount</span><span>-₹{order.discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, borderTop: "2px solid #e2e8f0", paddingTop: 10, marginTop: 4 }}>
              <span>Total</span><span>₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 16, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8" }}>
          <span>Payment: {order.payment}</span>
          <span>Thank you for shopping with FarmFresh!</span>
          <span>Generated {new Date().toLocaleDateString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}
