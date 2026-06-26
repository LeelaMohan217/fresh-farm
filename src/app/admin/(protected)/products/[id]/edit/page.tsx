import { notFound, redirect } from "next/navigation";
import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import EditProductForm from "@/components/admin/products/EditProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, getAdminSession()]);
  if (!session) redirect("/admin/login");

  const productId = parseInt(id, 10);
  if (isNaN(productId)) notFound();

  const isBranchAdmin = session.role === "admin" && session.branchId !== null;

  const [productResult, categoriesResult, branchResult] = await Promise.all([
    pool.query(
      `SELECT id, name, description, price, unit, category_id, stock, image_url, image_urls, branch_id
       FROM products WHERE id = $1`,
      [productId]
    ),
    pool.query(`SELECT id, name FROM categories ORDER BY name ASC`),
    isBranchAdmin
      ? Promise.resolve({ rows: [] })
      : pool.query(`SELECT id, name FROM branches WHERE active = TRUE ORDER BY name ASC`),
  ]);

  if (!productResult.rows.length) notFound();

  const row = productResult.rows[0];

  // Branch admin cannot edit products outside their branch
  if (isBranchAdmin && row.branch_id !== session.branchId) notFound();

  let imageUrls: string[] = [];
  if (Array.isArray(row.image_urls) && row.image_urls.length > 0) {
    imageUrls = row.image_urls as string[];
  } else if (row.image_url) {
    imageUrls = [row.image_url as string];
  }

  const product = {
    id:          row.id as number,
    name:        row.name as string,
    description: (row.description ?? "") as string,
    price:       Number(row.price),
    unit:        row.unit as string,
    categoryId:  row.category_id as number,
    stock:       row.stock as number,
    imageUrls,
    branchId:    row.branch_id as number | null,
  };

  return (
    <EditProductForm
      product={product}
      categories={categoriesResult.rows.map((c) => ({ id: c.id as number, name: c.name as string }))}
      branches={branchResult.rows.map((b) => ({ id: b.id as number, name: b.name as string }))}
      isBranchAdmin={isBranchAdmin}
    />
  );
}
