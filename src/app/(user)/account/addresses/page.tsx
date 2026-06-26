"use client";

import { useState, useEffect } from "react";
import { MapPin, Home, Briefcase, MoreHorizontal, Plus, Pencil, Trash2, Check, Loader2, X, User, Phone, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Address = {
  id: string; type: string; address: string; pincode: string; is_default: boolean;
  receiver_name: string | null; receiver_phone: string | null; receiver_email: string | null;
};

const TYPE_OPTS = ["Home", "Work", "Others"];
const TYPE_ICON: Record<string, React.ElementType> = { Home, Work: Briefcase, Others: MoreHorizontal };

const EMPTY_FORM = { type: "Home", address: "", pincode: "", receiver_name: "", receiver_phone: "", receiver_email: "" };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]         = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/auth/me/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); setError(""); };
  const openEdit = (a: Address) => {
    setForm({
      type: a.type, address: a.address, pincode: a.pincode,
      receiver_name: a.receiver_name ?? "", receiver_phone: a.receiver_phone ?? "", receiver_email: a.receiver_email ?? "",
    });
    setEditId(a.id); setShowForm(true); setError("");
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setError(""); };

  const save = async () => {
    if (!form.address.trim()) { setError("Address is required."); return; }
    if (!/^\d{6}$/.test(form.pincode)) { setError("Enter a valid 6-digit pincode."); return; }
    if (form.receiver_phone && !/^\d{10}$/.test(form.receiver_phone)) { setError("Receiver phone must be a valid 10-digit number."); return; }
    setSaving(true); setError("");
    const body = {
      type: form.type, address: form.address, pincode: form.pincode,
      receiver_name: form.receiver_name || null,
      receiver_phone: form.receiver_phone || null,
      receiver_email: form.receiver_email || null,
    };
    const res = editId
      ? await fetch(`/api/auth/me/addresses/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/auth/me/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { closeForm(); load(); }
    else { const d = await res.json(); setError(d.error ?? "Failed to save address."); }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/auth/me/addresses/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  };

  const setDefault = async (id: string) => {
    await fetch(`/api/auth/me/addresses/${id}`, { method: "PATCH" });
    load();
  };

  if (loading) {
    return (
      <div className="space-y-4 pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
            <div className="flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3.5 w-full max-w-xs" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Saved Addresses</h2>
          <p className="text-xs text-slate-400 mt-0.5">{addresses.length} address{addresses.length !== 1 ? "es" : ""} saved</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-green-50/50">
            <h3 className="text-sm font-bold text-slate-900">{editId ? "Edit Address" : "Add New Address"}</h3>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            {/* Type selector */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Address Type</label>
              <div className="flex gap-2">
                {TYPE_OPTS.map((t) => {
                  const Icon = TYPE_ICON[t] ?? MapPin;
                  return (
                    <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                        form.type === t ? "bg-green-50 border-green-400 text-green-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Full Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                rows={3}
                placeholder="House/flat no., street, area, city..."
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-slate-900 resize-none transition-all"
              />
            </div>

            {/* Pincode */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Pincode</label>
              <input
                value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                maxLength={6}
                placeholder="500032"
                className="w-32 h-10 px-3.5 rounded-xl border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-slate-900 transition-all"
              />
            </div>

            {/* Receiver details */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Receiver Details <span className="text-slate-400 font-normal normal-case">(if ordering for someone else)</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Name</label>
                  <input value={form.receiver_name} onChange={(e) => setForm((f) => ({ ...f, receiver_name: e.target.value }))}
                    placeholder="Receiver's name"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-slate-900 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                  <input value={form.receiver_phone} onChange={(e) => setForm((f) => ({ ...f, receiver_phone: e.target.value }))}
                    placeholder="10-digit mobile" inputMode="numeric" maxLength={10}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-slate-900 transition-all"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={form.receiver_email} onChange={(e) => setForm((f) => ({ ...f, receiver_email: e.target.value }))}
                  placeholder="receiver@email.com" type="email"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-slate-900 transition-all"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editId ? "Save Changes" : "Add Address"}
              </button>
              <button onClick={closeForm} className="px-5 py-2.5 border border-slate-200 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <MapPin className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No saved addresses</p>
          <p className="text-xs text-slate-400 mt-1">Add an address to speed up checkout</p>
          <button onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => {
            const Icon = TYPE_ICON[a.type] ?? MapPin;
            return (
              <div key={a.id}
                className={`bg-white rounded-2xl border transition-all ${a.is_default ? "border-green-200 shadow-sm" : "border-slate-100"}`}
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${a.is_default ? "bg-green-100" : "bg-slate-100"}`}>
                    <Icon className={`w-5 h-5 ${a.is_default ? "text-green-600" : "text-slate-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs font-bold uppercase tracking-wide ${a.is_default ? "text-green-600" : "text-slate-700"}`}>{a.type}</p>
                      {a.is_default && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{a.address}</p>
                    <p className="text-xs text-slate-400 mt-1">Pincode: {a.pincode}</p>
                    {a.receiver_name && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> {a.receiver_name}</span>
                        {a.receiver_phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {a.receiver_phone}</span>}
                        {a.receiver_email && <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {a.receiver_email}</span>}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!a.is_default && (
                      <button onClick={() => setDefault(a.id)}
                        className="text-xs font-semibold text-green-600 hover:text-green-700 border border-green-200 hover:border-green-400 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                      >
                        Set default
                      </button>
                    )}
                    <button onClick={() => openEdit(a)}
                      className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button onClick={() => remove(a.id)} disabled={deletingId === a.id}
                      className="w-8 h-8 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all"
                    >
                      {deletingId === a.id
                        ? <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
