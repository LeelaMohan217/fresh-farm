"use client";

import { useState, useRef } from "react";
import {
  MapPin, Plus, Pencil, Trash2, Loader2, X,
  CheckCircle2, XCircle, Building2, Phone, Hash, Users,
  Calendar, Shield, ArrowRight,
} from "lucide-react";

type Branch = {
  id: number;
  name: string;
  location: string | null;
  address: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
  pincodes: string[];
  admins: { id: string; name: string; role: string }[];
};

type BranchDetail = Omit<Branch, "admins"> & {
  admins: { id: string; name: string; email: string; role: string; phone: string | null }[];
};

const emptyForm = { name: "", location: "", address: "", active: true };
type PinChip = { value: string; status: "checking" | "available" | "taken"; takenBy?: string };

const INPUT_CLASS = "w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all";

export default function BranchesClient({ branches: initial }: { branches: Branch[] }) {
  const [branches, setBranches] = useState<Branch[]>(initial);
  const [showForm, setShowForm]       = useState(false);
  const [editBranch, setEditBranch]   = useState<Branch | null>(null);
  const [detailBranch, setDetailBranch] = useState<BranchDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [chips, setChips]             = useState<PinChip[]>([]);
  const [pinInput, setPinInput]       = useState("");
  const pinCache = useRef<Record<string, string | null>>({});
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [error, setError]             = useState("");
  const [conflicts, setConflicts]     = useState<{ pincode: string; branch: string }[]>([]);

  function openCreate() {
    setEditBranch(null);
    setForm(emptyForm);
    setChips([]);
    setPinInput("");
    setError("");
    setConflicts([]);
    pinCache.current = {};
    setShowForm(true);
  }

  function openEdit(branch: Branch, e: React.MouseEvent) {
    e.stopPropagation();
    setEditBranch(branch);
    setForm({
      name: branch.name,
      location: branch.location ?? "",
      address: branch.address ?? "",
      active: branch.active,
    });
    const initialChips: PinChip[] = branch.pincodes.map((p) => ({ value: p, status: "checking" }));
    setChips(initialChips);
    setPinInput("");
    setError("");
    setConflicts([]);
    pinCache.current = {};
    setShowForm(true);
    if (branch.pincodes.length > 0) checkPincodes(branch.pincodes, branch.id);
  }

  async function openDetail(branch: Branch) {
    setLoadingDetail(true);
    setDetailBranch({ ...branch, admins: [] });
    try {
      const res = await fetch(`/api/admin/branches/${branch.id}`);
      const data = await res.json();
      if (res.ok) setDetailBranch(data);
    } finally {
      setLoadingDetail(false);
    }
  }

  function parsePincodes(raw: string): string[] {
    return raw.split(/[\s,]+/).map((p) => p.trim()).filter((p) => /^\d{6}$/.test(p));
  }

  async function checkPincodes(pincodes: string[], excludeId?: number) {
    if (!pincodes.length) return;
    const id = excludeId ?? editBranch?.id;

    // Resolve cached hits immediately
    const cached = pincodes.filter((p) => p in pinCache.current);
    const uncached = pincodes.filter((p) => !(p in pinCache.current));

    if (cached.length) {
      setChips((prev) => prev.map((c) =>
        cached.includes(c.value)
          ? { ...c, status: pinCache.current[c.value] ? "taken" : "available", takenBy: pinCache.current[c.value] ?? undefined }
          : c
      ));
    }

    if (!uncached.length) return;

    const query = `pincodes=${uncached.join(",")}&excludeId=${id ?? ""}`;
    const res = await fetch(`/api/admin/branches/check-pincodes?${query}`);
    if (!res.ok) return;
    const data: Record<string, string | null> = await res.json();

    // Store in cache
    for (const p of uncached) pinCache.current[p] = data[p] ?? null;

    setChips((prev) => prev.map((c) =>
      uncached.includes(c.value)
        ? { ...c, status: data[c.value] ? "taken" : "available", takenBy: data[c.value] ?? undefined }
        : c
    ));
  }

  function addChip(raw: string) {
    const values = parsePincodes(raw);
    if (!values.length) return;
    const existing = chips.map((c) => c.value);
    const fresh = values.filter((v) => !existing.includes(v));
    if (!fresh.length) return;
    // Apply cache immediately for known pincodes, "checking" for unknown
    const newChips: PinChip[] = fresh.map((v) =>
      v in pinCache.current
        ? { value: v, status: pinCache.current[v] ? "taken" : "available", takenBy: pinCache.current[v] ?? undefined }
        : { value: v, status: "checking" }
    );
    setChips((prev) => [...prev, ...newChips]);
    setPinInput("");
    const needCheck = fresh.filter((v) => !(v in pinCache.current));
    if (needCheck.length) {
      if (checkTimer.current) clearTimeout(checkTimer.current);
      checkTimer.current = setTimeout(() => checkPincodes(needCheck), 150);
    }
  }

  function removeChip(value: string) {
    setChips((prev) => prev.filter((c) => c.value !== value));
  }

  function handlePinKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (["Enter", ",", " ", "Tab"].includes(e.key)) {
      e.preventDefault();
      addChip(pinInput);
    }
    if (e.key === "Backspace" && !pinInput && chips.length > 0) {
      removeChip(chips[chips.length - 1].value);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Branch name is required."); return; }
    if (!form.location?.trim()) { setError("City / Area is required."); return; }
    if (chips.filter((c) => c.status === "available").length === 0 && chips.filter((c) => c.status === "checking").length === 0) { setError("At least one serviceable pincode is required."); return; }
    setSaving(true);
    setError("");
    setConflicts([]);
    try {
      const takenChips = chips.filter((c) => c.status === "taken");
      if (takenChips.length > 0) {
        setConflicts(takenChips.map((c) => ({ pincode: c.value, branch: c.takenBy! })));
        return;
      }
      const payload = {
        name: form.name.trim(),
        location: form.location.trim() || null,
        address: form.address.trim() || null,
        phone: null,
        active: form.active,
        pincodes: chips.filter((c) => c.status === "available").map((c) => c.value),
      };

      if (editBranch) {
        const res = await fetch(`/api/admin/branches/${editBranch.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.status === 409) { setConflicts(data.conflicts); return; }
        if (!res.ok) { setError(data.error); return; }
        setBranches((prev) => prev.map((b) => b.id === editBranch.id ? { ...b, ...data, pincodes: data.pincodes } : b));
      } else {
        const res = await fetch("/api/admin/branches", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.status === 409) { setConflicts(data.conflicts); return; }
        if (!res.ok) { setError(data.error); return; }
        setBranches((prev) => [...prev, { ...data, admins: [] }]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this branch? Admins assigned to it will be unlinked.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/branches/${id}`, { method: "DELETE" });
      setBranches((prev) => prev.filter((b) => b.id !== id));
      if (detailBranch?.id === id) setDetailBranch(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Branches</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {branches.length} branch{branches.length !== 1 ? "es" : ""} · Manage locations and pincode coverage
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add branch
        </button>
      </div>

      {/* Cards */}
      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100">
          <Building2 className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-600 font-semibold">No branches yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your first branch to start assigning pincodes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {branches.map((branch) => (
            <div key={branch.id}
              onClick={() => openDetail(branch)}
              className="group bg-white rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all duration-150 cursor-pointer flex flex-col"
            >
              <div className="p-5 flex flex-col gap-3 flex-1">

                {/* Header: name + badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${branch.active ? "bg-green-50" : "bg-slate-100"}`}>
                      <Building2 className={`w-4 h-4 ${branch.active ? "text-green-600" : "text-slate-400"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{branch.name}</p>
                      {branch.location && <p className="text-[11px] text-slate-400 mt-0.5">{branch.location}</p>}
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    branch.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"
                  }`}>
                    {branch.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-50" />

                {/* Admins */}
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  {branch.admins.length === 0 ? (
                    <span className="text-xs text-slate-400">No admins assigned</span>
                  ) : (
                    <span className="text-xs text-slate-600">
                      {branch.admins.slice(0, 2).map(a => a.name).join(" · ")}
                      {branch.admins.length > 2 && <span className="text-slate-400"> +{branch.admins.length - 2} more</span>}
                    </span>
                  )}
                </div>

                {/* Pincodes */}
                <div className="flex items-start gap-2">
                  <Hash className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                  {branch.pincodes.length === 0 ? (
                    <span className="text-xs text-slate-400">No pincodes assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {branch.pincodes.slice(0, 5).map((p) => (
                        <span key={p} className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {p}
                        </span>
                      ))}
                      {branch.pincodes.length > 5 && (
                        <span className="text-[11px] text-slate-400">+{branch.pincodes.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-5 py-3 border-t border-slate-50 flex items-center gap-3">
                <button onClick={(e) => openEdit(branch, e)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={(e) => handleDelete(branch.id, e)} disabled={deletingId === branch.id}
                  className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 disabled:opacity-40"
                >
                  {deletingId === branch.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete
                </button>
                <span className="ml-auto text-xs font-medium text-slate-400 group-hover:text-green-600 transition-colors flex items-center gap-1">
                  View details <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail panel ── */}
      {detailBranch && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailBranch(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Panel header */}
            <div className={`h-1.5 w-full ${detailBranch.active ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-slate-200"}`} />
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${detailBranch.active ? "bg-green-50" : "bg-slate-100"}`}>
                  <Building2 className={`w-5 h-5 ${detailBranch.active ? "text-green-600" : "text-slate-400"}`} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{detailBranch.name}</h2>
                  {detailBranch.location && <p className="text-sm text-slate-400">{detailBranch.location}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  detailBranch.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {detailBranch.active ? <><CheckCircle2 className="w-3 h-3" /> Active</> : <><XCircle className="w-3 h-3" /> Inactive</>}
                </span>
                <button onClick={() => setDetailBranch(null)} className="text-slate-400 hover:text-slate-600 transition-colors ml-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 px-6 py-5 space-y-6">

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Users, label: "Admins", value: detailBranch.admins.length },
                  { icon: Hash, label: "Pincodes", value: detailBranch.pincodes.length },
                  { icon: Calendar, label: "Created", value: new Date(detailBranch.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <Icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-800">{value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Address</p>
                <div className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  {detailBranch.address
                    ? <p className="text-sm text-slate-700 leading-relaxed">{detailBranch.address}</p>
                    : <p className="text-sm text-slate-400 italic">No address provided</p>
                  }
                </div>
              </div>

              {/* Admins */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned Admins
                </p>
                {loadingDetail ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading admins...
                  </div>
                ) : detailBranch.admins.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <Users className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No admins assigned yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Assign an admin from Admin Accounts</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailBranch.admins.map((admin) => (
                      <div key={admin.id} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0 mt-0.5">
                          {admin.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800 truncate">{admin.name}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              admin.role === "superadmin" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                            }`}>
                              {admin.role === "superadmin" ? "Super Admin" : "Admin"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{admin.email}</p>
                          {admin.phone && (
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <p className="text-xs text-slate-500">{admin.phone}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pincodes */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Serviceable Pincodes · {detailBranch.pincodes.length}
                </p>
                {detailBranch.pincodes.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <Hash className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No pincodes assigned</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detailBranch.pincodes.map((p) => (
                      <span key={p} className="text-xs font-sans font-medium bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Panel footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={(e) => { setDetailBranch(null); openEdit(detailBranch, e); }}
                className="flex-1 h-10 flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                <Pencil className="w-4 h-4" /> Edit Branch
              </button>
              <button onClick={() => setDetailBranch(null)}
                className="px-4 h-10 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{editBranch ? "Edit Branch" : "Add New Branch"}</h3>
                  <p className="text-xs text-slate-400">{editBranch ? `Editing ${editBranch.name}` : "Fill in the details to create a branch"}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Row 1: Name + City */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Branch name <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Banjara Hills" className={INPUT_CLASS} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">City / Area <span className="text-red-500">*</span></label>
                  <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Hyderabad" className={INPUT_CLASS} />
                </div>
              </div>

              {/* Row 2: Pincodes chip input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Serviceable Pincodes <span className="text-red-500">*</span></label>
                  {chips.length > 0 && (
                    <span className="text-[11px] font-medium text-slate-400">
                      {chips.filter((c) => c.status === "available").length} available
                      {chips.filter((c) => c.status === "taken").length > 0 && (
                        <span className="text-red-500 ml-1">· {chips.filter((c) => c.status === "taken").length} taken</span>
                      )}
                    </span>
                  )}
                </div>

                {/* Chip container */}
                <div
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-400 transition-all flex flex-wrap gap-1 items-center cursor-text overflow-y-auto"
                  onClick={() => document.getElementById("pin-input")?.focus()}
                >
                  {chips.map((chip) => (
                    <span key={chip.value} className={`inline-flex items-center gap-1 text-[11px] font-sans font-medium px-1.5 py-0.5 rounded border transition-all ${
                      chip.status === "checking"   ? "bg-slate-100 border-slate-200 text-slate-500" :
                      chip.status === "taken"      ? "bg-red-50 border-red-200 text-red-700" :
                                                     "bg-green-50 border-green-200 text-green-700"
                    }`}>
                      {chip.status === "checking" && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse shrink-0" />}
                      {chip.status === "taken"    && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                      {chip.status === "available" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
                      {chip.value}
                      {chip.status === "taken" && chip.takenBy && (
                        <span className="font-sans text-[10px] text-red-400 ml-0.5">→ {chip.takenBy}</span>
                      )}
                      <button type="button" onClick={() => removeChip(chip.value)}
                        className="ml-0.5 text-current opacity-50 hover:opacity-100 transition-opacity"
                      >×</button>
                    </span>
                  ))}
                  <input
                    id="pin-input"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/[^\d,\s]/g, ""))}
                    onKeyDown={handlePinKeyDown}
                    onBlur={() => { if (pinInput.trim()) addChip(pinInput); }}
                    placeholder={chips.length === 0 ? "Type a pincode and press Enter or comma…" : ""}
                    className="flex-1 min-w-[140px] bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none font-sans h-6"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Type a 6-digit pincode and press <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px]">Enter</kbd> or <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px]">,</kbd> to add. Each pincode is validated instantly.</p>
              </div>

              {/* Row 3: Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Address</label>
                <textarea rows={2} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Full branch address"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all resize-none" />
              </div>

              {/* Row 4: Active toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">Branch Active</label>
                <button type="button" onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</p>
              )}

              {conflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-red-700">
                    {conflicts.length} pincode{conflicts.length !== 1 ? "s are" : " is"} already assigned to another branch. Remove them first or enter different pincodes.
                  </p>
                  <div className="space-y-1.5">
                    {conflicts.map(({ pincode, branch }) => (
                      <div key={pincode} className="flex items-center gap-2 text-xs">
                        <span className="font-sans font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded">{pincode}</span>
                        <span className="text-red-400">is already mapped to branch</span>
                        <span className="font-semibold text-red-700">&quot;{branch}&quot;</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setConflicts([]); }}
                className="flex-1 h-9 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 h-9 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editBranch ? "Save Changes" : "Create Branch"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
