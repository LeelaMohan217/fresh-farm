import pool from "@/lib/pg";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1506484381205-f7945653044d?w=400&h=300&fit=crop";

export default async function ShopPage() {
  const { rows } = await pool.query(`
    SELECT c.id, c.name, c.slug, c.image_url,
           COUNT(DISTINCT sub.id)::int AS sub_count,
           COUNT(p.id)::int AS product_count
    FROM categories c
    LEFT JOIN categories sub ON sub.parent_id = c.id AND sub.active = TRUE
    LEFT JOIN products p ON p.category_id = sub.id
    WHERE c.parent_id IS NULL AND c.active = TRUE
    GROUP BY c.id
    ORDER BY c.name ASC
  `);

  const categories = rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    slug: r.slug as string,
    imageUrl: (r.image_url ?? null) as string | null,
    subCount: r.sub_count as number,
    productCount: r.product_count as number,
  }));

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Shop by Category</h1>
          <p className="text-sm text-slate-500 mt-1">Fresh produce delivered in minutes</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-lg font-semibold">No categories available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop/category/${cat.slug}`}
                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-green-200 transition-all duration-200"
              >
                {/* Image */}
                <div className="relative h-36 bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
                  <Image
                    src={cat.imageUrl ?? FALLBACK_IMAGE}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={!cat.imageUrl}
                  />
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-bold text-sm text-slate-900 leading-tight">{cat.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {cat.productCount > 0
                      ? `${cat.productCount} item${cat.productCount !== 1 ? "s" : ""}`
                      : cat.subCount > 0
                      ? `${cat.subCount} sub-categor${cat.subCount !== 1 ? "ies" : "y"}`
                      : "Coming soon"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
