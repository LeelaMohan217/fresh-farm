"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const EVENT_TYPES = ["Wedding", "Birthday", "Corporate", "Festival", "Other"] as const;
type EventType = (typeof EVENT_TYPES)[number];

export default function BulkOrderForm() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState({
    eventType: "Wedding" as EventType,
    deliveryDate: "",
    itemsDesc: "",
    quantityDesc: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (loading) {
    return <div className="py-8 text-center text-slate-400 text-sm">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
        <p className="text-slate-700 font-semibold mb-1">Sign in to submit a bulk order request</p>
        <p className="text-sm text-slate-500 mb-4">Create an account or sign in to place bulk orders.</p>
        <div className="flex justify-center gap-3">
          <Link href="/auth/login"
            className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
          >
            Sign in
          </Link>
          <Link href="/auth/register"
            className="px-5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Request submitted!</h3>
        <p className="text-sm text-slate-500 mt-2 mb-5">
          We&apos;ve received your bulk order request. Our team will contact you within 24 hours with a custom quote.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setForm({ eventType: "Wedding", deliveryDate: "", itemsDesc: "", quantityDesc: "" });
          }}
          className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
        >
          Submit another request
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deliveryDate) { setError("Please select a delivery date."); return; }
    if (!form.itemsDesc.trim()) { setError("Please describe the items needed."); return; }
    if (!form.quantityDesc.trim()) { setError("Please provide quantity or portion details."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bulk-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Event type */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Event Type</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {EVENT_TYPES.map((type) => (
            <button key={type} type="button"
              onClick={() => setForm({ ...form, eventType: type })}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                form.eventType === type
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-amber-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery date */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Required Delivery Date
        </label>
        <input
          type="date"
          required
          value={form.deliveryDate}
          min={minDate}
          onChange={(e) => { setForm({ ...form, deliveryDate: e.target.value }); setError(""); }}
          className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all"
        />
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Items Needed
        </label>
        <textarea
          required
          rows={3}
          value={form.itemsDesc}
          onChange={(e) => { setForm({ ...form, itemsDesc: e.target.value }); setError(""); }}
          placeholder="e.g. Spinach, Lettuce, Tomatoes, Herbs..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all resize-none"
        />
      </div>

      {/* Quantity */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Quantity / Portion Details
        </label>
        <textarea
          required
          rows={2}
          value={form.quantityDesc}
          onChange={(e) => { setForm({ ...form, quantityDesc: e.target.value }); setError(""); }}
          placeholder="e.g. 5 kg spinach, salad for 50 people..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</p>
      )}

      <button type="submit" disabled={submitting}
        className="w-full h-11 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
      >
        {submitting
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          : <><CalendarDays className="w-4 h-4" /> Submit Request</>
        }
      </button>

      <p className="text-xs text-slate-400 text-center">
        Submitting as <span className="font-semibold text-slate-600">{user.name}</span> · We&apos;ll respond within 24 hours with a custom quote.
      </p>
    </form>
  );
}
