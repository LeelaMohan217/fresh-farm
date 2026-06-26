"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Sprout } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Invalid email or password."); return; }
      router.push("/admin/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — farm photo */}
      <div className="hidden lg:block relative w-1/2">
        <Image
          src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80"
          alt="Organic farm"
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
              <p className="text-xs text-white/70">Admin Panel</p>
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-snug drop-shadow">
              Grow smarter,<br />sell fresher.
            </h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              Manage your organic products, hydroponic installations, bulk orders, and farm showcase — all from one place.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["Organic Vegetables", "Hydroponic Towers", "Aeroponic Systems", "Bulk Orders", "Installations"].map((tag) => (
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
            <p className="font-bold text-slate-900 text-lg">FarmFresh Admin</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-0.5">Sign in to your admin account</p>
          </div>

          <Card className="shadow-sm border border-slate-100 bg-white">
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email address</Label>
                  <Input
                    id="email" type="email" required
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-10 bg-slate-50 border-slate-200 focus-visible:ring-green-500/30 focus-visible:border-green-400"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password" type={showPassword ? "text" : "password"} required
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="h-10 pr-10 bg-slate-50 border-slate-200 focus-visible:ring-green-500/30 focus-visible:border-green-400"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rememberMe"
                      checked={form.rememberMe}
                      onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                    />
                    <Label htmlFor="rememberMe" className="text-xs font-medium text-slate-600 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link href="/admin/password-reset/request" className="text-xs text-green-600 hover:text-green-700 font-medium">
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

        </div>
      </div>
    </div>
  );
}
