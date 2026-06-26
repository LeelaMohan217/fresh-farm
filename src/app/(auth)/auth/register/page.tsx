"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sprout, Eye, EyeOff, Loader2, Leaf, Truck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type FieldErrors = {
  firstName?: string; lastName?: string;
  email?: string; phone?: string; password?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw]           = useState(false);
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
    const nameRe = /^[A-Za-z\s'-]+$/;
    if (!form.firstName.trim()) errs.firstName = "First name is required.";
    else if (form.firstName.trim().length < 2) errs.firstName = "Min. 2 characters.";
    else if (!nameRe.test(form.firstName.trim())) errs.firstName = "Letters only.";

    if (!form.lastName.trim()) errs.lastName = "Last name is required.";
    else if (form.lastName.trim().length < 2) errs.lastName = "Min. 2 characters.";
    else if (!nameRe.test(form.lastName.trim())) errs.lastName = "Letters only.";

    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = "Enter a valid email address.";

    const phone = form.phone.trim().replace(/\s+/g, "");
    if (!phone) errs.phone = "Phone number is required.";
    else if (!/^(\+91)?[6-9]\d{9}$/.test(phone)) errs.phone = "Enter a valid 10-digit Indian mobile number.";

    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8) errs.password = "Min. 8 characters.";
    else if (!/[A-Z]/.test(form.password)) errs.password = "Must include at least one uppercase letter.";
    else if (!/[0-9]/.test(form.password)) errs.password = "Must include at least one number.";
    else if (!/[^A-Za-z0-9]/.test(form.password)) errs.password = "Must include at least one special character.";
    return errs;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      const { firstName, lastName, ...rest } = form;
      const payload = { ...rest, name: `${firstName.trim()} ${lastName.trim()}` };
      const res  = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      {/* ── DESKTOP: left farm photo (lg+) ── */}
      <div className="hidden lg:block relative w-1/2">
        <Image
          src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80"
          alt="Fresh vegetables" fill className="object-cover" priority
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
              Farm-fresh produce,<br />delivered to your door.
            </h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              Join thousands of families who trust FarmFresh for 100% organic vegetables, fruits, and hydroponic greens grown without chemicals.
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
      <div className="hidden lg:flex flex-1 items-center justify-center px-6 py-6 bg-[#F8FAFC] overflow-y-auto">
        <div className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create your account</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in your details to get started.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <DesktopForm
              form={form} set={set} showPw={showPw} setShowPw={setShowPw}
              loading={loading} error={error} fieldErrors={fieldErrors}
              onSubmit={handleSubmit}
            />
          </div>
          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-green-600 font-semibold hover:text-green-700">Sign in</Link>
          </p>
        </div>
      </div>

      {/* ── MOBILE layout (hidden on lg+) ── */}
      <div className="flex lg:hidden flex-col w-full min-h-screen">

        {/* Green hero header */}
        <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 px-6 pt-12 pb-10 flex-shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-sm border border-white/30">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">Join FarmFresh</h1>
            <p className="text-white/80 text-sm mt-1">Fresh & organic, delivered daily</p>

            <div className="flex gap-3 mt-5">
              {[
                { icon: Leaf,        label: "100% Organic" },
                { icon: Truck,       label: "Fast Delivery" },
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
          <h2 className="text-lg font-bold text-slate-900 mb-5">Create your account</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">First name</label>
                <input
                  value={form.firstName} onChange={set("firstName")} placeholder="Priya"
                  className={mobileInput(!!fieldErrors.firstName)}
                />
                {fieldErrors.firstName && <p className="text-xs text-red-500">{fieldErrors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Last name</label>
                <input
                  value={form.lastName} onChange={set("lastName")} placeholder="Sharma"
                  className={mobileInput(!!fieldErrors.lastName)}
                />
                {fieldErrors.lastName && <p className="text-xs text-red-500">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email address</label>
              <input
                type="email" value={form.email} onChange={set("email")}
                placeholder="you@example.com" autoComplete="email"
                className={mobileInput(!!fieldErrors.email)}
              />
              {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Phone number</label>
              <input
                type="tel" value={form.phone} onChange={set("phone")}
                placeholder="+91 98765 43210" autoComplete="tel"
                className={mobileInput(!!fieldErrors.phone)}
              />
              {fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
                  placeholder="Min. 8 chars, uppercase, number, symbol"
                  autoComplete="new-password"
                  className={`${mobileInput(!!fieldErrors.password)} pr-12`}
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
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-green-600 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function mobileInput(hasError: boolean) {
  return `w-full h-12 px-4 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
    hasError
      ? "border-red-400 focus:ring-red-500/20"
      : "border-slate-200 focus:ring-green-500/30 focus:border-green-400"
  }`;
}

function DesktopForm({
  form, set, showPw, setShowPw, loading, error, fieldErrors, onSubmit,
}: {
  form: { firstName: string; lastName: string; email: string; phone: string; password: string };
  set: (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPw: boolean; setShowPw: (v: boolean) => void;
  loading: boolean; error: string; fieldErrors: FieldErrors;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const fc = (f: keyof FieldErrors) =>
    `w-full h-10 px-3 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
      fieldErrors[f] ? "border-red-400 focus:ring-red-500/20" : "border-slate-200 focus:ring-green-500/30 focus:border-green-400"
    }`;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">First name <span className="text-red-500">*</span></label>
          <input value={form.firstName} onChange={set("firstName")} placeholder="Priya" className={fc("firstName")} />
          {fieldErrors.firstName && <p className="text-[11px] text-red-500">{fieldErrors.firstName}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Last name <span className="text-red-500">*</span></label>
          <input value={form.lastName} onChange={set("lastName")} placeholder="Sharma" className={fc("lastName")} />
          {fieldErrors.lastName && <p className="text-[11px] text-red-500">{fieldErrors.lastName}</p>}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Email address <span className="text-red-500">*</span></label>
        <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={fc("email")} />
        {fieldErrors.email && <p className="text-[11px] text-red-500">{fieldErrors.email}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Phone number <span className="text-red-500">*</span></label>
        <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className={fc("phone")} />
        {fieldErrors.phone && <p className="text-[11px] text-red-500">{fieldErrors.phone}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Password <span className="text-red-500">*</span></label>
        <div className="relative">
          <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
            placeholder="Min. 8 chars, uppercase, number, symbol" className={`${fc("password")} pr-10`} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.password && <p className="text-[11px] text-red-500">{fieldErrors.password}</p>}
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full h-10 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create account"}
      </button>
    </form>
  );
}
