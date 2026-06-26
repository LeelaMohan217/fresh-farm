"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export type RevenueDataPoint = { month: string; revenue: number };

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="capitalize">{p.name}:</span>
          <span className="font-semibold text-slate-800">
            ₹{Number(p.value).toLocaleString("en-IN")}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-65 flex items-center justify-center text-sm text-slate-400">
        No revenue data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={0}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
        <Area
          type="monotone" dataKey="revenue" name="revenue"
          stroke="#22C55E" strokeWidth={2}
          fill="url(#revenueGrad)" dot={false}
          activeDot={{ r: 4, fill: "#22C55E", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
