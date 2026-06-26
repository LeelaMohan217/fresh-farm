"use client";

import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, CheckCircle2,
  Droplets, Wind, Clock, IndianRupee, Users, ChevronDown,
} from "lucide-react";
import { useState } from "react";

type ServiceInfo = { id: number; name: string; type: string; description: string | null; price: number; status: string };

const INFO = {
  Hydroponic: {
    color: "bg-blue-600", lightBg: "bg-blue-50", textColor: "text-blue-600",
    icon: Droplets, emoji: "💧",
    tagline: "Soil-free, water-based growing system",
    description: "Perfect for homes, terraces, and indoor spaces. Grow fresh vegetables year-round with minimal space and water.",
    includes: [
      "Site assessment and system design",
      "Complete hardware installation (pipes, pumps, tanks)",
      "Nutrient solution setup and calibration",
      "Lighting system (grow lights)",
      "Seedling starter pack (50 plants)",
      "Training session for maintenance",
      "30-day post-installation support",
    ],
    whyUs: [
      { icon: Clock,        label: "2–3 day setup",    desc: "Fast, professional installation" },
      { icon: Users,        label: "Expert team",      desc: "5+ years of experience" },
      { icon: CheckCircle2, label: "6-month warranty",  desc: "System performance guaranteed" },
      { icon: IndianRupee,  label: "Best price",       desc: "No hidden charges" },
    ],
    faqs: [
      { q: "How much space is needed?",       a: "Minimum 6×4 ft — balconies, terraces, or a dedicated room all work." },
      { q: "How often does it need care?",    a: "Weekly nutrient top-ups and monthly system checks. We provide a full guide." },
      { q: "What can I grow?",                a: "Leafy greens, herbs, tomatoes, cucumbers, peppers — 50+ varieties." },
    ],
  },
  Aeroponic: {
    color: "bg-purple-600", lightBg: "bg-purple-50", textColor: "text-purple-600",
    icon: Wind, emoji: "💨",
    tagline: "Mist-based, ultra-efficient growing system",
    description: "Up to 30% faster growth with 95% less water than traditional farming. Ideal for premium yields in limited space.",
    includes: [
      "Custom aeroponic chamber design and build",
      "High-pressure misting system installation",
      "Timer and controller configuration",
      "Nutrient misting solution setup",
      "Seedling starter pack (30 plants)",
      "System monitoring setup",
      "30-day post-installation support",
    ],
    whyUs: [
      { icon: Clock,        label: "Faster growth",    desc: "30% faster than hydroponics" },
      { icon: Users,        label: "Specialists",      desc: "Certified aeroponic team" },
      { icon: CheckCircle2, label: "95% less water",   desc: "Ultra water-efficient" },
      { icon: IndianRupee,  label: "Higher yield",     desc: "More produce per sq. ft." },
    ],
    faqs: [
      { q: "Is aeroponic harder to maintain?", a: "Slightly more attention to misting intervals, but our automated timers make it manageable." },
      { q: "What's the power consumption?",    a: "150–300W for a standard setup. We optimise for minimal power draw." },
      { q: "Does it work indoors?",            a: "Yes — aeroponic systems thrive indoors with grow lights." },
    ],
  },
};

const CONTACT = {
  phone:   "+91 98765 43210",
  email:   "install@farmfresh.in",
  address: "FarmFresh HQ, Jubilee Hills, Hyderabad, Telangana 500033",
  hours:   "Mon – Sat, 9 AM – 6 PM",
};

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-800 pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 bg-white border-t border-slate-50">
          <p className="text-sm text-slate-600 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function ServiceDetailClient({ service, type }: { service: ServiceInfo | null; type: "Hydroponic" | "Aeroponic" }) {
  const info = INFO[type];
  const Icon = info.icon;

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back */}
        <Link href="/?tab=services"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </Link>

        {/* ── Hero card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className={`${info.color} px-6 py-8 text-white`}>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0 backdrop-blur-sm">
                {info.emoji}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-white/70 mb-1 uppercase tracking-widest">{type} Installation</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{service?.name ?? `${type} System Setup`}</h1>
                <p className="text-white/80 mt-2 text-sm">{info.tagline}</p>
              </div>
            </div>
            {service && (
              <div className="mt-5 inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-xl">
                <IndianRupee className="w-4 h-4" />
                <div>
                  <p className="text-[11px] text-white/60">Starting from</p>
                  <p className="text-xl font-extrabold leading-tight">₹{service.price.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-50">
            <p className="text-sm text-slate-600 leading-relaxed">{service?.description ?? info.description}</p>
          </div>
        </div>

        {/* ── What's included ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">What&apos;s included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {info.includes.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why choose us ── */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-3">Why choose us</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {info.whyUs.map((w) => {
              const WIcon = w.icon;
              return (
                <div key={w.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center hover:border-green-200 hover:shadow-sm transition-all">
                  <div className={`w-10 h-10 ${info.lightBg} rounded-xl flex items-center justify-center mx-auto mb-2.5`}>
                    <WIcon className={`w-5 h-5 ${info.textColor}`} />
                  </div>
                  <p className="text-xs font-bold text-slate-800">{w.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-3">Frequently asked questions</h2>
          <div className="space-y-2">
            {info.faqs.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <h2 className="text-base font-bold mb-1">Ready to get started?</h2>
          <p className="text-sm text-slate-400 mb-5">Contact our installation team — we&apos;ll visit your site and give a free estimate.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Phone,  label: "Call us",       value: CONTACT.phone   },
              { icon: Mail,   label: "Email",         value: CONTACT.email   },
              { icon: MapPin, label: "Visit us",      value: CONTACT.address },
              { icon: Clock,  label: "Working hours", value: CONTACT.hours   },
            ].map(({ icon: CIcon, label, value }) => (
              <div key={label} className="flex items-start gap-3 bg-white/8 rounded-xl p-3.5">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <CIcon className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">{label}</p>
                  <p className="text-sm text-white font-medium leading-snug">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
