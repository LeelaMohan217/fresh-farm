"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart, Sprout, LogOut, ChevronDown,
  X, Search, TrendingUp, Tag, ArrowRight,
  User, MapPin, ShoppingBag, Settings,
} from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import AddressSelector from "@/components/user/AddressSelector";

type SearchProduct  = { id: number; name: string; price: number; unit: string; stock: number; imageUrl: string | null; categoryName: string; categorySlug: string };
type SearchCategory = { id: number; name: string; slug: string };
type SearchData     = { trending: string[]; suggestions: string[]; categories: SearchCategory[]; products: SearchProduct[] };

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const CATEGORY_EMOJI: Record<string, string> = {
  vegetables: "🥬", fruits: "🍓", herbs: "🌿", equipment: "⚙️", nutrients: "🧪",
};

function SearchBar({ onClose }: { onClose?: () => void }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [query, setQuery]   = useState("");
  const [data, setData]     = useState<SearchData>({ trending: [], suggestions: [], categories: [], products: [] });
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery("");
    setData({ trending: [], suggestions: [], categories: [], products: [] });
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/products/search?q=")
      .then((r) => r.json())
      .then((d: SearchData) => setData((prev) => ({ ...prev, trending: d.trending ?? [] })))
      .catch(() => {});
  }, []);

  const fetchSearch = useCallback((q: string) => {
    setLoading(true);
    fetch(`/api/products/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d: SearchData) => { setData(d); setOpen(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v.trim()) { setData((prev) => ({ ...prev, suggestions: [], categories: [], products: [] })); return; }
    debounceRef.current = setTimeout(() => fetchSearch(v), 250);
  };

  const navigate = useCallback((term: string, log = false) => {
    setOpen(false);
    onClose?.();
    if (log) fetch(`/api/products/search?q=${encodeURIComponent(term)}&log=1`).catch(() => {});
    router.push(`/shop?q=${encodeURIComponent(term.trim())}`);
  }, [router, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(query.trim(), true);
  };

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const hasResults = data.suggestions.length > 0 || data.categories.length > 0 || data.products.length > 0;
  const showEmpty  = open && !query.trim() && data.trending.length > 0;
  const showNoResult = open && query.trim() && !loading && !hasResults;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder="Search for products, categories..."
          className="w-full h-10 pl-9 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
        />
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        ) : query && (
          <button type="button" onClick={() => { setQuery(""); setData((d) => ({ ...d, suggestions: [], categories: [], products: [] })); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[480px] overflow-y-auto">
          {showEmpty && (
            <div className="p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                <TrendingUp className="w-3.5 h-3.5" /> Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {data.trending.map((t) => (
                  <button key={t} onClick={() => { setQuery(t); navigate(t, true); }}
                    className="text-sm text-slate-700 bg-slate-100 hover:bg-green-50 hover:text-green-700 px-3 py-1.5 rounded-full transition-colors font-medium capitalize"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {data.suggestions.length > 0 && (
            <div className="pt-2">
              {data.suggestions.map((s) => (
                <button key={s} onClick={() => { setQuery(s); navigate(s, true); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group"
                >
                  <Search className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-green-500 transition-colors" />
                  <span className="text-sm text-slate-700 flex-1">
                    <span className="font-bold">{s.slice(0, query.length)}</span>
                    {s.slice(query.length)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-green-500 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {data.categories.length > 0 && (
            <div className={data.suggestions.length > 0 ? "border-t border-slate-50 pt-2" : "pt-2"}>
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 pb-1.5">
                <Tag className="w-3 h-3" /> Categories
              </p>
              {data.categories.map((c) => (
                <button key={c.id} onClick={() => navigate(c.name, true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-lg w-8 text-center shrink-0">{CATEGORY_EMOJI[c.slug] ?? "🌱"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">Browse all {c.name.toLowerCase()}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {data.products.length > 0 && (
            <div className="border-t border-slate-50 pt-2">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 pb-1.5">
                Products
              </p>
              {data.products.map((p) => (
                <button key={p.id} onClick={() => { setQuery(p.name); navigate(p.name, true); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors text-left group"
                >
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                    {p.imageUrl
                      ? <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                      : <span className="absolute inset-0 flex items-center justify-center text-lg">{CATEGORY_EMOJI[p.categorySlug] ?? "🌱"}</span>
                    }
                    {p.stock === 0 && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-slate-500 text-center leading-tight">Out of<br/>stock</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${p.stock === 0 ? "text-slate-400" : "text-slate-900"}`}>{p.name}</p>
                    <p className="text-xs text-slate-400">{p.categoryName}</p>
                  </div>
                  {p.stock > 0
                    ? <p className="text-sm font-bold text-green-600 shrink-0">₹{p.price}<span className="text-xs font-normal text-slate-400">/{p.unit}</span></p>
                    : <span className="text-[11px] font-semibold text-slate-400 shrink-0">OOS</span>
                  }
                </button>
              ))}
            </div>
          )}

          {query.trim() && hasResults && (
            <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60">
              <button onClick={() => navigate(query.trim(), true)}
                className="flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors w-full"
              >
                <Search className="w-4 h-4" />
                See all results for <span className="text-slate-900">&ldquo;{query}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </button>
            </div>
          )}

          {showNoResult && (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm font-semibold text-slate-700">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try a different keyword or browse categories</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { count } = useCart();
  const { user, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);

  const showSearch =
    pathname === "/" ||
    pathname.startsWith("/shop") ||
    pathname === "/showcase" ||
    pathname.startsWith("/services");

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 bg-white transition-shadow duration-200",
      scrolled ? "shadow-sm border-b border-slate-100" : "border-b border-slate-100"
    )}>

      {/* ── MOBILE layout (hidden on md+) ── */}
      <div className="md:hidden">
        {/* Row 1: Logo | Address | Cart + Profile */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <Sprout className="w-4 h-4 text-white" />
            </div>
          </Link>

          {/* Address selector — takes remaining space */}
          <div className="flex-1 min-w-0">
            <AddressSelector />
          </div>

          {/* Cart */}
          <Link href="/cart"
            className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-600 shrink-0"
          >
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {/* Profile / Auth */}
          {user ? (
            <Link
              href="/account"
              className="w-9 h-9 bg-green-600 text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            >
              {getInitials(user.name)}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 shrink-0"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* Row 2: Search — only on discovery pages (home, shop, showcase, services) */}
        {showSearch && (
          <div className="px-3 pb-3">
            <SearchBar />
          </div>
        )}
      </div>

      {/* ── DESKTOP layout (hidden on mobile) ── */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight leading-none block">FarmFresh</span>
              <span className="text-[10px] text-slate-400 leading-none tracking-wide">Organic &amp; Hydroponic</span>
            </div>
          </Link>

          <div className="shrink-0"><AddressSelector /></div>
          <div className="w-0.5 h-6 bg-slate-200 rounded-full shrink-0" />
          <div className="flex-1"><SearchBar /></div>
          <div className="w-0.5 h-6 bg-slate-200 rounded-full shrink-0" />

          <div className="flex items-center gap-4">
            {/* Auth — desktop */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-none">{user.name.split(" ")[0]}</p>
                    <p className="text-[10px] text-slate-400 leading-none mt-0.5 max-w-[80px] truncate">{user.email}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  {[
                    { href: "/account/profile",   icon: User,        label: "My Profile"       },
                    { href: "/account/orders",     icon: ShoppingBag, label: "My Orders"        },
                    { href: "/account/addresses",  icon: MapPin,      label: "Saved Addresses"  },
                    { href: "/account/settings",   icon: Settings,    label: "Account Settings" },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link key={href} href={href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-green-700 transition-colors group/item"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover/item:bg-green-100 flex items-center justify-center shrink-0 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-green-600 transition-colors" />
                      </div>
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                      </div>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Login</Link>
                <Link href="/auth/register" className="px-4 py-1.5 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">Register</Link>
              </div>
            )}

            {/* Cart */}
            <Link href="/cart"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 text-slate-600 hover:text-green-700 transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

    </header>
  );
}
