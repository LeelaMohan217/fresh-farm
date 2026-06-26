import Link from "next/link";
import { CalendarDays, ArrowLeft, Phone, ArrowRight } from "lucide-react";
import BulkOrderForm from "./BulkOrderForm";

const EVENT_TYPES = [
  { label: "Wedding",   emoji: "💒", desc: "Floral arrangements, fresh salads, and organic garnishes" },
  { label: "Birthday",  emoji: "🎂", desc: "Fruit platters, herb bunches, and fresh gift baskets"    },
  { label: "Corporate", emoji: "💼", desc: "Daily office catering with seasonal organic produce"     },
  { label: "Festival",  emoji: "🪔", desc: "Seasonal items, traditional vegetables, and bulk greens" },
  { label: "Other",     emoji: "📦", desc: "Any custom or special bulk ordering requirement"          },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Submit your request", desc: "Fill in the form with your event details and what you need."                           },
  { step: "02", title: "We prepare a quote",  desc: "Our team reviews your request and sends a custom price quote within 24 hours."        },
  { step: "03", title: "Confirm & schedule",  desc: "Approve the quote and we'll schedule harvest & delivery for your event date."         },
];

export default function BulkOrdersPage() {
  return (
    <div className="bg-[#F8FAFC]">

      {/* ── Header ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-5">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <CalendarDays className="w-3.5 h-3.5" /> Bulk &amp; Event Orders
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Order in bulk for<br />
            <span className="text-amber-500">your special events.</span>
          </h1>
          <p className="text-slate-500 mt-3 text-sm leading-relaxed max-w-xl">
            Planning a wedding, corporate event, or festival? We deliver fresh organic produce in bulk —
            customized to your event&apos;s needs, harvested same-day for maximum freshness.
          </p>
        </div>
      </section>

      {/* ── Event types ── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">We cater for</h2>
          <p className="text-sm text-slate-500 mb-5">Fresh organic produce for any occasion</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {EVENT_TYPES.map(({ label, emoji, desc }) => (
              <div key={label}
                className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-amber-200 hover:shadow-sm transition-all"
              >
                <span className="text-3xl">{emoji}</span>
                <p className="text-sm font-bold text-slate-900 mt-2">{label}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-10 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold text-slate-900">How it works</h2>
            <p className="text-sm text-slate-500 mt-1">Simple 3-step process from request to delivery</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} className="relative">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
                  <span className="text-3xl font-extrabold text-amber-100">{step}</span>
                  <p className="text-sm font-bold text-slate-900 mt-2">{title}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form ── */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Request a Quote</h2>
              <p className="text-sm text-slate-500 mt-1">Tell us about your event and we&apos;ll send you a custom price.</p>
            </div>
            <BulkOrderForm />
          </div>

          <div className="mt-5 flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Prefer to call?</p>
              <a href="tel:+919876543210" className="text-sm text-green-600 hover:text-green-700 transition-colors font-medium">
                +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
