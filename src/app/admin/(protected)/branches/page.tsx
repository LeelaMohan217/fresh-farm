import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/pg";
import BranchesClient from "@/components/admin/branches/BranchesClient";

export const dynamic = "force-dynamic";

async function getBranches() {
  const { rows } = await pool.query(`
    SELECT b.id, b.name, b.location, b.address, b.phone, b.active, b.created_at,
      (SELECT COALESCE(JSON_AGG(bp.pincode ORDER BY bp.pincode), '[]')
       FROM branch_pincodes bp WHERE bp.branch_id = b.id) AS pincodes,
      (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', a.id, 'name', a.name, 'role', a.role) ORDER BY a.name), '[]')
       FROM admins a WHERE a.branch_id = b.id) AS admins
    FROM branches b
    ORDER BY b.name ASC
  `);
  return rows;
}

export default async function BranchesPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "superadmin") redirect("/admin/dashboard");

  const branches = await getBranches();
  return (
    <div className="h-full max-w-6xl mx-auto">
      <BranchesClient branches={branches} />
    </div>
  );
}
