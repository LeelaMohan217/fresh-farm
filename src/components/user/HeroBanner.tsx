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

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 bg-white/20 text-white">
          100% Organic
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight whitespace-pre-line mb-3">
          Farm Fresh{"\n"}Delivered Today
        </h2>
        <p className="text-sm sm:text-base leading-relaxed max-w-md mb-6 text-emerald-100">
          Zero pesticides. Maximum nutrition. Straight from our hydroponic farm.
        </p>
        <span className="inline-block bg-white text-slate-900 font-bold text-sm px-6 py-3 rounded-xl group-hover:bg-slate-100 transition-colors shadow-lg">
          Shop Daily Essentials →
        </span>
      </div>
    </Link>
  );
}
