"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react"; // used in Sidebar shell
import {
  LayoutDashboard, ShoppingBasket, ShoppingCart, PackageSearch,
  Wrench, Users, Leaf, ShieldCheck, GitBranch,
  ChevronDown, ChevronLeft, ChevronRight, LogOut, Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

type NavChild = { label: string; href: string };
type NavItem  = { label: string; icon: React.ElementType; href: string; children?: NavChild[] };
type NavSection = { section: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    ],
  },
  {
    section: "Commerce",
    items: [
      {
        label: "Products", icon: ShoppingBasket, href: "/admin/products",
        children: [
          { label: "All Products", href: "/admin/products" },
          { label: "Add Product",  href: "/admin/products/new" },
          { label: "Categories",   href: "/admin/products/categories" },
        ],
      },
      {
        label: "Orders", icon: ShoppingCart, href: "/admin/orders",
        children: [
          { label: "Regular Orders", href: "/admin/orders" },
          { label: "Bulk Orders",    href: "/admin/orders/bulk" },
        ],
      },
      // {
      //   label: "Bulk Orders", icon: PackageSearch, href: "/admin/bulk-orders",
      //   children: [
      //     { label: "All Requests", href: "/admin/bulk-orders" },
      //     { label: "Weddings",     href: "/admin/bulk-orders/weddings" },
      //     { label: "Events",       href: "/admin/bulk-orders/events" },
      //   ],
      // },
    ],
  },
  {
    section: "Business",
    items: [
      {
        label: "Services", icon: Wrench, href: "/admin/services",
        children: [
          { label: "All Services",  href: "/admin/services" },
          { label: "Installations", href: "/admin/services/installations" },
          { label: "Bookings",      href: "/admin/services/bookings" },
        ],
      },
      { label: "Customers", icon: Users, href: "/admin/customers" },
    ],
  },
  {
    section: "Content",
    items: [
      {
        label: "Farm Showcase", icon: Leaf, href: "/admin/showcase",
        children: [
          { label: "Photos & Stories", href: "/admin/showcase" },
          { label: "Add Content",      href: "/admin/showcase/new" },
        ],
      },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Admin Accounts", icon: ShieldCheck, href: "/admin/admins" },
      { label: "Branches",       icon: GitBranch,   href: "/admin/branches" },
    ],
  },
];

/* ─── Sub-menu link ─── */
function SubMenuLink({ href, label }: NavChild) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "flex items-center px-3 py-2 rounded-lg text-xs font-medium",
        "transition-colors duration-150",
        active
          ? "text-green-700 bg-green-50"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
      )}
    >
      {label}
    </Link>
  );
}

/* ─── Sub-menu animated container ─── */
function SubMenu({ children, open }: { children: NavChild[]; open: boolean }) {
  return (
    <div className={cn(
      "grid transition-[grid-template-rows] duration-300 ease-in-out",
      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
    )}>
      <div className="overflow-hidden">
        <div className="ml-10 mt-1 mb-1.5 pl-2 border-l border-slate-100 space-y-0.5">
          {children.map((c) => <SubMenuLink key={c.href} {...c} />)}
        </div>
      </div>
    </div>
  );
}

