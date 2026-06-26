"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export type BranchRevenuePoint = { branch: string; revenue: number };

const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="font-bold text-slate-900">₹{Number(payload[0].value).toLocaleString("en-IN")}</p>
    </div>
  );
}

export default function BranchRevenueBar({ data }: { data: BranchRevenuePoint[] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400">
        No branch data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220} minWidth={0}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="branch"
          tick={{ fontSize: 10, fill: "#94A3B8" }}
          axisLine={false} tickLine={false}
          interval={0}
          tickFormatter={(v: string) => v.length > 8 ? v.slice(0, 8) + "…" : v}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94A3B8" }}
          axisLine={false} tickLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
