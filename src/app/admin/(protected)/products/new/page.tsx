import { redirect } from "next/navigation";
import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import AddProductForm from "@/components/admin/products/AddProductForm";

export const dynamic = "force-dynamic";

export type CategoryGroup = {
  parentId: number;
  parentName: string;
  subs: { id: number; name: string }[];
};

export default async function AddProductPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const isBranchAdmin = session.role === "admin" && session.branchId !== null;

  const [catRes, branchRes] = await Promise.all([
    pool.query(`
      SELECT c.id, c.name, p.id AS parent_id, p.name AS parent_name
      FROM categories c
      JOIN categories p ON p.id = c.parent_id
      WHERE c.parent_id IS NOT NULL AND c.active = TRUE
      ORDER BY p.name ASC, c.name ASC
    `),
    isBranchAdmin
      ? Promise.resolve({ rows: [] })
      : pool.query(`SELECT id, name FROM branches WHERE active = TRUE ORDER BY name ASC`),
  ]);

  // Group sub-categories by parent
  const groupMap = new Map<number, CategoryGroup>();
  for (const r of catRes.rows) {
    if (!groupMap.has(r.parent_id)) {
      groupMap.set(r.parent_id, { parentId: r.parent_id, parentName: r.parent_name, subs: [] });
    }
    groupMap.get(r.parent_id)!.subs.push({ id: r.id as number, name: r.name as string });
  }
  const categoryGroups = Array.from(groupMap.values());

  return (
    <div className="h-full max-w-4xl mx-auto">
      <AddProductForm
        categoryGroups={categoryGroups}
        branches={branchRes.rows.map((b) => ({ id: b.id as number, name: b.name as string }))}
        defaultBranchId={isBranchAdmin ? (session.branchId ?? null) : null}
        isBranchAdmin={isBranchAdmin}
      />
    </div>
  );
}
