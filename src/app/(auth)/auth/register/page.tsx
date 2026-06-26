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

type FieldErrors = {
  firstName?: string; lastName?: string;
  email?: string; phone?: string;
  password?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
  });
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

  const fieldClass = (field: keyof FieldErrors) =>
    `h-10 bg-slate-50 border-slate-200 focus-visible:ring-green-500/30 focus-visible:border-green-400 ${
      fieldErrors[field] ? "border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-400" : ""
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Left — farm photo */}
      <div className="hidden lg:block relative w-1/2">
        <Image
          src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80"
          alt="Fresh vegetables"
          fill
          className="object-cover"
          priority
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
                <span key={tag} className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs text-white/90 border border-white/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} FarmFresh. All rights reserved.</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-6 bg-[#F8FAFC] overflow-y-auto">
        <div className="w-full max-w-sm space-y-5">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-slate-900 text-lg">FarmFresh</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Create your account</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in your details to get started.</p>
          </div>

          <Card className="shadow-sm border border-slate-100 bg-white">
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} noValidate className="space-y-3">

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">First name <span className="text-red-500">*</span></Label>
                    <Input value={form.firstName} onChange={set("firstName")} placeholder="Priya" className={fieldClass("firstName")} />
                    {fieldErrors.firstName && <p className="text-[11px] text-red-500">{fieldErrors.firstName}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Last name <span className="text-red-500">*</span></Label>
                    <Input value={form.lastName} onChange={set("lastName")} placeholder="Sharma" className={fieldClass("lastName")} />
                    {fieldErrors.lastName && <p className="text-[11px] text-red-500">{fieldErrors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Email address <span className="text-red-500">*</span></Label>
                  <Input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={fieldClass("email")} />
                  {fieldErrors.email && <p className="text-[11px] text-red-500">{fieldErrors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Phone number <span className="text-red-500">*</span></Label>
                  <Input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className={fieldClass("phone")} />
                  {fieldErrors.phone && <p className="text-[11px] text-red-500">{fieldErrors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
                      placeholder="Min. 8 chars, uppercase, number, symbol" className={`${fieldClass("password")} pr-10`} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-[11px] text-red-500">{fieldErrors.password}</p>}
                </div>


{error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
                )}

                <Button type="submit" disabled={loading}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors cursor-pointer">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create account"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
