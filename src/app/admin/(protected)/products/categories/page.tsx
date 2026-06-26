import pool from "@/lib/pg";
import CategoriesClient from "@/components/admin/products/CategoriesClient";

export const dynamic = "force-dynamic";

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  active: boolean;
  parentId: number | null;
  createdAt: string;
  productCount: number;
  subCount: number;
};

async function getCategories(): Promise<CategoryRow[]> {
  const { rows } = await pool.query(`
    SELECT c.id, c.name, c.slug, c.image_url, c.active, c.created_at,
           COUNT(DISTINCT s.id)::int AS sub_count
    FROM categories c
    LEFT JOIN categories s ON s.parent_id = c.id
    WHERE c.parent_id IS NULL
    GROUP BY c.id
    ORDER BY c.name ASC
  `);

  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    slug: r.slug as string,
    imageUrl: (r.image_url ?? null) as string | null,
    active: r.active as boolean,
    parentId: null,
    createdAt: new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    productCount: 0,
    subCount: r.sub_count as number,
  }));
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="h-full max-w-5xl mx-auto">
      <CategoriesClient categories={categories} />
    </div>
  );
}
