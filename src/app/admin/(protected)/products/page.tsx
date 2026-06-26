import { redirect } from "next/navigation";
import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import ProductsTable from "@/components/admin/products/ProductsTable";

export const dynamic = "force-dynamic";

export default async function AllProductsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const isBranchAdmin = session.role === "admin" && session.branchId !== null;
  const branchId = isBranchAdmin ? session.branchId : null;

  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.unit, p.stock, p.branch_id,
            COALESCE(c.name, '(No category)') AS category_name, b.name AS branch_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN branches b ON b.id = p.branch_id
     ${isBranchAdmin ? "WHERE (p.branch_id = $1 OR p.branch_id IS NULL)" : ""}
     ORDER BY p.created_at DESC`,
    isBranchAdmin ? [branchId] : []
  );

  const products = rows.map((p) => ({
    id: p.id as number,
    name: p.name as string,
    description: (p.description ?? "") as string,
    price: Number(p.price),
    unit: p.unit as string,
    stock: p.stock as number,
    categoryName: p.category_name as string,
    branchId: p.branch_id as number | null,
    branchName: (p.branch_name ?? null) as string | null,
  }));

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      <ProductsTable products={products} isBranchAdmin={isBranchAdmin} />
    </div>
  );
}
