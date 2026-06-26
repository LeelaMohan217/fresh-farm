"use client";

import {
  Bell,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  User,
  ShoppingCart,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: string;
} | null;

type Notification = {
  id: number;
  type: "order" | "low_stock";
  order_id: string | null;
  product_id: number | null;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

function useBreadcrumb() {
  const pathname = usePathname();
  return pathname
    .split("/")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ROLE_COLOR: Record<string, string> = {
  superadmin: "bg-purple-500",
  admin: "bg-green-500",
};

export default function TopBar() {
  const router = useRouter();
  const crumbs = useBreadcrumb();
  const [admin, setAdmin] = useState<AdminSession>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setAdmin(data); })
      .catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/notifications");
      if (!r.ok) return;
      const data = await r.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {}
  }, []);

  // Initial fetch + poll every 30 s
  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await fetch("/api/admin/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = (n: Notification) => {
    setNotifOpen(false);
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
    }
    if (n.type === "low_stock") router.push("/admin/products");
    else if (n.order_id) router.push(`/admin/orders/${n.order_id}`);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 shrink-0 bg-white border-b border-slate-100">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
            <span
              className={
                i === crumbs.length - 1
                  ? "font-semibold text-slate-800"
                  : "text-slate-400 text-xs"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Notification bell */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150 border-0 bg-transparent cursor-pointer outline-none">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-slate-400">{unreadCount} unread</p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-green-600 hover:text-green-700 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors duration-150 ${
                      !n.read
                        ? n.type === "low_stock" ? "bg-amber-50/60" : "bg-green-50/60"
                        : ""
                    }`}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      n.type === "low_stock"
                        ? (!n.read ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400")
                        : (!n.read ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400")
                    }`}>
                      {n.type === "low_stock"
                        ? <AlertTriangle className="w-3.5 h-3.5" />
                        : <ShoppingCart className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs leading-tight ${!n.read ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.body}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-slate-100 mx-1" />

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-lg cursor-pointer bg-transparent border-0 outline-none hover:bg-slate-50 transition-colors duration-150">
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {admin?.name ?? "Loading..."}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {admin?.email ?? ""}
              </p>
            </div>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold tracking-wide">
                {admin ? getInitials(admin.name) : "?"}
              </div>
              {admin && (
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${ROLE_COLOR[admin.role] ?? "bg-slate-400"}`}
                />
              )}
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-0 overflow-hidden">
            <div className="bg-linear-to-br from-slate-900 to-slate-800 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white text-sm font-bold">
                    {admin ? getInitials(admin.name) : "?"}
                  </div>
                  {admin && (
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${ROLE_COLOR[admin.role] ?? "bg-slate-400"}`}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {admin?.name ?? "Admin"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {admin?.email ?? ""}
                  </p>
                  <span
                    className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold capitalize
                    ${admin?.role === "superadmin" ? "bg-purple-500/20 text-purple-300" : "bg-green-500/20 text-green-400"}`}
                  >
                    {admin?.role ?? "admin"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              <DropdownMenuItem
                onClick={() => router.push("/admin/dashboard")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/admin/profile")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                Profile
              </DropdownMenuItem>
              {admin?.role === "superadmin" && (
                <DropdownMenuItem
                  onClick={() => router.push("/admin/admins")}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Admin Accounts
                </DropdownMenuItem>
              )}
            </div>

            <DropdownMenuSeparator className="my-0" />

            <div className="p-1.5">
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-500 cursor-pointer focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
