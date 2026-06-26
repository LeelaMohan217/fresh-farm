"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, MapPin, ShoppingBag, Settings, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/account/profile",   icon: User,        label: "My Profile",       desc: "Name, email, phone"        },
  { href: "/account/orders",    icon: ShoppingBag, label: "My Orders",        desc: "Track & view your orders"  },
  { href: "/account/addresses", icon: MapPin,      label: "Address Book",     desc: "Manage delivery addresses" },
  { href: "/account/settings",  icon: Settings,    label: "Account Settings", desc: "Password & preferences"    },
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function AccountOverviewPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="space-y-3">

      {/* User card */}
      {user && (
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-[13px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
      )}

      {/* Nav items */}
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
        {NAV.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-green-100 flex items-center justify-center shrink-0 transition-colors">
              <Icon className="w-5 h-5 text-slate-500 group-hover:text-green-600 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-slate-900">{label}</p>
              <p className="text-[12px] text-slate-400 mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-500 transition-colors" />
          </div>
          <span className="text-[14px] font-semibold text-slate-700 group-hover:text-red-600 transition-colors">Logout</span>
        </button>
      </div>

    </div>
  );
}
