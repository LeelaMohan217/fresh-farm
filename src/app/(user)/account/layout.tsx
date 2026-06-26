"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, MapPin, ShoppingBag, Settings, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account/profile",   icon: User,        label: "My Profile",       desc: "Name, email, phone" },
  { href: "/account/orders",    icon: ShoppingBag, label: "My Orders",        desc: "Track & view orders" },
  { href: "/account/addresses", icon: MapPin,      label: "Saved Addresses",  desc: "Manage delivery addresses" },
  { href: "/account/settings",  icon: Settings,    label: "Account Settings", desc: "Password & preferences" },
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">My Account</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your profile, orders and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

              {/* Avatar card */}
              {user && (
                <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-base font-bold shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Nav items */}
              <nav className="p-2">
                {NAV.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href;
                  return (
                    <Link key={href} href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                        active
                          ? "bg-green-50 text-green-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        active ? "bg-green-100" : "bg-slate-100 group-hover:bg-slate-200"
                      )}>
                        <Icon className={cn("w-4 h-4", active ? "text-green-600" : "text-slate-500")} />
                      </div>
                      <span className="text-sm font-medium flex-1">{label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-green-400" />}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-2 border-t border-slate-100">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile nav — horizontal scroll */}
            <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-none mt-4">
              {NAV.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                      active
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-green-300"
                    )}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                );
              })}
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0">{children}</main>

        </div>
      </div>
    </div>
  );
}
