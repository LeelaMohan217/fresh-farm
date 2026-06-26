import { notFound } from "next/navigation";
import pool from "@/lib/pg";
import { getSession } from "@/lib/auth";
import CategoryShopSection from "@/components/user/CategoryShopSection";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Get this top-level category
  const catRes = await pool.query(
    `SELECT id, name, slug, image_url FROM categories WHERE slug = $1 AND parent_id IS NULL AND active = TRUE`,
    [slug]
  );
  if (!catRes.rowCount) notFound();
  const category = catRes.rows[0];

  // Get sub-categories
  const subRes = await pool.query(
    `SELECT id, name, slug, image_url FROM categories WHERE parent_id = $1 AND active = TRUE ORDER BY name ASC`,
    [category.id]
  );

  // Resolve customer branch
  const session = await getSession();
  let branchId: number | null = null;
  if (session?.email) {
    const { rows } = await pool.query(
      `SELECT bp.branch_id
       FROM customer_addresses ca
       JOIN customers c ON c.id = ca.customer_id
       JOIN branch_pincodes bp ON bp.pincode = ca.pincode
       JOIN branches b ON b.id = bp.branch_id AND b.active = TRUE
       WHERE c.email = $1
       ORDER BY ca.created_at DESC LIMIT 1`,
      [session.email]
    );
    branchId = rows[0]?.branch_id ?? null;
  }

  // Get all products in this category (across all sub-categories)
  const prodRes = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.unit, p.stock,
            p.category_id, p.image_url, p.image_urls,
            c.name AS category_name, c.slug AS category_slug
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE c.parent_id = $1
       AND p.stock > 0
       AND (p.branch_id = $2 OR p.branch_id IS NULL OR $2::int IS NULL)
     ORDER BY p.created_at DESC`,
    [category.id, branchId]
  );

  const subCategories = subRes.rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    slug: r.slug as string,
    imageUrl: (r.image_url ?? null) as string | null,
  }));

  const products = prodRes.rows.map((p) => ({
    id: p.id as number,
    name: p.name as string,
    description: (p.description ?? "") as string,
    price: Number(p.price),
    unit: p.unit as string,
    stock: p.stock as number,
    categoryId: p.category_id as number,
    categoryName: p.category_name as string,
    categorySlug: p.category_slug as string,
    imageUrl: (p.image_url ?? null) as string | null,
    imageUrls: (Array.isArray(p.image_urls) && p.image_urls.length > 0
      ? p.image_urls
      : p.image_url ? [p.image_url] : []) as string[],
  }));

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <CategoryShopSection
          categoryName={category.name as string}
          categorySlug={category.slug as string}
          subCategories={subCategories}
          products={products}
        />
      </div>
    </div>
  );
}
