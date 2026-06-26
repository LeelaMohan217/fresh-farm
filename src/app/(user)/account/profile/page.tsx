"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Pencil, Check, X, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = { id: string; name: string; email: string; phone: string | null };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name: "", phone: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setForm({ name: d.name ?? "", phone: d.phone ?? "" });
      })
      .finally(() => setLoading(false));
  }, []);

  const startEdit = () => { setEditing(true); setError(""); setSuccess(""); };
  const cancelEdit = () => {
    setEditing(false);
    setForm({ name: profile?.name ?? "", phone: profile?.phone ?? "" });
  };

  const save = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/auth/me/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, phone: form.phone }),
    });
    setSaving(false);
    if (res.ok) {
      setProfile((p) => p ? { ...p, name: form.name, phone: form.phone || null } : p);
      setEditing(false);
      setSuccess("Profile updated successfully.");
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to update profile.");
    }
  };

  function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  if (loading) {
    return (
      <div className="pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-8 w-16 rounded-xl" />
          </div>
          <div className="px-6 py-6">
            <div className="flex items-center gap-4 mb-7">
              <Skeleton className="w-16 h-16 rounded-full shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update your name and contact details</p>
          </div>
          {!editing ? (
            <button onClick={startEdit}
              className="flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-xl transition-all"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={cancelEdit}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl transition-all"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 px-3 py-1.5 rounded-xl transition-all"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-7">
            <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold shrink-0">
              {profile ? getInitials(profile.name) : "?"}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">{profile?.name}</p>
              <p className="text-sm text-slate-400">{profile?.email}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              {editing ? (
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full sm:max-w-sm h-10 px-3.5 rounded-xl border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-slate-900 transition-all"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-900">{profile?.name}</p>
              )}
            </div>

            {/* Email — read only */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{profile?.email}</p>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Cannot be changed</span>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              {editing ? (
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full sm:max-w-sm h-10 px-3.5 rounded-xl border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-slate-900 transition-all"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-900">{profile?.phone || <span className="text-slate-400 font-normal">Not added</span>}</p>
              )}
            </div>
          </div>

          {error   && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}
          {success && <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">{success}</p>}
        </div>
      </div>
    </div>
  );
}
