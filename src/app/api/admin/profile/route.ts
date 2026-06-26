import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import pool from "@/lib/pg";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "farmfresh-admin-secret-change-in-production"
);

async function getAdminId() {
  const jar = await cookies();
  const token = jar.get("ff_admin_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.id as string;
  } catch { return null; }
}

// Update name or email
export async function PATCH(req: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { name, email } = await req.json();
    if (!name?.trim() || !email?.trim())
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });

    const existing = await pool.query(
      "SELECT id FROM admins WHERE email = $1 AND id != $2", [email, adminId]
    );
    if (existing.rowCount && existing.rowCount > 0)
      return NextResponse.json({ error: "Email already in use by another admin." }, { status: 409 });

    await pool.query(
      "UPDATE admins SET name=$1, email=$2, updated_at=NOW() WHERE id=$3",
      [name.trim(), email.trim().toLowerCase(), adminId]
    );
    return NextResponse.json({ ok: true, name: name.trim(), email: email.trim().toLowerCase() });
  } catch (e) {
    console.error("PROFILE PATCH ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// Change password
export async function POST(req: NextRequest) {
  try {
    const adminId = await getAdminId();
    if (!adminId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: "Both passwords are required." }, { status: 400 });
    if (newPassword.length < 6)
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });

    const { rows } = await pool.query("SELECT password FROM admins WHERE id = $1", [adminId]);
    if (!rows.length) return NextResponse.json({ error: "Admin not found." }, { status: 404 });

    const valid = await compare(currentPassword, rows[0].password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

    const hashed = await hash(newPassword, 10);
    await pool.query("UPDATE admins SET password=$1, updated_at=NOW() WHERE id=$2", [hashed, adminId]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("CHANGE PASSWORD ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
