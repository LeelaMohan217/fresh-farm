import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import pool from "@/lib/pg";
import ProfileClient from "@/components/admin/profile/ProfileClient";

export const dynamic = "force-dynamic";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "farmfresh-admin-secret-change-in-production"
);

export default async function ProfilePage() {
  const jar   = await cookies();
  const token = jar.get("ff_admin_token")?.value;
  if (!token) redirect("/admin/login");

  let adminId: string;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    adminId = payload.id as string;
  } catch {
    redirect("/admin/login");
  }

  const { rows } = await pool.query(
    `SELECT id, name, email, role, created_at FROM admins WHERE id = $1`,
    [adminId]
  );
  if (!rows.length) redirect("/admin/login");

  const admin = {
    id:        rows[0].id as string,
    name:      rows[0].name as string,
    email:     rows[0].email as string,
    role:      rows[0].role as string,
    createdAt: new Date(rows[0].created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    }),
  };

  return (
    <div className="h-full max-w-2xl mx-auto">
      <ProfileClient admin={admin} />
    </div>
  );
}
