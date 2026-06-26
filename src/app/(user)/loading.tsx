export default function Loading() {
  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero skeleton */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="animate-pulse space-y-4 max-w-lg">
            <div className="h-6 bg-slate-200 rounded-full w-56" />
            <div className="h-12 bg-slate-200 rounded-lg w-full" />
            <div className="h-12 bg-slate-200 rounded-lg w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
            <div className="flex gap-3 pt-2">
              <div className="h-11 bg-slate-200 rounded-xl w-36" />
              <div className="h-11 bg-slate-200 rounded-xl w-36" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured products skeleton */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-5 bg-slate-200 rounded w-28 mb-6 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-36 bg-slate-200" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-5 bg-slate-200 rounded w-1/3 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
