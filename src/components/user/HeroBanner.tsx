import Link from "next/link";

export default function HeroBanner() {
  return (
    <Link
      href="/shop/category/daily-essentials"
      className="block relative overflow-hidden rounded-2xl select-none cursor-pointer group"
      style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #0d9488 100%)" }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-8 right-1/3 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
        <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-3 bg-white/20 text-white">
          100% Organic
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight whitespace-pre-line mb-2">
          Farm Fresh{"\n"}Delivered Today
        </h2>
        <p className="text-xs sm:text-sm leading-relaxed max-w-md mb-4 text-emerald-100">
          Zero pesticides. Maximum nutrition. Straight from our hydroponic farm.
        </p>
        <span className="inline-block bg-white text-slate-900 font-bold text-xs px-4 py-2 rounded-lg group-hover:bg-slate-100 transition-colors shadow-md">
          Shop Daily Essentials →
        </span>
      </div>
    </Link>
  );
}
