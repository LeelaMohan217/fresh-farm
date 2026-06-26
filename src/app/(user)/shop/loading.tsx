export default function Loading() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Header skeleton */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-20" />
          <div className="h-4 bg-slate-200 rounded w-64 mt-2" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Category pills skeleton */}
        <div className="flex gap-2 mb-6 overflow-hidden animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-200 rounded-full shrink-0" style={{ width: `${60 + i * 8}px` }} />
          ))}
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-200" />
              <div className="p-3.5 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-9 bg-slate-200 rounded-xl mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
