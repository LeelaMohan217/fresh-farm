export const dynamic = "force-dynamic";

import pool from "@/lib/pg";
import Link from "next/link";
import {
  Droplets, Wind, CheckCircle2, ArrowRight, Phone, Mail, Wrench,
} from "lucide-react";

async function getServices() {
  const { rows } = await pool.query(`
    SELECT id, name, type, price, description
    FROM services
    WHERE status = 'Active' AND type IN ('Hydroponic','Aeroponic')
    ORDER BY type ASC
  `);
  return rows.map((s) => ({
    id: s.id as number,
    name: s.name as string,
    type: s.type as string,
    price: Number(s.price),
    description: (s.description ?? "") as string,
  }));
}

const META = {
  Hydroponic: {
    icon: Droplets, color: "text-blue-600", bg: "bg-blue-50",
    border: "border-blue-100", href: "/services/hydroponic",
    bullets: ["Site assessment & design", "Full hardware installation", "Nutrient solution setup", "30-day support"],
  },
  Aeroponic: {
    icon: Wind, color: "text-purple-600", bg: "bg-purple-50",
    border: "border-purple-100", href: "/services/aeroponic",
    bullets: ["Custom chamber design", "High-pressure misting setup", "Timer & controller config", "30-day support"],
  },
};

const PROCESS = [
  { step: "01", title: "Book a free consultation", desc: "Call or email us. We visit your site at no cost." },
  { step: "02", title: "Custom system design",     desc: "We design the perfect setup for your space and goals." },
  { step: "03", title: "Professional installation", desc: "Our team installs everything in 2–3 days." },
  { step: "04", title: "Training & support",        desc: "We train you on maintenance and provide 30-day support." },
];

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="bg-[#F8FAFC]">

      {/* ── Hero ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Wrench className="w-3.5 h-3.5" /> Installation Services
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Bring the farm<br />
              <span className="text-green-600">to your home.</span>
            </h1>
            <p className="text-slate-500 mt-4 leading-relaxed max-w-xl">
              We design, install and set up custom hydroponic and aeroponic growing systems at your
              home, terrace, balcony, or commercial space. Start growing your own food today.
            </p>
          </div>
        </div>
      </section>

      {/* ── Service cards ── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Choose your system</h2>
          <p className="text-sm text-slate-500 mb-6">Both systems are managed end-to-end by our expert team</p>

          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {services.map((s) => {
                const meta = META[s.type as keyof typeof META];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <div key={s.id} className={`bg-white rounded-2xl border ${meta.border} overflow-hidden hover:shadow-md transition-shadow`}>
                    <div className={`h-1.5 ${s.type === "Hydroponic" ? "bg-blue-500" : "bg-purple-500"}`} />
                    <div className="p-6 space-y-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-13 h-13 rounded-2xl ${meta.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-7 h-7 ${meta.color}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">{s.description}</p>
                        </div>
                      </div>

                      <ul className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                        {meta.bullets.map((b) => (
                          <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {b}
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium">Starting from</p>
                          <p className="text-2xl font-extrabold text-slate-900">₹{s.price.toLocaleString("en-IN")}</p>
                        </div>
                        <Link href={meta.href}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors ${s.type === "Hydroponic" ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}`}
                        >
                          Learn more <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
              <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Services coming soon. Contact us to enquire.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Process ── */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">How it works</h2>
            <p className="text-sm text-slate-500 mt-1">Simple 4-step process from enquiry to harvest</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {PROCESS.map((p, i) => (
              <div key={p.step} className="relative">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
                  <span className="text-3xl font-extrabold text-green-100">{p.step}</span>
                  <p className="text-sm font-bold text-slate-900 mt-2">{p.title}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
                </div>
                {i < PROCESS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 rounded-3xl px-8 py-10 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold">Get a free site estimate</h2>
                <p className="text-slate-400 mt-1 text-sm">We visit your location, assess the space and give you a custom quote — free of charge.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <a href="tel:+919876543210"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-semibold text-sm rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call us
                </a>
                <a href="mailto:install@farmfresh.in"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
