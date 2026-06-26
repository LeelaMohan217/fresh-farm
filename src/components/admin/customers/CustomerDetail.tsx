"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Phone, Calendar,
  ShoppingCart, IndianRupee, ShoppingBag, TrendingUp,
  Trash2, ExternalLink, UserCheck,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Order = {
  id: string;
  items: string;
  date: string;
  amount: number;
  status: string;
  receiverName: string | null;
  receiverPhone: string | null;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  joinedDate: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  monthlyAverage: number;
  topCategories: string[];
  lastOrder: string;
  orders: Order[];
};

const STATUS_STYLE: Record<string, string> = {
  Delivered:  "bg-green-50 text-green-700 ring-1 ring-green-200/60",
  Processing: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  Pending:    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  Cancelled:  "bg-red-50 text-red-600 ring-1 ring-red-200/60",
  Shipped:    "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60",
};

const AVATAR_COLORS = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

export default function CustomerDetail({ customer }: { customer: Customer }) {
  const router = useRouter();
  const colorIdx = parseInt(customer.id.replace(/\D/g, ""), 10) % AVATAR_COLORS.length;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const thirdPartyOrders = customer.orders.filter((o) => o.receiverName);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id }),
      });
      if (res.ok) {
        router.push("/admin/customers");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Customer"
        description={`Delete "${customer.name}"? This will permanently remove their account, all orders, and associated data.`}
        confirmLabel="Delete Customer"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* ── Header (static) ── */}
      <div className="shrink-0 flex items-start justify-between py-1 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${AVATAR_COLORS[colorIdx]}`}>
              {getInitials(customer.name)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{customer.name}</h1>
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                  customer.status === "Active"
                    ? "bg-green-50 text-green-700 ring-1 ring-green-200/60"
                    : "bg-slate-100 text-slate-500 ring-1 ring-slate-200/60"
                }`}>
                  {customer.status}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{customer.id} · Joined {customer.joinedDate}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          title="Delete customer"
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none space-y-6 pb-2">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders",    value: customer.totalOrders.toString(),                             icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
          { label: "Total Spent",     value: `₹${customer.totalSpent.toLocaleString("en-IN")}`,          icon: IndianRupee,  color: "bg-green-50 text-green-600" },
          { label: "Avg Order Value", value: `₹${customer.avgOrderValue.toLocaleString("en-IN")}`,       icon: TrendingUp,   color: "bg-amber-50 text-amber-600" },
          { label: "Last Order",      value: customer.lastOrder,                                          icon: ShoppingBag,  color: "bg-purple-50 text-purple-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">{s.label}</p>
                <p className="text-base font-bold text-slate-900 tracking-tight leading-tight">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account holder info + Spending */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Account Holder */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Account Holder</p>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Registered user</span>
          </div>
          <div className="space-y-3">
            {[
              { icon: User,     label: "Full Name",     value: customer.name },
              { icon: Mail,     label: "Email Address", value: customer.email },
              { icon: Phone,    label: "Phone Number",  value: customer.phone || "Not provided" },
              { icon: Calendar, label: "Member Since",  value: customer.joinedDate },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                  <p className="text-sm text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Spending Summary</p>
          <div className="space-y-4">

            {customer.topCategories.length > 0 && (
              <div>
                <p className="text-[11px] text-slate-400 font-medium mb-2">Most ordered</p>
                <div className="flex flex-wrap gap-1.5">
                  {customer.topCategories.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg border border-slate-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={customer.topCategories.length > 0 ? "pt-3 border-t border-slate-50" : ""}>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Monthly average</span>
                <span className="font-semibold text-slate-800">
                  ₹{customer.monthlyAverage.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-50">
              <p className="text-[11px] text-slate-400 font-medium mb-2">Lifetime value</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(100, (customer.totalSpent / 50000) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  ₹{customer.totalSpent.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Third-party deliveries summary */}
      {thirdPartyOrders.length > 0 && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-widest">
              Third-party Deliveries ({thirdPartyOrders.length})
            </p>
          </div>
          <p className="text-xs text-purple-600 mb-3">
            This customer has ordered for other people in {thirdPartyOrders.length} order{thirdPartyOrders.length !== 1 ? "s" : ""}.
          </p>
          <div className="space-y-2">
            {thirdPartyOrders.map((o) => (
              <div key={o.id}
                onClick={() => router.push(`/admin/orders/${o.id}`)}
                className="flex items-center gap-3 bg-white rounded-lg px-3.5 py-2.5 cursor-pointer hover:shadow-sm transition-all border border-purple-100"
              >
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <UserCheck className="w-3 h-3 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{o.receiverName}</p>
                  {o.receiverPhone && <p className="text-[11px] text-slate-400">{o.receiverPhone}</p>}
                </div>
                <p className="text-xs text-slate-500 shrink-0">{o.id}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order history */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          <p className="text-sm font-semibold text-slate-900">Order History</p>
          <span title={`${customer.orders.length} order${customer.orders.length !== 1 ? "s" : ""} placed`} className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full cursor-default">{customer.orders.length}</span>
        </div>

        {customer.orders.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Items</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Recipient</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 tracking-wide">Status</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customer.orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{order.id}</td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-[180px] truncate">{order.items}</td>
                  <td className="px-5 py-3.5">
                    {order.receiverName ? (
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="text-xs font-medium text-purple-700 truncate max-w-[100px]">{order.receiverName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Self</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{order.date}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">₹{order.amount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLE[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${order.id}`); }}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <ShoppingCart className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No orders yet</p>
            <p className="text-xs text-slate-400 mt-0.5">This customer hasn&apos;t placed any orders.</p>
          </div>
        )}
      </div>

      </div>{/* end scrollable */}
    </div>
  );
}
