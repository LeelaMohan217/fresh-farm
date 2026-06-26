import { redirect } from "next/navigation";
import pool from "@/lib/pg";
import { getAdminSession } from "@/lib/auth";
import AdminsClient from "@/components/admin/admins/AdminsClient";

export const dynamic = "force-dynamic";

async function getAdmins(branchId: number | null) {
  const isBranchAdmin = branchId !== null;
  const { rows } = await pool.query(
    `SELECT a.id, a.name, a.email, a.role, a.branch_id, b.name as branch_name,
           a.phone, a.secondary_phone, a.created_at
    FROM admins a
    LEFT JOIN branches b ON b.id = a.branch_id
    ${isBranchAdmin ? "WHERE a.branch_id = $1" : ""}
    ORDER BY a.created_at ASC`,
    isBranchAdmin ? [branchId] : []
  );
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    role: r.role as string,
    branchId: r.branch_id as number | null,
    branch: r.branch_name as string | null,
    phone: r.phone as string | null,
    secondaryPhone: r.secondary_phone as string | null,
    createdAt: new Date(r.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    }),
  }));
}

async function getBranches() {
  const { rows } = await pool.query(
    `SELECT id, name FROM branches WHERE active = TRUE ORDER BY name ASC`
  );
  return rows as { id: number; name: string }[];
}

export default async function AdminsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "superadmin") redirect("/admin/dashboard");

  const admins = await getAdmins(null);
  const branches = await getBranches();

  return (
    <div className="h-full max-w-6xl mx-auto">
      <AdminsClient
        admins={admins}
        branches={branches}
        currentAdminId={session.id}
        currentAdminRole={session.role}
      />
    </div>
  );
}