/* ─── Nav row ─── */
function NavRow({ item, isOpen, onToggle }: {
  item: NavItem;
  isOpen: boolean;
  onToggle: (label: string) => void;
}) {
  const pathname  = usePathname();
  const { collapsed } = useSidebar();

  const isActive    = pathname === item.href;
  const childActive = item.children?.some((c) => pathname === c.href) ?? false;
  const highlighted = isActive || childActive;
  const Icon = item.icon;

  const rowClass = cn(
    "group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
    "transition-all duration-150 cursor-pointer select-none",
    highlighted
      ? "text-slate-900 bg-slate-100 font-semibold"
      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium"
  );

  const iconBox = (
    <div className={cn(
      "shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150",
      highlighted
        ? "bg-green-100 text-green-600"
        : "bg-slate-100 text-slate-400 group-hover:text-slate-600"
    )}>
      <Icon className="w-3.75 h-3.75" />
    </div>
  );

  const activeBar = highlighted && (
    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-green-500 rounded-full" />
  );

  if (collapsed) {
    return (
      <Link href={item.href} title={item.label} prefetch={false} className={rowClass}>
        {activeBar}
        {iconBox}
      </Link>
    );
  }

  if (item.children) {
    return (
      <div>
        <button onClick={() => onToggle(item.label)} className={rowClass}>
          {activeBar}
          {iconBox}
          <span className="flex-1 text-left leading-none">{item.label}</span>
          <ChevronDown className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-300 text-slate-400",
            isOpen ? "rotate-180" : "rotate-0"
          )} />
        </button>
        <SubMenu children={item.children} open={isOpen} />
      </div>
    );
  }

  return (
    <Link href={item.href} prefetch={false} className={rowClass}>
      {activeBar}
      {iconBox}
      <span className="leading-none">{item.label}</span>
    </Link>
  );
}

/* ─── Sidebar shell ─── */
export default function Sidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { collapsed, toggle } = useSidebar();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleToggle = (label: string) =>
    setOpenMenu((prev) => (prev === label ? null : label));

  const visibleSections = isSuperAdmin
    ? NAV_SECTIONS
    : NAV_SECTIONS.map((s) =>
        s.section === "System"
          ? { ...s, items: s.items.filter((i) => i.label !== "Admin Accounts" && i.label !== "Branches") }
          : s
      ).filter((s) => s.items.length > 0);

  return (
    <aside className={cn(
      "relative flex flex-col h-screen shrink-0",
      "bg-white",
      "border-r border-slate-100",
      "transition-[width] duration-300 ease-in-out",
      collapsed ? "w-16" : "w-60"
    )}>

      {/* ── Toggle button — right edge, half-on-half ── */}
      <button
        onClick={toggle}
        title={collapsed ? "Expand" : "Collapse"}
        className={cn(
          "absolute top-7 -translate-y-1/2 right-0 translate-x-1/2 z-50",
          "w-5 h-5 rounded-full flex items-center justify-center",
          "bg-white",
          "border border-slate-200",
          "text-slate-400",
          "hover:text-slate-700",
          "shadow-sm hover:shadow transition-all duration-200"
        )}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </button>

      {/* ── Logo ── */}
      <div className="flex items-center h-14 px-4 gap-3 border-b border-slate-100">
        <div className="shrink-0 w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
          <Sprout className="w-4 h-4 text-white" />
        </div>
        <div className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-300",
          collapsed ? "max-w-0 opacity-0" : "max-w-xs opacity-100"
        )}>
          <p className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
            FarmFresh
          </p>
          <p className="text-[10px] font-medium text-slate-400 leading-tight tracking-widest uppercase">
            Admin
          </p>
        </div>
      </div>

      {/* ── Nav — scrollbar hidden, fade at bottom signals more content ── */}
      <div className="relative flex-1 min-h-0">
        {/* Bottom fade gradient */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 z-10 bg-linear-to-t from-white via-white/70 to-transparent" />

        <nav className="h-full overflow-y-auto overflow-x-hidden scrollbar-none py-4 px-2 space-y-5">
          {visibleSections.map(({ section, items }) => (
            <div key={section}>
              {!collapsed ? (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                  {section}
                </p>
              ) : (
                <div className="mb-2 mx-auto w-5 h-px bg-slate-100" />
              )}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavRow
                    key={item.label}
                    item={item}
                    isOpen={openMenu === item.label}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* ── Logout ── */}
      <div className="px-2 pb-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => router.push("/admin/login")}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
            "text-slate-500",
            "hover:text-red-600",
            "hover:bg-red-50",
            "transition-all duration-150",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-3.75 h-3.75 shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5" />
          {!collapsed && <span className="leading-none">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
