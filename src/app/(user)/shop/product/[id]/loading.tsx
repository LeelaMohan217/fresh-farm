export default function Loading() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
        {/* Back link skeleton */}
        <div className="h-4 w-20 bg-slate-200 rounded mb-6" />

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Image skeleton */}
            <div className="sm:w-72 h-64 sm:h-80 bg-slate-200 shrink-0" />

            {/* Detail skeleton */}
            <div className="flex-1 p-6 space-y-4">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-6 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-8 w-28 bg-slate-200 rounded mt-4" />
              <div className="h-11 w-full bg-slate-200 rounded-xl mt-6" />
            </div>
          </div>
        </div>

        {/* Similar products skeleton */}
        <div className="mt-8">
          <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-36 shrink-0 bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="h-36 bg-slate-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-200 rounded" />
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
