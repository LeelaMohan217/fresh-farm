import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import pool from "@/lib/pg";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "farmfresh-admin-secret-change-in-production"
);

async function getRequester() {
  try {
    const jar = await cookies();
    const token = jar.get("ff_admin_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: string; role: string };
  } catch {
    return null;
  }
}

function generateId() {
  return "adm_" + randomBytes(8).toString("hex");
}

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT a.id, a.name, a.email, a.role, a.branch_id, b.name as branch_name,
             a.phone, a.secondary_phone, a.created_at
      FROM admins a
      LEFT JOIN branches b ON b.id = a.branch_id
      ORDER BY a.created_at DESC
    `);
    return NextResponse.json({ admins: rows });
  } catch (e) {
    console.error("GET ADMINS ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, branchId, phone, secondaryPhone } = await req.json();

    if (!name?.trim() || !email?.trim() || !password)
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    const existing = await pool.query("SELECT id FROM admins WHERE email = $1", [email]);
    if (existing.rowCount && existing.rowCount > 0)
      return NextResponse.json({ error: "An admin with this email already exists." }, { status: 409 });

    const hashed = await hash(password, 10);
    const id = generateId();
    const parsedBranchId = branchId ? Number(branchId) : null;

    const { rows } = await pool.query(
      `INSERT INTO admins (id, name, email, password, role, branch_id, phone, secondary_phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, name, email, role, branch_id`,
      [id, name.trim(), email.trim().toLowerCase(), hashed, role ?? "admin", parsedBranchId, phone ?? null, secondaryPhone ?? null]
    );

    // Fetch branch name if assigned
    let branchName: string | null = null;
    if (rows[0].branch_id) {
      const br = await pool.query("SELECT name FROM branches WHERE id = $1", [rows[0].branch_id]);
      branchName = br.rows[0]?.name ?? null;
    }

    revalidateTag("admins");
    return NextResponse.json({
      admin: {
        ...rows[0],
        branch_name: branchName,
        phone: phone ?? null,
        secondary_phone: secondaryPhone ?? null,
        created_at: new Date().toISOString(),
      }
    }, { status: 201 });
  } catch (e) {
    console.error("CREATE ADMIN ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "Admin ID is required." }, { status: 400 });

    const requester = await getRequester();
    if (!requester)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const target = await pool.query("SELECT id, role FROM admins WHERE id = $1", [id]);
    if (!target.rowCount || target.rowCount === 0)
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });

    const targetRole = target.rows[0].role as string;

    if (requester.role !== "superadmin") {
      if (targetRole === "superadmin")
        return NextResponse.json({ error: "Only a super admin can delete another super admin." }, { status: 403 });
      return NextResponse.json({ error: "Only super admins can delete admin accounts." }, { status: 403 });
    }

    const count = await pool.query("SELECT COUNT(*)::int AS count FROM admins");
    if (count.rows[0].count <= 1)
      return NextResponse.json({ error: "Cannot delete the last admin account." }, { status: 409 });

    await pool.query("DELETE FROM admins WHERE id = $1", [id]);
    revalidateTag("admins");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE ADMIN ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, email, role, branchId, phone, secondaryPhone } = await req.json();

    if (!id) return NextResponse.json({ error: "Admin ID is required." }, { status: 400 });
    if (!name?.trim() || !email?.trim())
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });

    const parsedBranchId = branchId ? Number(branchId) : null;

    const { rows } = await pool.query(
      `UPDATE admins
       SET name = $1, email = $2, role = $3, branch_id = $4, phone = $5, secondary_phone = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, email, role, branch_id, phone, secondary_phone, created_at`,
      [name.trim(), email.trim().toLowerCase(), role ?? "admin", parsedBranchId, phone ?? null, secondaryPhone ?? null, id]
    );

    if (rows.length === 0) return NextResponse.json({ error: "Admin not found." }, { status: 404 });

    // Fetch branch name
    let branchName: string | null = null;
    if (rows[0].branch_id) {
      const br = await pool.query("SELECT name FROM branches WHERE id = $1", [rows[0].branch_id]);
      branchName = br.rows[0]?.name ?? null;
    }

    revalidateTag("admins");
    return NextResponse.json({ admin: { ...rows[0], branch_name: branchName } });
  } catch (e) {
    console.error("UPDATE ADMIN ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
