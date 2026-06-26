import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import pool from "@/lib/pg";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "farmfresh-admin-secret-change-in-production"
);
const COOKIE = "ff_admin_token";

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    const { rows } = await pool.query(
      "SELECT id, name, email, password, role, branch_id FROM admins WHERE email = $1",
      [email.toLowerCase()]
    );

    if (!rows.length)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const admin = rows[0];
    const valid = await compare(password, admin.password);
    if (!valid)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    // Extend session to 30 days if remember me is checked
    const expirationTime = rememberMe ? "30d" : "7d";
    const maxAgeSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;

    const token = await new SignJWT({ id: admin.id, name: admin.name, email: admin.email, role: admin.role, branchId: admin.branch_id ?? null })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(expirationTime)
      .sign(SECRET);

    const res = NextResponse.json({ id: admin.id, name: admin.name, email: admin.email, role: admin.role, branchId: admin.branch_id ?? null });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAgeSeconds,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("ADMIN LOGIN ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
