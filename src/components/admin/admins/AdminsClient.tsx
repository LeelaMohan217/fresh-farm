"use client";

import { useState, useMemo, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Plus, Loader2, Trash2, Eye, EyeOff,
  CheckCircle2, AlertCircle, UserCog, Search, X,
  MapPin, Phone, Pencil, Filter, RotateCcw, Users,
  Mail, Calendar, Building2, PhoneCall, ChevronDown,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Admin = {
  id: string; name: string; email: string;
  role: string; branchId: number | null; branch: string | null;
  phone: string | null; secondaryPhone: string | null; createdAt: string;
};

type BranchOption = { id: number; name: string };

const ROLE_STYLE: Record<string, string> = {
  superadmin: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60",
  admin:      "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
};

const INPUT_CLASS = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all";

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-green-100 text-green-700", "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

type FormState = { name: string; email: string; password: string; role: string; branchId: string; phone: string; secondaryPhone: string };
type EditFormState = { name: string; email: string; role: string; branchId: string; phone: string; secondaryPhone: string };

const emptyForm: FormState = { name: "", email: "", password: "", role: "admin", branchId: "", phone: "", secondaryPhone: "" };

function BranchDropdown({ value, onChange, branches, placeholder = "— Select branch —" }: {
  value: string;
  onChange: (val: string) => void;
  branches: BranchOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = branches.find((b) => String(b.id) === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full h-9 px-3 text-sm bg-slate-50 border rounded-lg flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
          open ? "border-green-400 ring-2 ring-green-500/20" : "border-slate-200 hover:border-slate-300"
        } ${selected ? "text-slate-800" : "text-slate-400"}`}
      >
        <span className="flex items-center gap-2">
          {selected && <Building2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {placeholder && (
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              className={`w-full px-3 py-2.5 text-sm text-left transition-colors ${!value ? "bg-green-50 text-green-700 font-medium" : "text-slate-400 hover:bg-slate-50"}`}
            >
              {placeholder}
            </button>
          )}
          {branches.map((b) => (
            <button key={b.id} type="button"
              onClick={() => { onChange(String(b.id)); setOpen(false); }}
              className={`w-full px-3 py-2.5 text-sm text-left flex items-center gap-2.5 transition-colors ${
                String(b.id) === value ? "bg-green-50 text-green-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 shrink-0 ${String(b.id) === value ? "text-green-500" : "text-slate-400"}`} />
              {b.name}
              {String(b.id) === value && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminsClient({
  admins: initial, branches, currentAdminId, currentAdminRole,
}: {
  admins: Admin[]; branches: BranchOption[]; currentAdminId: string; currentAdminRole: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [admins, setAdmins]             = useState(initial);
  const [search, setSearch]             = useState("");
  const [filterRoles, setFilterRoles]   = useState<string[]>([]);
  const [filterBranches, setFilterBranches] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles]   = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [showFilter, setShowFilter]     = useState(false);
  const [roleOpen, setRoleOpen]         = useState(true);
  const [branchOpen, setBranchOpen]     = useState(true);
  const filterRef = useRef<HTMLDivElement>(null);

  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [deleteError, setDeleteError]   = useState<Record<string, string>>({});
  const [confirmTarget, setConfirmTarget] = useState<Admin | null>(null);

  // Modals
  const [showCreate, setShowCreate]     = useState(false);
  const [viewAdmin, setViewAdmin]       = useState<Admin | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [showPw, setShowPw]             = useState(false);

  // Form states
  const [form, setForm]       = useState<FormState>(emptyForm);
  const [editForm, setEditForm] = useState<EditFormState>({ name: "", email: "", role: "", branchId: "", phone: "", secondaryPhone: "" });

  const [adding, setAdding]   = useState(false);
  const [editing, setEditing] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError]     = useState("");
  const [toast, setToast]     = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilter(false);
    };
    if (showFilter) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilter]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));
  const setEdit = (k: keyof EditFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm((p) => ({ ...p, [k]: e.target.value }));

  const filtered = useMemo(() => {
    let r = admins;
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter((a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)); }
    if (filterRoles.length > 0) r = r.filter((a) => filterRoles.includes(a.role));
    if (filterBranches.length > 0) r = r.filter((a) => a.branch && filterBranches.includes(a.branch));
    return r;
  }, [admins, search, filterRoles, filterBranches]);

  const uniqueBranches = useMemo(() => {
    const s = new Set(admins.map((a) => a.branch).filter((b): b is string => b !== null));
    return Array.from(s).sort();
  }, [admins]);

  /* ── Create ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!form.name.trim()) { setCreateError("Full name is required."); return; }
    if (!form.email.trim()) { setCreateError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setCreateError("Enter a valid email address."); return; }
    if (!form.password) { setCreateError("Password is required."); return; }
    if (form.password.length < 6) { setCreateError("Password must be at least 6 characters."); return; }
    if (form.role === "admin" && !form.branchId) { setCreateError("Please assign a branch for this admin."); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, password: form.password,
          role: form.role, branchId: form.branchId ? Number(form.branchId) : null,
          phone: form.phone || null, secondaryPhone: form.secondaryPhone || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? "Something went wrong."); return; }
      setAdmins((prev) => [...prev, {
        id: data.admin.id, name: data.admin.name, email: data.admin.email,
        role: data.admin.role, branchId: data.admin.branch_id ?? null,
        branch: data.admin.branch_name ?? null, phone: data.admin.phone ?? null,
        secondaryPhone: data.admin.secondary_phone ?? null,
        createdAt: new Date(data.admin.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      }]);
      setForm(emptyForm);
      setShowCreate(false);
      setCreateError("");
      setToast({ type: "success", message: `Admin "${data.admin.name}" created successfully!` });
      setTimeout(() => setToast(null), 3000);
      startTransition(() => router.refresh());
    } catch { setCreateError("Something went wrong. Please try again."); }
    finally { setAdding(false); }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    const admin = confirmTarget;
    if (!admin) return;
    setConfirmTarget(null);
    setDeletingId(admin.id);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id }),
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError((p) => ({ ...p, [admin.id]: data.error })); return; }
      setAdmins((p) => p.filter((a) => a.id !== admin.id));
      startTransition(() => router.refresh());
    } catch { setDeleteError((p) => ({ ...p, [admin.id]: "Delete failed." })); }
    finally { setDeletingId(null); }
  };

  /* ── Edit ── */
  const handleEditClick = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditForm({
      name: admin.name, email: admin.email, role: admin.role,
      branchId: admin.branchId?.toString() ?? "",
      phone: admin.phone ?? "", secondaryPhone: admin.secondaryPhone ?? "",
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setEditError("");
    if (!editForm.name.trim()) { setEditError("Full name is required."); return; }
    if (!editForm.email.trim()) { setEditError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) { setEditError("Enter a valid email address."); return; }
    setEditing(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAdmin.id, name: editForm.name, email: editForm.email,
          role: editForm.role, branchId: editForm.branchId ? Number(editForm.branchId) : null,
          phone: editForm.phone || null, secondaryPhone: editForm.secondaryPhone || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Something went wrong."); return; }
      setAdmins((prev) => prev.map((a) => a.id === editingAdmin.id ? {
        id: data.admin.id, name: data.admin.name, email: data.admin.email,
        role: data.admin.role, branchId: data.admin.branch_id ?? null,
        branch: data.admin.branch_name ?? null, phone: data.admin.phone ?? null,
        secondaryPhone: data.admin.secondary_phone ?? null,
        createdAt: new Date(data.admin.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      } : a));
      setEditError("");
      setToast({ type: "success", message: `Admin "${data.admin.name}" updated!` });
      setTimeout(() => { setEditingAdmin(null); setToast(null); }, 2000);
      startTransition(() => router.refresh());
    } catch { setEditError("Something went wrong. Please try again."); }
    finally { setEditing(false); }
  };

  /* ── Role selector (shared) ── */
  const RoleButtons = ({ role, onChange, disabled }: { role: string; onChange: (r: string) => void; disabled: boolean }) => (
    <div className="flex gap-2">
      {(["admin", "superadmin"] as const).map((r) => {
        const isDisabled = r === "superadmin" && disabled;
        return (
          <div key={r} className="relative flex-1 group/role">
            <button type="button" disabled={isDisabled}
              onClick={() => !isDisabled && onChange(r)}
              className={`w-full h-9 rounded-lg text-xs font-semibold border transition-all ${
                isDisabled ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                  : role === r
                    ? r === "superadmin" ? "bg-purple-600 text-white border-purple-600" : "bg-green-600 text-white border-green-600"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 cursor-pointer"
              }`}
            >
              {r === "superadmin" ? "Super Admin" : "Admin"}
            </button>
            {isDisabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-[11px] rounded-lg pointer-events-none opacity-0 group-hover/role:opacity-100 transition-opacity z-10 whitespace-nowrap">
                Only super admins can assign this role
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-5">
      <ConfirmDialog
        open={!!confirmTarget}
        title="Remove Admin Account"
        description={`Remove "${confirmTarget?.name}"? They will lose access immediately.`}
        confirmLabel="Remove"
        loading={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* ── Header ── */}
      <div className="shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Admin Accounts</h1>
          <p className="text-sm text-slate-400 mt-0.5">{admins.length} account{admins.length !== 1 ? "s" : ""} · Manage who has access to this panel</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowPw(false); setCreateError(""); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      {/* ── Search + Filter bar ── */}
      <div className="shrink-0 flex items-center gap-3 relative">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="h-9 w-full pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500/40 focus:border-green-400 transition-all"
          />
        </div>
        {search && (
          <button onClick={() => setSearch("")}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="relative" ref={filterRef}>
          <button onClick={() => setShowFilter(!showFilter)}
            className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-colors ${
              (filterRoles.length > 0 || filterBranches.length > 0)
                ? "bg-green-50 border-green-200 text-green-600"
                : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          {(filterRoles.length > 0 || filterBranches.length > 0) && (
            <button onClick={() => { setFilterRoles([]); setFilterBranches([]); setSelectedRoles([]); setSelectedBranches([]); }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center hover:bg-red-600"
            >×</button>
          )}
          {showFilter && (
            <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-20" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-3">
                <div>
                  <button onClick={() => setRoleOpen(!roleOpen)} className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 hover:text-slate-900">
                    <span>Role</span><span className="text-slate-400">{roleOpen ? "−" : "+"}</span>
                  </button>
                  {roleOpen && (
                    <div className="space-y-1">
                      {["admin", "superadmin"].map((role) => (
                        <label key={role} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg">
                          <input type="checkbox" checked={selectedRoles.includes(role)}
                            onChange={(e) => setSelectedRoles(e.target.checked ? [...selectedRoles, role] : selectedRoles.filter((r) => r !== role))}
                            className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-slate-700">{role === "superadmin" ? "Super Admin" : "Admin"}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {uniqueBranches.length > 0 && (
                  <div>
                    <button onClick={() => setBranchOpen(!branchOpen)} className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 hover:text-slate-900">
                      <span>Branch</span><span className="text-slate-400">{branchOpen ? "−" : "+"}</span>
                    </button>
                    {branchOpen && (
                      <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-none">
                        {uniqueBranches.map((branch) => (
                          <label key={branch} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg">
                            <input type="checkbox" checked={selectedBranches.includes(branch)}
                              onChange={(e) => setSelectedBranches(e.target.checked ? [...selectedBranches, branch] : selectedBranches.filter((b) => b !== branch))}
                              className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-slate-700">{branch}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setSelectedRoles([]); setSelectedBranches([]); }}
                    className="flex-1 h-8 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >Clear</button>
                  <button onClick={() => { setFilterRoles(selectedRoles); setFilterBranches(selectedBranches); setShowFilter(false); }}
                    className="flex-1 h-8 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >Apply</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 ml-auto">
          {filtered.length} of {admins.length} admin{admins.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none rounded-xl border border-slate-100 bg-white">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              {admins.length === 0 ? <Shield className="w-5 h-5 text-slate-400" /> : <Search className="w-5 h-5 text-slate-400" />}
            </div>
            <p className="text-sm font-medium text-slate-700">
              {admins.length === 0 ? "No admin accounts" : "No results found"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {admins.length === 0 ? "Click \"Add Admin\" to create the first account." : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/95 backdrop-blur-sm border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Admin</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Branch</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Created</th>
                <th className="px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((admin, i) => (
                <tr key={admin.id} onClick={() => setViewAdmin(admin)} className="group hover:bg-slate-50/60 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {getInitials(admin.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-800">{admin.name}</p>
                          {admin.role === "superadmin" && <UserCog className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                          {admin.id === currentAdminId && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{admin.email}</p>
                        {deleteError[admin.id] && <p className="text-[11px] text-red-500 mt-0.5">{deleteError[admin.id]}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${ROLE_STYLE[admin.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {admin.role === "superadmin" ? "Super Admin" : "Admin"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {admin.branch ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {admin.branch}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {admin.phone ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {admin.phone}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{admin.createdAt}</td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(admin)} title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {currentAdminRole === "superadmin" && (
                        <button onClick={() => setConfirmTarget(admin)} disabled={deletingId === admin.id} title="Remove"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                        >
                          {deletingId === admin.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Admin Detail Panel ── */}
      {viewAdmin && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setViewAdmin(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Accent bar */}
            <div className={`h-1.5 w-full ${viewAdmin.role === "superadmin" ? "bg-gradient-to-r from-purple-400 to-purple-600" : "bg-gradient-to-r from-green-400 to-emerald-500"}`} />

            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${
                  viewAdmin.role === "superadmin" ? "bg-purple-100 text-purple-700" : AVATAR_COLORS[admins.findIndex(a => a.id === viewAdmin.id) % AVATAR_COLORS.length]
                }`}>
                  {getInitials(viewAdmin.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-slate-900">{viewAdmin.name}</p>
                    {viewAdmin.role === "superadmin" && <UserCog className="w-4 h-4 text-purple-500" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_STYLE[viewAdmin.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {viewAdmin.role === "superadmin" ? "Super Admin" : "Admin"}
                    </span>
                    {viewAdmin.id === currentAdminId && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setViewAdmin(null)} className="text-slate-400 hover:text-slate-600 transition-colors mt-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-5 space-y-5">

              {/* Info rows */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Information</p>
                <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-slate-800">{viewAdmin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-medium text-slate-800">{viewAdmin.phone || <span className="text-slate-400 italic text-xs">Not provided</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <PhoneCall className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Alternative Phone</p>
                      <p className="text-sm font-medium text-slate-800">
                        {viewAdmin.secondaryPhone || <span className="text-slate-400 italic text-xs">Not provided</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch + Created */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assignment</p>
                <div className="bg-slate-50 rounded-xl divide-y divide-slate-100">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Branch</p>
                      {viewAdmin.branch
                        ? <p className="text-sm font-medium text-slate-800">{viewAdmin.branch}</p>
                        : <p className="text-xs text-slate-400 italic">{viewAdmin.role === "superadmin" ? "All branches" : "Not assigned"}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Role</p>
                      <p className="text-sm font-medium text-slate-800 capitalize">{viewAdmin.role === "superadmin" ? "Super Admin" : "Branch Admin"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Member Since</p>
                      <p className="text-sm font-medium text-slate-800">{viewAdmin.createdAt}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => { setViewAdmin(null); handleEditClick(viewAdmin); }}
                className="flex-1 h-9 flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Admin
              </button>
              {currentAdminRole === "superadmin" && (
                <button
                  onClick={() => { setViewAdmin(null); setConfirmTarget(viewAdmin); }}
                  className="h-9 px-4 flex items-center justify-center gap-2 border border-red-200 text-red-500 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Admin Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Admin</h3>
                  <p className="text-xs text-slate-400">Fill in the details to create an account</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Full Name <span className="text-red-500">*</span></label>
                  <input required value={form.name} onChange={set("name")} placeholder="e.g. Ravi Kumar" className={INPUT_CLASS} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Email <span className="text-red-500">*</span></label>
                  <input required type="email" value={form.email} onChange={set("email")} placeholder="e.g. ravi@farmfresh.com" className={INPUT_CLASS} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input required type={showPw ? "text" : "password"} value={form.password} onChange={set("password")}
                      placeholder="Min. 6 characters" minLength={6}
                      className="w-full h-9 px-3 pr-9 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {form.role === "admin" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Branch <span className="text-red-500">*</span></label>
                    <BranchDropdown value={form.branchId} onChange={(v) => setForm((p) => ({ ...p, branchId: v }))} branches={branches} />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Phone</label>
                    <input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className={INPUT_CLASS} />
                  </div>
                )}
              </div>

              {form.role === "admin" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Phone</label>
                    <input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className={INPUT_CLASS} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Secondary Phone</label>
                    <input value={form.secondaryPhone} onChange={set("secondaryPhone")} placeholder="+91 98765 43211" className={INPUT_CLASS} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Role</label>
                <RoleButtons role={form.role} onChange={(r) => setForm((p) => ({ ...p, role: r, branchId: "" }))} disabled={currentAdminRole !== "superadmin"} />
                <p className="text-[11px] text-slate-400">
                  {form.role === "superadmin" ? "Super admins can manage all admin accounts and branches." : "Admins manage products, orders and customers for their branch."}
                </p>
              </div>

              {createError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">{createError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(""); }}
                  className="flex-1 h-9 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >Cancel</button>
                <button type="submit" disabled={adding}
                  className="flex-1 h-9 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Admin</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Admin Modal ── */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditingAdmin(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Admin</h3>
                  <p className="text-xs text-slate-400">{editingAdmin.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingAdmin(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Full Name <span className="text-red-500">*</span></label>
                  <input required value={editForm.name} onChange={setEdit("name")} className={INPUT_CLASS} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Email <span className="text-red-500">*</span></label>
                  <input required type="email" value={editForm.email} onChange={setEdit("email")} className={INPUT_CLASS} />
                </div>
              </div>

              {editForm.role === "admin" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Branch</label>
                  <BranchDropdown value={editForm.branchId} onChange={(v) => setEditForm((p) => ({ ...p, branchId: v }))} branches={branches} placeholder="— No branch —" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Phone</label>
                  <input value={editForm.phone} onChange={setEdit("phone")} placeholder="+91 98765 43210" className={INPUT_CLASS} />
                </div>
                {editForm.role === "admin" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Secondary Phone</label>
                    <input value={editForm.secondaryPhone} onChange={setEdit("secondaryPhone")} placeholder="+91 98765 43211" className={INPUT_CLASS} />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Role</label>
                <RoleButtons role={editForm.role} onChange={(r) => setEditForm((p) => ({ ...p, role: r }))} disabled={currentAdminRole !== "superadmin"} />
              </div>

              {editError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">{editError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setEditingAdmin(null); setEditError(""); }}
                  className="flex-1 h-9 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >Cancel</button>
                <button type="submit" disabled={editing}
                  className="flex-1 h-9 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {editing ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToast(null)} className="shrink-0 text-white/80 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
