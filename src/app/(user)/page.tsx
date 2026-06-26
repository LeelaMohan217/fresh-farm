export const dynamic = "force-dynamic";

import pool from "@/lib/pg";
import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import {
  ShoppingBag, Leaf, Droplets, ArrowRight,
  CheckCircle2, Star, Wind,
} from "lucide-react";
import HeroBanner from "@/components/user/HeroBanner";
import CategoryGrid from "@/components/user/CategoryGrid";

type TopCategory = {
  id: number; name: string; slug: string; imageUrl: string | null;
};

type Product = {
  id: number; name: string; price: number; unit: string;
  imageUrl: string | null; categoryName: string;
  topCategorySlug: string; topCategoryName: string;
};

type CategorySection = {
  id: number; name: string; slug: string; imageUrl: string | null; products: Product[];
};

const getHomeData = unstable_cache(
  async () => {
    const [catRes, prodRes, servicesRes] = await Promise.all([
      /* Top-level categories with image */
      pool.query(`
        SELECT id, name, slug, image_url
        FROM categories
        WHERE parent_id IS NULL AND active = TRUE
        ORDER BY name ASC
      `),
      /* Products joined through sub-category → top-level category */
      pool.query(`
        SELECT p.id, p.name, p.price, p.unit, p.image_url,
               sub.name AS sub_name,
               top.id   AS top_id,
               top.name AS top_name,
               top.slug AS top_slug
        FROM products p
        JOIN categories sub ON sub.id = p.category_id AND sub.parent_id IS NOT NULL
        JOIN categories top ON top.id = sub.parent_id AND top.active = TRUE
        WHERE p.stock > 0
        ORDER BY top.name ASC, p.created_at DESC
      `),
      pool.query(`
        SELECT id, name, type, price, description
        FROM services
        WHERE status = 'Active' AND type IN ('Hydroponic','Aeroponic')
        ORDER BY type ASC
      `),
    ]);

    const topCategories: TopCategory[] = catRes.rows.map((r) => ({
      id: r.id as number,
      name: r.name as string,
      slug: r.slug as string,
      imageUrl: (r.image_url ?? null) as string | null,
    }));

    /* Group products under their top-level category (max 12 each) */
    const sectionMap = new Map<number, CategorySection>();
    for (const cat of topCategories) {
      sectionMap.set(cat.id, { id: cat.id, name: cat.name, slug: cat.slug, imageUrl: cat.imageUrl, products: [] });
    }
    for (const p of prodRes.rows) {
      const sec = sectionMap.get(p.top_id);
      if (sec && sec.products.length < 12) {
        sec.products.push({
          id: p.id as number, name: p.name as string,
          price: Number(p.price), unit: p.unit as string,
          imageUrl: (p.image_url ?? null) as string | null,
          categoryName: p.sub_name as string,
          topCategorySlug: p.top_slug as string,
          topCategoryName: p.top_name as string,
        });
      }
    }

    return {
      topCategories,
      sections: Array.from(sectionMap.values()).filter((s) => s.products.length > 0),
      services: servicesRes.rows.map((s) => ({
        id: s.id as number, name: s.name as string, type: s.type as string,
        price: Number(s.price), description: (s.description ?? "") as string,
      })),
    };
  },
  ["home-data"],
  { tags: ["products", "services", "categories"] }
);

const WHY_US = [
  { icon: Leaf,         title: "100% Organic",    desc: "No pesticides, no chemicals. Every product is naturally grown." },
  { icon: Droplets,     title: "Hydroponic grown", desc: "Water-smart tech that uses 95% less water than soil farming." },
  { icon: CheckCircle2, title: "Daily fresh",      desc: "Harvested same-day and delivered to your door while fresh." },
  { icon: Star,         title: "4.9★ Rated",       desc: "Loved by 200+ customers across Hyderabad." },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/shop/category/${product.topCategorySlug}`}
      className="flex-shrink-0 w-36 sm:w-44 bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-green-100 transition-all duration-200 group flex flex-col"
    >
      <div className="relative bg-green-50 flex items-center justify-center overflow-hidden" style={{ height: 140 }}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl} alt={product.name}
            fill className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="176px"
          />
        ) : (
          <span className="text-5xl group-hover:scale-110 transition-transform duration-200 select-none">🌱</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-[11px] text-slate-400 font-medium">{product.categoryName}</p>
        <p className="text-sm font-bold text-slate-900 leading-tight line-clamp-2 flex-1">{product.name}</p>
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <p className="text-sm font-extrabold text-green-600">
            ₹{product.price}
            <span className="text-[11px] text-slate-400 font-medium ml-0.5">/{product.unit}</span>
          </p>
          <span className="text-[11px] font-bold text-green-600 border border-green-500 rounded-lg px-2 py-0.5 group-hover:bg-green-600 group-hover:text-white transition-colors">
            ADD
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const { topCategories, sections, services } = await getHomeData();

  return (
    <div className="bg-[#F8FAFC]">

      {/* ── Banner ── */}
      <section className="bg-white border-b border-slate-100 pb-4 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <HeroBanner />
        </div>
      </section>

      {/* ── Shop by Category ── */}
      {topCategories.length > 0 && (
        <section className="bg-white border-b border-slate-100 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-5">
              <h2 className="text-[14px] font-bold text-slate-900">Shop by Category</h2>
            </div>
            <CategoryGrid categories={topCategories} />
          </div>
        </section>
      )}

      {/* ── Product sections by top-level category ── */}
      {sections.length > 0 ? (
        sections.map((sec) => (
          <section key={sec.id} className="bg-white border-b border-slate-100 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-bold text-slate-900">{sec.name}</h2>
                <Link
                  href={`/shop/category/${sec.slug}`}
                  className="text-[13px] font-semibold text-green-600 hover:text-green-700 transition-colors"
                >
                  See all
                </Link>
              </div>

              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
                {sec.products.slice(0, 6).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        ))
      ) : (
        <section className="bg-white border-b border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <span className="text-5xl">🌱</span>
            <p className="text-slate-500 text-sm">Products coming soon — check back shortly!</p>
            <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700">
              Browse shop <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Why us ── */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Why FarmFresh?</h2>
            <p className="text-sm text-slate-500 mt-1">Pure, fresh and grown with care</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_US.map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.title} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-center hover:border-green-200 hover:bg-green-50/40 transition-all">
                  <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">{w.title}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Services teaser ── */}
      {services.length > 0 && (
        <section className="py-12 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Installation Services</h2>
                <p className="text-sm text-slate-500 mt-0.5">We bring the farm to your home</p>
              </div>
              <Link href="/services" className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors">
                see all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((s) => {
                const isHydro = s.type === "Hydroponic";
                return (
                  <Link key={s.id} href={`/services/${s.type.toLowerCase()}`}
                    className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md hover:border-green-200 transition-all group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isHydro ? "bg-blue-100" : "bg-purple-100"}`}>
                      {isHydro ? <Droplets className="w-6 h-6 text-blue-600" /> : <Wind className="w-6 h-6 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-green-700 transition-colors">{s.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{s.description}</p>
                      <p className="text-sm font-bold text-slate-900 mt-2">
                        From ₹{s.price.toLocaleString("en-IN")}
                        <span className="text-xs text-slate-400 font-normal ml-1.5 inline-flex items-center gap-1">
                          Learn more <ArrowRight className="w-3 h-3" />
                        </span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
