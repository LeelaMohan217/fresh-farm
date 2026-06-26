import pool from "@/lib/pg";
import SubCategoriesClient from "@/components/admin/products/SubCategoriesClient";

export const dynamic = "force-dynamic";

export type ParentRow = {
  id: number;
  name: string;
};

export type SubCategoryRow = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  active: boolean;
  parentId: number;
  parentName: string;
  productCount: number;
};

async function getData() {
  const [parentRes, subRes] = await Promise.all([
    pool.query(`SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name ASC`),
    pool.query(`
      SELECT c.id, c.name, c.slug, c.image_url, c.active, c.parent_id,
             p.name AS parent_name,
             COUNT(pr.id)::int AS product_count
      FROM categories c
      JOIN categories p ON p.id = c.parent_id
      LEFT JOIN products pr ON pr.category_id = c.id
      WHERE c.parent_id IS NOT NULL
      GROUP BY c.id, p.name
      ORDER BY p.name ASC, c.name ASC
    `),
  ]);

  const parents: ParentRow[] = parentRes.rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
  }));

  const subCategories: SubCategoryRow[] = subRes.rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    slug: r.slug as string,
    imageUrl: (r.image_url ?? null) as string | null,
    active: r.active as boolean,
    parentId: r.parent_id as number,
    parentName: r.parent_name as string,
    productCount: r.product_count as number,
  }));

  return { parents, subCategories };
}

export default async function SubCategoriesPage() {
  const { parents, subCategories } = await getData();
  return (
    <div className="h-full max-w-5xl mx-auto">
      <SubCategoriesClient parents={parents} subCategories={subCategories} />
    </div>
  );
}
