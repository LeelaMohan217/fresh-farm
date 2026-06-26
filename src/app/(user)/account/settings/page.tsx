"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm]     = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow]     = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required."); return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters."); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match."); return;
    }

    setSaving(true);
    const res = await fetch("/api/auth/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    });
    setSaving(false);

    if (res.ok) {
      setSuccess("Password changed successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to change password.");
    }
  };

  const Field = ({ label, field, placeholder }: { label: string; field: "current" | "new" | "confirm"; placeholder: string }) => (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">{label}</label>
      <div className="relative">
        <input
          type={show[field] ? "text" : "password"}
          value={form[field === "current" ? "currentPassword" : field === "new" ? "newPassword" : "confirmPassword"]}
          onChange={(e) => setForm((f) => ({
            ...f,
            [field === "current" ? "currentPassword" : field === "new" ? "newPassword" : "confirmPassword"]: e.target.value
          }))}
          placeholder={placeholder}
          className="w-full sm:max-w-sm h-10 pl-3.5 pr-10 rounded-xl border border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-slate-900 transition-all"
        />
        <button type="button" onClick={() => setShow((s) => ({ ...s, [field]: !s[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Account Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage your security preferences</p>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Change Password</p>
              <p className="text-xs text-slate-400">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Current Password"  field="current" placeholder="Enter current password" />
            <Field label="New Password"       field="new"     placeholder="Min. 8 characters" />
            <Field label="Confirm New Password" field="confirm" placeholder="Repeat new password" />

            {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">{success}</p>}

            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors mt-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
