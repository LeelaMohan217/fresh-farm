"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export type OrdersDataPoint = { month: string; regular: number; bulk: number };

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; fill: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.fill }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-semibold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function OrdersBarChart({ data }: { data: OrdersDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-55 flex items-center justify-center text-sm text-slate-400">
        No orders data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
        <Bar dataKey="regular" name="regular" radius={[4, 4, 0, 0]} maxBarSize={18}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? "#16A34A" : "#BBF7D0"} />
          ))}
        </Bar>
        <Bar dataKey="bulk" name="bulk" radius={[4, 4, 0, 0]} maxBarSize={18}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? "#F59E0B" : "#FDE68A"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
