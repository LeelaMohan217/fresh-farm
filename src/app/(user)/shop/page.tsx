export const dynamic = "force-dynamic";

import pool from "@/lib/pg";
import Link from "next/link";
import Image from "next/image";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1506484381205-f7945653044d?w=400&h=300&fit=crop";

async function getCategories() {
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
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    slug: r.slug as string,
    imageUrl: (r.image_url ?? null) as string | null,
    subCount: r.sub_count as number,
    productCount: r.product_count as number,
  }));
}

async function searchProducts(q: string) {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.price, p.unit, p.stock, p.image_url,
            sub.name AS category_name,
            COALESCE(top.slug, sub.slug) AS top_slug
     FROM products p
     JOIN categories sub ON sub.id = p.category_id
     LEFT JOIN categories top ON top.id = sub.parent_id
     WHERE p.name ILIKE $1
     ORDER BY (p.stock > 0) DESC, p.name ASC`,
    [`%${q}%`]
  );
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    price: Number(r.price),
    unit: r.unit as string,
    stock: r.stock as number,
    imageUrl: (r.image_url ?? null) as string | null,
    categoryName: r.category_name as string,
    categorySlug: r.top_slug as string,
  }));
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  /* ── Search results view ── */
  if (query) {
    const products = await searchProducts(query);

    return (
      <div className="bg-[#F8FAFC] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

          {/* Header */}
          <div className="mb-5">
            <p className="text-[13px] text-slate-400 mb-1">
              Search results for
            </p>
            <h1 className="text-[18px] font-bold text-slate-900">&ldquo;{query}&rdquo;</h1>
            {products.length > 0 && (
              <p className="text-[13px] text-slate-500 mt-0.5">{products.length} product{products.length !== 1 ? "s" : ""} found</p>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-[16px] font-semibold text-slate-700">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-[13px] text-slate-400 mt-1 mb-6">Try a different keyword or browse by category</p>
              <Link href="/shop" className="inline-flex px-5 py-2.5 bg-green-600 text-white text-[14px] font-semibold rounded-xl hover:bg-green-700 transition-colors">
                Browse all categories
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((p) => {
                const discountPct = 13;
                const mrp = +(p.price * (100 / (100 - discountPct))).toFixed(0);
                return (
                  <Link
                    key={p.id}
                    href={`/shop/product/${p.id}`}
                    className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-sm transition-all flex flex-col"
                  >
                    <div className="relative h-36 bg-[#f5f5f5] overflow-hidden">
                      <Image
                        src={p.imageUrl ?? FALLBACK_IMAGE}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized={!p.imageUrl}
                      />
                      <div className="absolute top-0 left-0 bg-[#3f51b5] text-white text-[10px] font-extrabold px-1.5 py-1 leading-tight rounded-br-lg">
                        {discountPct}%<br />OFF
                      </div>
                      {p.stock === 0 && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border">Out of stock</span>
                        </div>
                      )}
                    </div>
                    <div className="px-3 pt-2 pb-3 flex flex-col flex-1 gap-1">
                      <p className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 flex-1">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.unit}</p>
                      <div className="flex items-end justify-between mt-1">
                        <div>
                          <p className="text-[13px] font-extrabold text-slate-900">₹{p.price}</p>
                          <p className="text-[11px] text-slate-400 line-through">₹{mrp}</p>
                        </div>
                        {p.stock > 0 && (
                          <span className="text-[11px] font-bold text-green-600 border border-green-500 rounded-lg px-2 py-0.5 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            ADD
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-8 text-center">
              <Link href="/shop" className="text-[13px] text-green-600 font-medium hover:text-green-700 transition-colors">
                ← Browse all categories
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Category grid view ── */
  const categories = await getCategories();

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-5">
          <h1 className="text-[18px] font-bold text-slate-900">Shop by Category</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Fresh produce delivered in minutes</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-[16px] font-semibold">No categories available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop/category/${cat.slug}`}
                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-green-200 transition-all duration-200"
              >
                <div className="relative h-36 bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
                  <Image
                    src={cat.imageUrl ?? FALLBACK_IMAGE}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={!cat.imageUrl}
                  />
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-slate-900 leading-tight">{cat.name}</p>
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
