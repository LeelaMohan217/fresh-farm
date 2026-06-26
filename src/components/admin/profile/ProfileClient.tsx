"use client";

import { useState } from "react";
import {
  User, Mail, ShieldCheck, Calendar,
  Pencil, KeyRound, CheckCircle2, AlertCircle,
  Loader2, Eye, EyeOff, X, Check,
} from "lucide-react";

type Admin = {
  id: string; name: string; email: string;
  role: string; createdAt: string;
};

const ROLE_COLOR: Record<string, string> = {
  superadmin: "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
  admin:      "bg-green-100 text-green-700 ring-1 ring-green-200",
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProfileClient({ admin: initial }: { admin: Admin }) {
  const [admin, setAdmin] = useState(initial);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: admin.name, email: admin.email });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [editingPw, setEditingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Save profile ── */
  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg(null);
    try {
      const res  = await fetch("/api/admin/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) { setProfileMsg({ type: "error", text: data.error }); return; }
      setAdmin((p) => ({ ...p, name: data.name, email: data.email }));
      setEditingProfile(false);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch { setProfileMsg({ type: "error", text: "Something went wrong." }); }
    finally { setSavingProfile(false); }
  };

  /* ── Change password ── */
  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: "error", text: "Passwords do not match." }); return;
    }
    setSavingPw(true); setPwMsg(null);
    try {
      const res  = await fetch("/api/admin/profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) { setPwMsg({ type: "error", text: data.error }); return; }
      setPwForm({ current: "", next: "", confirm: "" });
      setEditingPw(false);
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setTimeout(() => setPwMsg(null), 4000);
    } catch { setPwMsg({ type: "error", text: "Something went wrong." }); }
    finally { setSavingPw(false); }
  };

  return (
    <div className="h-full flex flex-col gap-6">

      {/* ── Sticky header ── */}
      <div className="shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your account details</p>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto scrollbar-none min-h-0 space-y-4">

        {/* Avatar card */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-white text-xl font-bold tracking-wide">
              {getInitials(admin.name)}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center
              ${admin.role === "superadmin" ? "bg-purple-500" : "bg-green-500"}`}
            >
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{admin.name}</p>
            <p className="text-sm text-slate-500">{admin.email}</p>
            <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_COLOR[admin.role] ?? "bg-slate-100 text-slate-600"}`}>
              <ShieldCheck className="w-3 h-3" />
              {admin.role}
            </span>
          </div>
        </div>

        {/* Profile info */}
        <div className="bg-white rounded-xl border border-slate-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-900">Personal Information</p>
              <p className="text-xs text-slate-400 mt-0.5">Update your name and email</p>
            </div>
            {!editingProfile && (
              <button
                onClick={() => { setEditingProfile(true); setProfileForm({ name: admin.name, email: admin.email }); }}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          <div className="p-5 space-y-4">
            {profileMsg && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                profileMsg.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-600 border border-red-100"
              }`}>
                {profileMsg.type === "success"
                  ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                {profileMsg.text}
              </div>
            )}

            {editingProfile ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveProfile} disabled={savingProfile}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: User,     label: "Full Name",    value: admin.name },
                  { icon: Mail,     label: "Email",        value: admin.email },
                  { icon: Calendar, label: "Member since", value: admin.createdAt },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                      <p className="text-sm text-slate-800">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-xl border border-slate-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-900">Password</p>
              <p className="text-xs text-slate-400 mt-0.5">Keep your account secure</p>
            </div>
            {!editingPw && (
              <button
                onClick={() => setEditingPw(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" /> Change
              </button>
            )}
          </div>

          <div className="p-5">
            {pwMsg && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-4 ${
                pwMsg.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-600 border border-red-100"
              }`}>
                {pwMsg.type === "success"
                  ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                {pwMsg.text}
              </div>
            )}

            {editingPw ? (
              <div className="space-y-3">
                {[
                  { key: "current", label: "Current Password", show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                  { key: "next",    label: "New Password",     show: showNext,    toggle: () => setShowNext(!showNext) },
                  { key: "confirm", label: "Confirm New Password", show: showNext, toggle: () => setShowNext(!showNext) },
                ].map(({ key, label, show, toggle }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">{label}</label>
                    <div className="relative">
                      <input
                        type={show ? "text" : "password"}
                        value={pwForm[key as keyof typeof pwForm]}
                        onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full h-10 px-3 pr-9 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
                      />
                      <button type="button" onClick={toggle}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={changePassword} disabled={savingPw}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    {savingPw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Update Password
                  </button>
                  <button
                    onClick={() => { setEditingPw(false); setPwForm({ current: "", next: "", confirm: "" }); }}
                    className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Your password was last changed when your account was created.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
