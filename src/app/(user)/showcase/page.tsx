import Link from "next/link";
import { Leaf, Droplets, Wind, ArrowRight, Sprout, Sun, Thermometer } from "lucide-react";

const SHOWCASE_ITEMS = [
  { emoji: "🥬", name: "Spinach",      method: "Hydroponic",  fact: "Grows in 21 days. 3x more nutrients than soil-grown." },
  { emoji: "🍅", name: "Tomatoes",     method: "Aeroponic",   fact: "Year-round harvest. No seasonal dependency." },
  { emoji: "🌿", name: "Basil & Herbs",method: "Hydroponic",  fact: "Fresh every day. Harvested hours before delivery." },
  { emoji: "🥦", name: "Broccoli",     method: "Hydroponic",  fact: "Pesticide-free. Rich in iron and Vitamin C." },
  { emoji: "🫚", name: "Lettuce",      method: "Aeroponic",   fact: "Crisp, tender leaves. Zero soil contamination." },
  { emoji: "🌱", name: "Microgreens",  method: "Hydroponic",  fact: "40x more nutrients than mature vegetables." },
];

const METHOD_COLOR: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  Hydroponic: { bg: "bg-blue-50",   text: "text-blue-600",   icon: Droplets },
  Aeroponic:  { bg: "bg-purple-50", text: "text-purple-600", icon: Wind     },
};

const HOW_WE_GROW = [
  {
    icon: Droplets,
    title: "Hydroponic Farming",
    desc: "Plants grow in nutrient-rich water without soil. We control every nutrient the plant receives — resulting in faster growth and consistently better quality.",
    stats: [{ label: "Less water", value: "90%" }, { label: "Faster growth", value: "2×" }, { label: "Yield per sqft", value: "+40%" }],
  },
  {
    icon: Wind,
    title: "Aeroponic Farming",
    desc: "Roots are suspended in air and misted with a fine nutrient spray. The most efficient farming method — plants absorb nutrients directly without any medium.",
    stats: [{ label: "Less water", value: "95%" }, { label: "Faster growth", value: "3×" }, { label: "Oxygen to roots", value: "100%" }],
  },
];

const OUR_VALUES = [
  { icon: Leaf,        title: "Zero Pesticides",    desc: "We never use any chemicals. Our controlled environment keeps pests out naturally." },
  { icon: Sun,         title: "Optimised light",    desc: "LED grow lights tuned to the exact wavelength each plant needs." },
  { icon: Thermometer, title: "Climate controlled", desc: "Temperature and humidity are precisely managed 24/7 for peak quality." },
  { icon: Sprout,      title: "Local & fresh",      desc: "Grown in Hyderabad, delivered same day. No cold storage, no preservatives." },
];

export default function ShowcasePage() {
  return (
    <div className="bg-[#F8FAFC]">

      {/* ── Hero ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Sprout className="w-3.5 h-3.5" /> Our Farm
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              From seed to your table —<br />
              <span className="text-green-600">see how we grow.</span>
            </h1>
            <p className="text-slate-500 mt-4 leading-relaxed">
              Every vegetable you order is grown right here using advanced hydroponic and aeroponic techniques.
              No soil. No pesticides. Just pure, fresh produce.
            </p>
          </div>
        </div>
      </section>

      {/* ── What we grow ── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">What we grow</h2>
              <p className="text-sm text-slate-500 mt-0.5">All grown in-house, harvested fresh daily</p>
            </div>
            <Link href="/shop"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              Order now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SHOWCASE_ITEMS.map((item) => {
              const meta = METHOD_COLOR[item.method];
              const Icon = meta.icon;
              return (
                <div key={item.name}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all"
                >
                  <div className="h-32 bg-linear-to-br from-green-50 to-emerald-100 flex items-center justify-center text-5xl">
                    {item.emoji}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                        <Icon className="w-3 h-3" /> {item.method}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.fact}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How we grow ── */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">How we grow</h2>
            <p className="text-sm text-slate-500 mt-1">Two advanced methods, one goal — the freshest produce possible</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {HOW_WE_GROW.map((m) => {
              const Icon = m.icon;
              const isHydro = m.title.includes("Hydroponic");
              return (
                <div key={m.title} className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isHydro ? "bg-blue-100" : "bg-purple-100"}`}>
                      <Icon className={`w-5 h-5 ${isHydro ? "text-blue-600" : "text-purple-600"}`} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{m.desc}</p>
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    {m.stats.map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-xl font-extrabold text-green-600">{s.value}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Our values ── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Our promise to you</h2>
            <p className="text-sm text-slate-500 mt-1">Every product meets our strict quality standards</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {OUR_VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-white rounded-2xl border border-slate-100 p-5 text-center hover:border-green-200 hover:shadow-sm transition-all">
                  <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">{v.title}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-green-600 rounded-3xl px-8 py-10 text-center text-white">
            <h2 className="text-2xl font-extrabold">Taste the difference</h2>
            <p className="text-green-100 mt-2 text-sm max-w-sm mx-auto">Order fresh produce grown right here in our farm and feel the quality.</p>
            <div className="flex flex-wrap gap-3 justify-center mt-5">
              <Link href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 border border-white/25 text-white font-semibold rounded-xl hover:bg-white/25 transition-colors"
              >
                Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
