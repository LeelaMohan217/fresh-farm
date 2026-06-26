"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export type CategoryDataPoint = { name: string; value: number; color: string };

const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: d.payload.color }} />
        <span className="text-slate-700 font-medium">{d.name}</span>
        <span className="font-bold text-slate-900">{d.value}%</span>
      </div>
    </div>
  );
}

export default function CategoryDonut({ data }: { data: CategoryDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-slate-400">
        No category data yet
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-24 h-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%"
              innerRadius={28} outerRadius={44}
              paddingAngle={3} dataKey="value" strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend — max 5 rows, scrollable if more */}
      <div className="w-full max-h-[110px] overflow-y-auto scrollbar-none space-y-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-slate-600 truncate">{d.name}</span>
            </div>
            <span className="text-xs font-semibold text-slate-800 shrink-0">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
