"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type FieldErrors = { email?: string; password?: string };

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm]               = useState({ email: "", password: "" });
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
    if (!form.email.trim()) errs.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = "That email address isn't valid.";
    if (!form.password) errs.password = "Enter your password.";
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
      if (!res.ok) { setError(data.error ?? "Couldn't sign you in. Please try again."); return; }
      await refresh();
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white sm:bg-[#F7F8FA] flex flex-col">

      {/* top bar — only visible on desktop */}
      <div className="hidden sm:flex items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Sprout className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-slate-900">FarmFresh</span>
        </Link>
        <Link href="/auth/register"
          className="text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
          Create account
        </Link>
      </div>

      {/* center card */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-8">
        <div className="w-full sm:max-w-[400px] bg-white sm:border sm:border-[#E5E7EB] sm:rounded-2xl sm:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.04)] px-6 sm:px-10 pt-10 sm:pt-10 pb-10">

          {/* brand mark */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center mb-4">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.3px]">Sign in</h1>
            <p className="text-[14px] text-[#6B7280] mt-1">Use your FarmFresh account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-medium text-[#374151]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className={inputCls(!!fieldErrors.email)}
              />
              {fieldErrors.email && <p className="text-[12px] text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[13px] font-medium text-[#374151]">
                  Password
                </label>
                <Link href="/auth/forgot-password"
                  className="text-[13px] text-green-600 hover:text-green-700 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••"
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
              {fieldErrors.password && <p className="text-[12px] text-red-500 mt-1">{fieldErrors.password}</p>}
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
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in…</span></>
                : "Sign in"}
            </button>
          </form>

          {/* divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[12px] text-[#9CA3AF]">New to FarmFresh?</span>
            </div>
          </div>

          <Link
            href="/auth/register"
            className="flex items-center justify-center w-full h-[42px] border border-[#D1D5DB] hover:border-[#9CA3AF] text-[14px] font-medium text-[#374151] rounded-lg transition-colors"
          >
            Create account
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
