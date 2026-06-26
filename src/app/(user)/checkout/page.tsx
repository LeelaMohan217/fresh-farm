"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin, ShoppingBag, Loader2, ChevronRight,
  Plus, Trash2, CheckCircle2, Leaf, Home, Briefcase, MoreHorizontal, Pencil, User, Phone, Mail, PackageCheck, XCircle, AlertTriangle,
} from "lucide-react";

type SavedAddress = {
  id: string;
  type: string;
  address: string;
  pincode: string;
  is_default: boolean;
  receiver_name: string | null;
  receiver_phone: string | null;
  receiver_email: string | null;
};

type PaymentMethod = "COD" | "UPI" | "Card";

const DELIVERY_FEE = 40;
const FREE_DELIVERY_ABOVE = 500;

const TYPE_ICON: Record<string, React.ReactNode> = {
  Home:   <Home className="w-3.5 h-3.5" />,
  Work:   <Briefcase className="w-3.5 h-3.5" />,
  Others: <MoreHorizontal className="w-3.5 h-3.5" />,
};

const emptyForm = { type: "Home", address: "", pincode: "", receiver_name: "", receiver_phone: "", receiver_email: "" };
type EditingAddress = { id: string } & typeof emptyForm;

function ReceiverFields({
  name, phone, email,
  onChange,
  errors,
}: {
  name: string; phone: string; email: string;
  onChange: (field: "receiver_name" | "receiver_phone" | "receiver_email", val: string) => void;
  errors?: { receiver_phone?: string };
}) {
  return (
    <div className="space-y-3 pt-3 border-t border-slate-100 mt-1">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Receiver (optional — if ordering for someone else)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><User className="w-3 h-3" /> Name</label>
          <input value={name} onChange={(e) => onChange("receiver_name", e.target.value)} placeholder="Receiver's name"
            className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 text-slate-800 placeholder:text-slate-400 transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
          <input value={phone} onChange={(e) => onChange("receiver_phone", e.target.value)} placeholder="10-digit mobile" inputMode="numeric" maxLength={10}
            className={`w-full h-10 px-3.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-slate-800 placeholder:text-slate-400 ${errors?.receiver_phone ? "border-red-400 focus:ring-red-500/20" : "border-slate-200 focus:ring-green-500/20 focus:border-green-400"}`} />
          {errors?.receiver_phone && <p className="text-[11px] text-red-500">{errors.receiver_phone}</p>}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3" /> Email <span className="text-slate-400 font-normal">(optional)</span></label>
        <input value={email} onChange={(e) => onChange("receiver_email", e.target.value)} placeholder="receiver@email.com" type="email"
          className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 text-slate-800 placeholder:text-slate-400 transition-all" />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, total, clear } = useCart();

  const [addresses, setAddresses]         = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showForm, setShowForm]           = useState(false);

  const [form, setForm]       = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<{ address?: string; pincode?: string; receiver_phone?: string }>({});
  const [saving, setSaving]   = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<EditingAddress | null>(null);

  // Receiver details for this order (separate from address-stored values)
  const [receiver, setReceiver] = useState({ name: "", phone: "", email: "" });
  const [receiverErrors, setReceiverErrors] = useState<{ phone?: string }>({});

  const [payment, setPayment]   = useState<PaymentMethod>("COD");
  const [placing, setPlacing]   = useState(false);
  const [orderError, setOrderError] = useState("");
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const [serviceability, setServiceability] = useState<"checking" | "serviced" | "unserviced" | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && items.length === 0 && !successOrderId) router.replace("/shop");
  }, [authLoading, items, router, successOrderId]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/auth/me/addresses")
      .then((r) => r.json())
      .then((data: SavedAddress[]) => {
        setAddresses(data);
        const def = data.find((a) => a.is_default);
        const first = def ?? data[0] ?? null;
        if (first) {
          setSelectedId(first.id);
          setReceiver({
            name: first.receiver_name ?? "",
            phone: first.receiver_phone ?? "",
            email: first.receiver_email ?? "",
          });
          checkServiceability(first.pincode);
        } else {
          setShowForm(true);
        }
      })
      .catch(() => setShowForm(true))
      .finally(() => setLoadingAddresses(false));
  }, [user]);

  async function checkServiceability(pincode: string) {
    setServiceability("checking");
    try {
      const res = await fetch(`/api/serviceability?pincode=${pincode}`);
      const data = await res.json();
      setServiceability(data.serviced ? "serviced" : "unserviced");
    } catch {
      setServiceability(null);
    }
  }

  // When selected address changes, pre-fill receiver from that address
  function selectAddress(id: string) {
    setSelectedId(id);
    const addr = addresses.find((a) => a.id === id);
    if (addr) {
      setReceiver({
        name: addr.receiver_name ?? "",
        phone: addr.receiver_phone ?? "",
        email: addr.receiver_email ?? "",
      });
      checkServiceability(addr.pincode);
    }
  }

  function validateForm() {
    const errs: typeof formErrors = {};
    if (!form.address.trim()) errs.address = "Delivery address is required.";
    if (!form.pincode.trim()) errs.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(form.pincode)) errs.pincode = "Enter a valid 6-digit pincode.";
    if (form.receiver_phone && !/^\d{10}$/.test(form.receiver_phone)) errs.receiver_phone = "Enter a valid 10-digit phone.";
    return errs;
  }

  async function saveAddress() {
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type, address: form.address, pincode: form.pincode,
          isDefault: addresses.length === 0,
          receiver_name: form.receiver_name || null,
          receiver_phone: form.receiver_phone || null,
          receiver_email: form.receiver_email || null,
        }),
      });
      if (!res.ok) { setFormErrors({ address: "Failed to save address." }); return; }
      const newAddr: SavedAddress = await res.json();
      setAddresses((prev) => {
        const updated = newAddr.is_default ? prev.map((a) => ({ ...a, is_default: false })) : prev;
        return [newAddr, ...updated];
      });
      setSelectedId(newAddr.id);
      setReceiver({
        name: newAddr.receiver_name ?? "",
        phone: newAddr.receiver_phone ?? "",
        email: newAddr.receiver_email ?? "",
      });
      setShowForm(false);
      setForm(emptyForm);
    } catch {
      setFormErrors({ address: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/auth/me/addresses/${id}`, { method: "DELETE" });
      setAddresses((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        if (selectedId === id) {
          const next = updated.find((a) => a.is_default) ?? updated[0] ?? null;
          if (next) { setSelectedId(next.id); setReceiver({ name: next.receiver_name ?? "", phone: next.receiver_phone ?? "", email: next.receiver_email ?? "" }); }
          else setSelectedId(null);
        }
        return updated;
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function updateAddress() {
    if (!editingAddress) return;
    const errs: typeof formErrors = {};
    if (!editingAddress.address.trim()) errs.address = "Delivery address is required.";
    if (!/^\d{6}$/.test(editingAddress.pincode)) errs.pincode = "Enter a valid 6-digit pincode.";
    if (editingAddress.receiver_phone && !/^\d{10}$/.test(editingAddress.receiver_phone)) errs.receiver_phone = "Enter a valid 10-digit phone.";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/auth/me/addresses/${editingAddress.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editingAddress.type, address: editingAddress.address, pincode: editingAddress.pincode,
          receiver_name: editingAddress.receiver_name || null,
          receiver_phone: editingAddress.receiver_phone || null,
          receiver_email: editingAddress.receiver_email || null,
        }),
      });
      if (!res.ok) { setFormErrors({ address: "Failed to update address." }); return; }
      const updated: SavedAddress = await res.json();
      setAddresses((prev) => prev.map((a) => a.id === updated.id ? updated : a));
      if (selectedId === updated.id) {
        setReceiver({ name: updated.receiver_name ?? "", phone: updated.receiver_phone ?? "", email: updated.receiver_email ?? "" });
      }
      setEditingAddress(null);
      setFormErrors({});
    } catch {
      setFormErrors({ address: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(id: string) {
    await fetch(`/api/auth/me/addresses/${id}`, { method: "PATCH" });
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  }

  function validateReceiver() {
    const errs: { phone?: string } = {};
    if (receiver.phone && !/^\d{10}$/.test(receiver.phone)) errs.phone = "Enter a valid 10-digit phone.";
    return errs;
  }

  async function placeOrder() {
    if (!selectedId) return;
    const recErrs = validateReceiver();
    if (Object.keys(recErrs).length) { setReceiverErrors(recErrs); return; }
    setOrderError("");
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity, unitPrice: i.price })),
          paymentMethod: payment,
          addressId: selectedId,
          receiverName: receiver.name || null,
          receiverPhone: receiver.phone || null,
          receiverEmail: receiver.email || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setOrderError(data.error ?? "Failed to place order."); return; }
      await clear();
      setSuccessOrderId(data.orderId);
      const destination = `/orders/${data.orderId}${!data.branchAssigned ? "?unserviced=1" : ""}`;
      setTimeout(() => router.push(destination), 2500);
    } catch {
      setOrderError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  const deliveryFee = total >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const grandTotal  = total + deliveryFee;
  const canPlace    = !!selectedId && !showForm && serviceability === "serviced";

  if (authLoading || loadingAddresses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Order success popup */}
      {successOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center text-center max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">

            {/* Animated checkmark */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
                <svg viewBox="0 0 52 52" className="w-12 h-12">
                  <circle cx="26" cy="26" r="25" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                  <path fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    d="M14 27 l8 8 l16 -16"
                    className="animate-[dash_0.5s_ease-in-out_0.2s_forwards]"
                    style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: "dash 0.5s ease-in-out 0.2s forwards" }}
                  />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Order Placed!</h2>
            <p className="text-sm text-slate-500 mb-5">Your order has been confirmed successfully.</p>

            <div className="w-full bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mb-6">
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-medium mb-0.5">Order ID</p>
              <p className="font-mono font-bold text-green-700 text-base">{successOrderId}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500" />
              Redirecting to order tracking…
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        <h1 className="text-[18px] font-bold text-slate-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Delivery address card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <h2 className="text-[14px] font-semibold text-slate-900">Delivery address</h2>
                </div>
                {!showForm && (
                  <button
                    onClick={() => { setShowForm(true); setForm(emptyForm); setFormErrors({}); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add new
                  </button>
                )}
              </div>

              {/* Saved address list */}
              {addresses.length > 0 && !showForm && (
                <div className="space-y-2 mb-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => selectAddress(addr.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedId === addr.id
                          ? "border-green-400 bg-green-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Radio */}
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedId === addr.id ? "border-green-600" : "border-slate-300"
                      }`}>
                        {selectedId === addr.id && <div className="w-2 h-2 rounded-full bg-green-600" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            selectedId === addr.id ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {TYPE_ICON[addr.type] ?? <MoreHorizontal className="w-3.5 h-3.5" />}
                            {addr.type}
                          </span>
                          {addr.is_default && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600">
                              <CheckCircle2 className="w-3 h-3" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed">{addr.address}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Pincode: {addr.pincode}</p>
                        {addr.receiver_name && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" /> {addr.receiver_name}
                            {addr.receiver_phone && <span> · {addr.receiver_phone}</span>}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {!addr.is_default && (
                          <button
                            onClick={() => setDefault(addr.id)}
                            className="text-[11px] text-slate-400 hover:text-green-600 font-medium transition-colors"
                          >
                            Set default
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingAddress({
                              id: addr.id, type: addr.type, address: addr.address, pincode: addr.pincode,
                              receiver_name: addr.receiver_name ?? "",
                              receiver_phone: addr.receiver_phone ?? "",
                              receiver_email: addr.receiver_email ?? "",
                            });
                            setFormErrors({});
                            setShowForm(false);
                          }}
                          className="text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteAddress(addr.id)}
                          disabled={deletingId === addr.id}
                          className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        >
                          {deletingId === addr.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit address form */}
              {editingAddress && (
                <div className="space-y-3 pt-2 border-t border-slate-100 mt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Edit address</p>
                  <div className="flex gap-2">
                    {["Home", "Work", "Others"].map((t) => (
                      <button key={t} type="button"
                        onClick={() => setEditingAddress((p) => p ? { ...p, type: t } : p)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          editingAddress.type === t ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {TYPE_ICON[t]} {t}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Street, Area, City, State <span className="text-red-500">*</span></label>
                    <textarea rows={3} value={editingAddress.address}
                      onChange={(e) => { setEditingAddress((p) => p ? { ...p, address: e.target.value } : p); setFormErrors((p) => ({ ...p, address: undefined })); }}
                      className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                        formErrors.address ? "border-red-400 focus:ring-red-500/20" : "border-slate-200 focus:ring-green-500/20 focus:border-green-400"
                      }`}
                    />
                    {formErrors.address && <p className="text-[11px] text-red-500">{formErrors.address}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pincode <span className="text-red-500">*</span></label>
                    <input type="text" inputMode="numeric" maxLength={6} value={editingAddress.pincode}
                      onChange={(e) => { setEditingAddress((p) => p ? { ...p, pincode: e.target.value } : p); setFormErrors((p) => ({ ...p, pincode: undefined })); }}
                      className={`w-full h-10 px-3.5 text-sm bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        formErrors.pincode ? "border-red-400 focus:ring-red-500/20" : "border-slate-200 focus:ring-green-500/20 focus:border-green-400"
                      }`}
                    />
                    {formErrors.pincode && <p className="text-[11px] text-red-500">{formErrors.pincode}</p>}
                  </div>

                  <ReceiverFields
                    name={editingAddress.receiver_name}
                    phone={editingAddress.receiver_phone}
                    email={editingAddress.receiver_email}
                    onChange={(field, val) => setEditingAddress((p) => p ? { ...p, [field]: val } : p)}
                    errors={{ receiver_phone: formErrors.receiver_phone }}
                  />

                  <div className="flex gap-2 pt-1">
                    <button onClick={updateAddress} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : "Save changes"}
                    </button>
                    <button onClick={() => { setEditingAddress(null); setFormErrors({}); }}
                      className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Add new address form */}
              {showForm && (
                <div className="space-y-3 pt-1">
                  <div className="flex gap-2">
                    {["Home", "Work", "Others"].map((t) => (
                      <button
                        key={t} type="button"
                        onClick={() => setForm((p) => ({ ...p, type: t }))}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          form.type === t ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {TYPE_ICON[t]} {t}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Street, Area, City, State <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3} value={form.address}
                      onChange={(e) => { setForm((p) => ({ ...p, address: e.target.value })); setFormErrors((p) => ({ ...p, address: undefined })); }}
                      placeholder="e.g. 42, MG Road, Banjara Hills, Hyderabad, Telangana"
                      className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                        formErrors.address ? "border-red-400 focus:ring-red-500/20" : "border-slate-200 focus:ring-green-500/20 focus:border-green-400"
                      }`}
                    />
                    {formErrors.address && <p className="text-[11px] text-red-500">{formErrors.address}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" inputMode="numeric" maxLength={6} value={form.pincode}
                      onChange={(e) => { setForm((p) => ({ ...p, pincode: e.target.value })); setFormErrors((p) => ({ ...p, pincode: undefined })); }}
                      placeholder="e.g. 500034"
                      className={`w-full h-10 px-3.5 text-sm bg-white border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        formErrors.pincode ? "border-red-400 focus:ring-red-500/20" : "border-slate-200 focus:ring-green-500/20 focus:border-green-400"
                      }`}
                    />
                    {formErrors.pincode && <p className="text-[11px] text-red-500">{formErrors.pincode}</p>}
                  </div>

                  <ReceiverFields
                    name={form.receiver_name}
                    phone={form.receiver_phone}
                    email={form.receiver_email}
                    onChange={(field, val) => setForm((p) => ({ ...p, [field]: val }))}
                    errors={{ receiver_phone: formErrors.receiver_phone }}
                  />

                  <div className="flex gap-2 pt-1">
                    <button onClick={saveAddress} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : "Save address"}
                    </button>
                    {addresses.length > 0 && (
                      <button
                        onClick={() => { setShowForm(false); setForm(emptyForm); setFormErrors({}); }}
                        className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Receiver details for this order */}
            {selectedId && !showForm && !editingAddress && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-green-600" />
                  <h2 className="text-[14px] font-semibold text-slate-900">Receiver details</h2>
                </div>
                <p className="text-xs text-slate-400 mb-4">Leave blank to deliver to yourself. Fill in if ordering for someone else.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><User className="w-3 h-3" /> Name</label>
                    <input value={receiver.name}
                      onChange={(e) => setReceiver((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Receiver's full name"
                      className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                    <input value={receiver.phone}
                      onChange={(e) => { setReceiver((p) => ({ ...p, phone: e.target.value })); setReceiverErrors({}); }}
                      placeholder="10-digit mobile" inputMode="numeric" maxLength={10}
                      className={`w-full h-10 px-3.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-slate-800 placeholder:text-slate-400 ${receiverErrors.phone ? "border-red-400 focus:ring-red-500/20" : "border-slate-200 focus:ring-green-500/20 focus:border-green-400"}`}
                    />
                    {receiverErrors.phone && <p className="text-[11px] text-red-500">{receiverErrors.phone}</p>}
                  </div>
                </div>
                <div className="space-y-1 mt-3">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3" /> Email <span className="text-slate-400 font-normal ml-1">(optional)</span></label>
                  <input value={receiver.email}
                    onChange={(e) => setReceiver((p) => ({ ...p, email: e.target.value }))}
                    placeholder="receiver@email.com" type="email"
                    className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 text-slate-800 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="text-[14px] font-semibold text-slate-900 mb-4">Payment method</h2>
              <div className="space-y-2">
                {(["COD", "UPI", "Card"] as PaymentMethod[]).map((m) => (
                  <label key={m} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    payment === m ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <input type="radio" name="payment" value={m} checked={payment === m} onChange={() => setPayment(m)} className="accent-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {m === "COD" ? "Cash on delivery" : m === "UPI" ? "UPI / QR" : "Credit / Debit card"}
                      </p>
                      {m === "COD" && <p className="text-xs text-slate-400">Pay when your order arrives</p>}
                      {m === "UPI" && <p className="text-xs text-slate-400">GPay, PhonePe, Paytm & more</p>}
                      {m === "Card" && <p className="text-xs text-slate-400">Visa, Mastercard, RuPay</p>}
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right column: order summary ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-4 h-4 text-green-600" />
                <h2 className="text-[14px] font-semibold text-slate-900">Order summary</h2>
              </div>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">×{item.quantity} · ₹{item.price}/{item.unit}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Delivery fee</span>
                  <span>{deliveryFee === 0
                    ? <span className="text-green-600 font-medium">Free</span>
                    : `₹${deliveryFee}`}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-green-500" />
                    Add ₹{(FREE_DELIVERY_ABOVE - total).toLocaleString("en-IN")} more for free delivery
                  </p>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {orderError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{orderError}</p>
            )}

            {/* Serviceability banner */}
            {serviceability === "checking" && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                Checking delivery availability for your pincode…
              </div>
            )}
            {serviceability === "unserviced" && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">We don't deliver to this pincode yet</p>
                  <p className="text-xs text-red-500 mt-0.5">Try a different address or check back later as we expand our delivery zones.</p>
                </div>
              </div>
            )}
            {serviceability === "serviced" && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Delivery available for your pincode
              </div>
            )}

            <button
              onClick={placeOrder}
              disabled={placing || !canPlace}
              className="w-full h-12 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {placing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing order...</>
                : <><span>Place order</span><ChevronRight className="w-4 h-4" /></>}
            </button>

            {!selectedId && !showForm && (
              <p className="text-xs text-amber-600 text-center">Select a delivery address to continue</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
