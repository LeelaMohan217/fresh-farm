"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sprout, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  const fieldClass = (field: keyof FieldErrors) =>
    `h-10 bg-slate-50 border-slate-200 focus-visible:ring-green-500/30 focus-visible:border-green-400 ${
      fieldErrors[field] ? "border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-400" : ""
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Left — farm photo */}
      <div className="hidden lg:block relative w-1/2">
        <Image
          src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1200&q=80"
          alt="Fresh farm produce"
          fill className="object-cover" priority
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
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} FarmFresh. All rights reserved.</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-6 bg-[#F8FAFC]">
        <div className="w-full max-w-sm space-y-5">

          <div className="flex lg:hidden items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-slate-900 text-lg">FarmFresh</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-0.5">Sign in to your account</p>
          </div>

          <Card className="shadow-sm border border-slate-100 bg-white">
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email address <span className="text-red-500">*</span></Label>
                  <Input
                    id="email" type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set("email")}
                    className={fieldClass("email")}
                  />
                  {fieldErrors.email && <p className="text-[11px] text-red-500">{fieldErrors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password" type={showPw ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={set("password")}
                      className={`${fieldClass("password")} pr-10`}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-[11px] text-red-500">{fieldErrors.password}</p>}
                </div>

                <div className="flex justify-end">
                  <Link href="/auth/forgot-password" className="text-xs text-green-600 hover:text-green-700 font-medium">
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
                )}

                <Button type="submit" disabled={loading}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors cursor-pointer">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-500">
            New to FarmFresh?{" "}
            <Link href="/auth/register" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
