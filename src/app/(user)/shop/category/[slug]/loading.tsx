export default function Loading() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Heading skeleton */}
        <div className="px-3 pt-3 pb-2">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
        </div>

        <div className="flex bg-white border-t border-slate-100 min-h-[80vh]">
          {/* Sidebar skeleton */}
          <aside className="w-20 sm:w-24 shrink-0 border-r border-slate-100 py-2 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 px-2 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="h-2.5 w-10 bg-slate-200 rounded" />
              </div>
            ))}
          </aside>

          {/* Product grid skeleton */}
          <div className="flex-1 p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-36 bg-slate-200" />
                  <div className="px-2 pt-1.5 pb-2 space-y-1.5">
                    <div className="h-2.5 w-12 bg-slate-200 rounded" />
                    <div className="h-3.5 w-full bg-slate-200 rounded" />
                    <div className="h-3 w-10 bg-slate-200 rounded" />
                    <div className="mt-2 h-3 w-14 bg-slate-200 rounded" />
                    <div className="mt-2 h-8 w-full bg-slate-200 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
