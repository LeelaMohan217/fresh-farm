"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string; emoji?: string };
export type OptionGroup = { label: string; options: Option[] };

type BaseProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

type FlatProps = BaseProps & { options: Option[]; groups?: never };
type GroupedProps = BaseProps & { groups: OptionGroup[]; options?: never };

type Props = FlatProps | GroupedProps;

export default function CustomSelect({
  value, onChange, placeholder = "Select...", required, disabled, ...rest
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allOptions: Option[] = "groups" in rest && rest.groups
    ? rest.groups.flatMap((g) => g.options)
    : (rest.options ?? []);

  const selected = allOptions.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {required && (
        <select required value={value} onChange={(e) => onChange(e.target.value)}
          className="sr-only" tabIndex={-1} aria-hidden>
          <option value="" disabled />
          {allOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}

      <button type="button" disabled={disabled} onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full h-10 px-3 text-sm rounded-lg border text-left flex items-center justify-between gap-2 transition-all cursor-pointer",
          "bg-slate-50 border-slate-200 text-slate-800",
          "hover:border-slate-300 hover:bg-white",
          open && "border-green-400 ring-2 ring-green-500/20 bg-white",
          disabled && "opacity-50 cursor-not-allowed",
          !selected && "text-slate-400"
        )}>
        <span className="flex items-center gap-2 truncate">
          {selected?.emoji && <span className="text-base">{selected.emoji}</span>}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl py-1.5 max-h-60 overflow-y-auto">
          {"groups" in rest && rest.groups ? (
            rest.groups.map((group) => (
              <div key={group.label}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.label}</p>
                {group.options.map((option) => (
                  <OptionItem key={option.value} option={option} selected={option.value === value}
                    onSelect={() => { onChange(option.value); setOpen(false); }} />
                ))}
              </div>
            ))
          ) : (
            allOptions.map((option) => (
              <OptionItem key={option.value} option={option} selected={option.value === value}
                onSelect={() => { onChange(option.value); setOpen(false); }} />
            ))
          )}
          {allOptions.length === 0 && (
            <p className="px-3 py-3 text-sm text-slate-400 text-center">No options available</p>
          )}
        </div>
      )}
    </div>
  );
}

function OptionItem({ option, selected, onSelect }: { option: Option; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect}
      className={cn(
        "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors text-left cursor-pointer",
        selected ? "bg-green-50 text-green-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
      )}>
      <span className="flex items-center gap-2">
        {option.emoji && <span className="text-base">{option.emoji}</span>}
        {option.label}
      </span>
      {selected && <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />}
    </button>
  );
}
