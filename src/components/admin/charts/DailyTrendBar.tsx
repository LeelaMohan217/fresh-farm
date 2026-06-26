"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export type DailyTrendPoint = { day: string; orders: number; revenue: number };

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs space-y-1.5">
      <p className="font-semibold text-slate-700">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="capitalize">{p.name === "revenue" ? "Revenue" : "Orders"}:</span>
          <span className="font-semibold text-slate-800">
            {p.name === "revenue" ? `₹${Number(p.value).toLocaleString("en-IN")}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DailyTrendBar({ data }: { data: DailyTrendPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400">
        No data for this week
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220} minWidth={0}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
        />
        <YAxis
          yAxisId="right" orientation="right"
          tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
        <Bar yAxisId="left" dataKey="revenue" name="revenue" fill="#22C55E" fillOpacity={0.15} stroke="#22C55E" strokeWidth={1} radius={[3, 3, 0, 0]} barSize={22} />
        <Line yAxisId="right" type="monotone" dataKey="orders" name="orders" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
