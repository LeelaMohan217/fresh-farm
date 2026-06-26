"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sprout, Eye, EyeOff, Loader2, Leaf, Truck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type FieldErrors = { email?: string; password?: string };

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setError("");
    if (fieldErrors[k]) setFieldErrors((p) => ({ ...p, [k]: undefined }));
  };

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Password is required.";
    return errs;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await refresh();
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── DESKTOP: left farm photo panel (lg+) ── */}
      <div className="hidden lg:block relative w-1/2">
        <Image
          src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&q=80"
          alt="Fresh farm produce" fill className="object-cover" priority
        />
        <div className="absolute inset-0 bg-green-900/60" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">FarmFresh</p>
              <p className="text-xs text-white/70">Organic &amp; Hydroponic</p>
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-snug drop-shadow">
              Welcome back to<br />your farm family.
            </h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              Sign in to manage your orders, track deliveries, and enjoy fresh organic produce delivered straight from our farms.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["100% Organic", "Zero Pesticides", "Farm Fresh", "Fast Delivery", "Hydroponic"].map((tag) => (
                <span key={tag} className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs text-white/90 border border-white/20">{tag}</span>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/40">&copy; 2026 FarmFresh. All rights reserved.</p>
        </div>
      </div>

      {/* ── DESKTOP: right form panel (lg+) ── */}
      <div className="hidden lg:flex flex-1 items-center justify-center px-6 py-6 bg-[#F8FAFC]">
        <div className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-0.5">Sign in to your account</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <DesktopForm
              form={form} set={set} showPw={showPw} setShowPw={setShowPw}
              loading={loading} error={error} fieldErrors={fieldErrors}
              onSubmit={handleSubmit}
            />
          </div>
          <p className="text-center text-sm text-slate-500">
            New to FarmFresh?{" "}
            <Link href="/auth/register" className="text-green-600 font-semibold hover:text-green-700">Create account</Link>
          </p>
        </div>
      </div>

      {/* ── MOBILE layout (hidden on lg+) ── */}
      <div className="flex lg:hidden flex-col w-full min-h-screen">

        {/* Green hero header */}
        <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 px-6 pt-12 pb-10 flex-shrink-0">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-sm border border-white/30">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">Welcome back!</h1>
            <p className="text-white/80 text-sm mt-1">Sign in to FarmFresh</p>

            {/* Trust badges */}
            <div className="flex gap-3 mt-5">
              {[
                { icon: Leaf,       label: "100% Organic" },
                { icon: Truck,      label: "Fast Delivery" },
                { icon: ShieldCheck, label: "Secure" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                  <Icon className="w-3 h-3 text-white" />
                  <span className="text-[11px] font-semibold text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* White form sheet */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-6 pt-7 pb-8 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Sign in to your account</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                autoComplete="email"
                className={`w-full h-12 px-4 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  fieldErrors.email
                    ? "border-red-400 focus:ring-red-500/20"
                    : "border-slate-200 focus:ring-green-500/30 focus:border-green-400"
                }`}
              />
              {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-green-600 font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full h-12 px-4 pr-12 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    fieldErrors.password
                      ? "border-red-400 focus:ring-red-500/20"
                      : "border-slate-200 focus:ring-green-500/30 focus:border-green-400"
                  }`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 text-sm shadow-sm shadow-green-200"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            New to FarmFresh?{" "}
            <Link href="/auth/register" className="text-green-600 font-semibold">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* Shared desktop form component */
function DesktopForm({
  form, set, showPw, setShowPw, loading, error, fieldErrors, onSubmit,
}: {
  form: { email: string; password: string };
  set: (k: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
  loading: boolean;
  error: string;
  fieldErrors: FieldErrors;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const fc = (f: keyof FieldErrors) =>
    `w-full h-10 px-3 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
      fieldErrors[f] ? "border-red-400 focus:ring-red-500/20" : "border-slate-200 focus:ring-green-500/30 focus:border-green-400"
    }`;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Email address <span className="text-red-500">*</span></label>
        <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={fc("email")} />
        {fieldErrors.email && <p className="text-[11px] text-red-500">{fieldErrors.email}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Password <span className="text-red-500">*</span></label>
        <div className="relative">
          <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Enter your password"
            className={`${fc("password")} pr-10`} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.password && <p className="text-[11px] text-red-500">{fieldErrors.password}</p>}
      </div>
      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-xs text-green-600 hover:text-green-700 font-medium">Forgot password?</Link>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full h-10 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign in"}
      </button>
    </form>
  );
}
