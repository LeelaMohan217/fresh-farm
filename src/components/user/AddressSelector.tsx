"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin, ChevronDown, Home, Briefcase, MoreHorizontal, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type Address = {
  id: string;
  type: string;
  address: string;
  pincode: string;
  is_default: boolean;
};

const TYPE_ICON: Record<string, React.ElementType> = {
  Home: Home,
  Work: Briefcase,
  Others: MoreHorizontal,
};

export default function AddressSelector() {
  const { user } = useAuth();
  const [addresses, setAddresses]   = useState<Address[]>([]);
  const [selected, setSelected]     = useState<Address | null>(null);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchAddresses = (currentSelected?: Address | null) => {
    if (!user) { setAddresses([]); setSelected(null); return; }
    setLoading(true);
    fetch("/api/auth/me/addresses")
      .then((r) => r.json())
      .then((data: Address[]) => {
        if (!Array.isArray(data)) return;
        setAddresses(data);
        // Keep existing selection if still valid, otherwise default
        const stillValid = currentSelected && data.find((a) => a.id === currentSelected.id);
        setSelected(stillValid ?? data.find((a) => a.is_default) ?? data[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Fetch on login/logout
  useEffect(() => {
    if (!user) { setAddresses([]); setSelected(null); return; }
    fetchAddresses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Refetch every time the dropdown opens (catches addresses added elsewhere)
  useEffect(() => {
    if (open && user) fetchAddresses(selected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const select = (addr: Address) => {
    setSelected(addr);
    setOpen(false);
  };

  const Icon = selected ? (TYPE_ICON[selected.type] ?? MapPin) : MapPin;

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150 max-w-[180px] group cursor-pointer",
          open
            ? "border-green-400 bg-green-50"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
        ) : (
          <Icon className={cn("w-4 h-4 shrink-0", selected ? "text-green-600" : "text-slate-400")} />
        )}

        <div className="flex-1 min-w-0 text-left">
          {selected ? (
            <>
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide leading-none mb-0.5">
                {selected.type}
              </p>
              <p className="text-xs text-slate-600 truncate leading-tight max-w-[110px]">
                {selected.address}
              </p>
            </>
          ) : user ? (
            <p className="text-xs font-medium text-slate-500">Add address</p>
          ) : (
            <p className="text-xs font-medium text-slate-500">Select location</p>
          )}
        </div>

        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
            </div>
          ) : !user ? (
            /* Not logged in */
            <div className="p-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Set your delivery address</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Login to save your addresses and get products delivered faster.
              </p>
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="block w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors text-center"
              >
                Login / Register
              </Link>
            </div>
          ) : addresses.length === 0 ? (
            /* Logged in but no addresses */
            <div className="p-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No saved addresses</p>
              <p className="text-xs text-slate-400">Add an address to get started.</p>
              <Link
                href="/account/addresses"
                onClick={() => setOpen(false)}
                className="block w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors text-center"
              >
                Add Address
              </Link>
            </div>
          ) : (
            /* Address list */
            <>
              <div className="px-4 pt-3 pb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deliver to</p>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {addresses.map((addr) => {
                  const AddrIcon = TYPE_ICON[addr.type] ?? MapPin;
                  const isActive = selected?.id === addr.id;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => select(addr)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 transition-colors text-left",
                        isActive ? "bg-green-50" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        isActive ? "bg-green-100" : "bg-slate-100"
                      )}>
                        <AddrIcon className={cn("w-4 h-4", isActive ? "text-green-600" : "text-slate-500")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-xs font-bold uppercase tracking-wide",
                            isActive ? "text-green-600" : "text-slate-700"
                          )}>
                            {addr.type}
                          </p>
                          {addr.is_default && (
                            <span className="text-[9px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {addr.address}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Pincode: {addr.pincode}</p>
                      </div>
                      {isActive && (
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-1">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Add new */}
              <div className="border-t border-slate-100 p-3">
                <Link
                  href="/account/addresses"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center shrink-0 transition-colors">
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-green-600">Add new address</p>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
