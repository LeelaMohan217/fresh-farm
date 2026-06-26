"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type FieldErrors = {
  firstName?: string; lastName?: string;
  email?: string; phone?: string; password?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
  });
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

    if (!form.firstName.trim()) errs.firstName = "Enter your first name.";
    else if (form.firstName.trim().length < 2) errs.firstName = "At least 2 characters.";
    else if (!nameRe.test(form.firstName.trim())) errs.firstName = "Letters only.";

    if (!form.lastName.trim()) errs.lastName = "Enter your last name.";
    else if (form.lastName.trim().length < 2) errs.lastName = "At least 2 characters.";
    else if (!nameRe.test(form.lastName.trim())) errs.lastName = "Letters only.";

    if (!form.email.trim()) errs.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = "That email address isn't valid.";

    const phone = form.phone.trim().replace(/\s+/g, "");
    if (!phone) errs.phone = "Enter your phone number.";
    else if (!/^(\+91)?[6-9]\d{9}$/.test(phone)) errs.phone = "Enter a valid 10-digit Indian mobile number.";

    if (!form.password) errs.password = "Enter a password.";
    else if (form.password.length < 8) errs.password = "Use at least 8 characters.";
    else if (!/[A-Z]/.test(form.password)) errs.password = "Include at least one uppercase letter.";
    else if (!/[0-9]/.test(form.password)) errs.password = "Include at least one number.";
    else if (!/[^A-Za-z0-9]/.test(form.password)) errs.password = "Include at least one special character.";

    return errs;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        email: form.email, phone: form.phone, password: form.password,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      };
      const res  = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Couldn't create your account. Please try again."); return; }
      await refresh();
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-white sm:bg-[#F7F8FA] flex flex-col overflow-y-auto">

      {/* top bar — desktop only */}
      <div className="hidden sm:flex items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Sprout className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="text-[15px] font-semibold text-slate-900">FarmFresh</span>
        </Link>
        <Link href="/auth/login"
          className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
          Sign in
        </Link>
      </div>

      {/* center card */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-8">
        <div className="w-full sm:max-w-[440px] bg-white sm:border sm:border-[#E5E7EB] sm:rounded-2xl sm:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.04)] px-6 sm:px-10 pt-10 pb-10">

          {/* brand mark */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center mb-4">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.3px]">Create your account</h1>
            <p className="text-[14px] text-[#6B7280] mt-1">Join FarmFresh — fresh produce delivered</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="block text-[13px] font-medium text-[#374151]">First name</label>
                <input
                  id="firstName"
                  value={form.firstName}
                  onChange={set("firstName")}
                  placeholder="Priya"
                  autoComplete="given-name"
                  className={inputCls(!!fieldErrors.firstName)}
                />
                {fieldErrors.firstName && <p className="text-[12px] text-red-500">{fieldErrors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="block text-[13px] font-medium text-[#374151]">Last name</label>
                <input
                  id="lastName"
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Sharma"
                  autoComplete="family-name"
                  className={inputCls(!!fieldErrors.lastName)}
                />
                {fieldErrors.lastName && <p className="text-[12px] text-red-500">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-medium text-[#374151]">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className={inputCls(!!fieldErrors.email)}
              />
              {fieldErrors.email && <p className="text-[12px] text-red-500">{fieldErrors.email}</p>}
            </div>

            {/* phone */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-[13px] font-medium text-[#374151]">Mobile number</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+91 98765 43210"
                className={inputCls(!!fieldErrors.phone)}
              />
              {fieldErrors.phone && <p className="text-[12px] text-red-500">{fieldErrors.phone}</p>}
            </div>

            {/* password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[13px] font-medium text-[#374151]">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min. 8 chars, uppercase, number, symbol"
                  className={`${inputCls(!!fieldErrors.password)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[12px] text-red-500">{fieldErrors.password}</p>}
            </div>

            {/* server error */}
            {error && (
              <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 leading-snug">
                {error}
              </p>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-55 text-white text-[15px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating account…</span></>
                : "Create account"}
            </button>

            <p className="text-center text-[12px] text-[#9CA3AF] leading-relaxed px-2">
              By continuing you agree to our{" "}
              <Link href="/terms" className="text-[#6B7280] hover:text-[#374151] underline underline-offset-2 transition-colors">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-[#6B7280] hover:text-[#374151] underline underline-offset-2 transition-colors">Privacy Policy</Link>.
            </p>
          </form>

          {/* divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[12px] text-[#9CA3AF]">Already have an account?</span>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="flex items-center justify-center w-full h-[42px] border border-[#D1D5DB] hover:border-[#9CA3AF] text-[14px] font-medium text-[#374151] rounded-lg transition-colors"
          >
            Sign in instead
          </Link>
        </div>
      </div>

      {/* footer */}
      <footer className="py-5 px-8">
        <p className="text-center text-[12px] text-[#9CA3AF]">
          &copy; 2026 FarmFresh &middot;{" "}
          <Link href="/privacy" className="hover:text-[#6B7280] transition-colors">Privacy</Link>
          {" "}&middot;{" "}
          <Link href="/terms" className="hover:text-[#6B7280] transition-colors">Terms</Link>
          {" "}&middot;{" "}
          <Link href="/help" className="hover:text-[#6B7280] transition-colors">Help</Link>
        </p>
      </footer>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    "block w-full h-[46px] rounded-lg border px-3.5 text-[15px] text-[#111827]",
    "placeholder-[#9CA3AF] bg-white",
    "focus:outline-none focus:ring-1 transition-[border-color,box-shadow]",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
      : "border-[#D1D5DB] focus:border-green-500 focus:ring-green-500/20",
  ].join(" ");
}
