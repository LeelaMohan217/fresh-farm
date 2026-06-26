import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "Both fields are required." }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });

  const { rows } = await pool.query("SELECT password FROM customers WHERE email = $1", [session.email]);
  if (!rows.length) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, rows[0].password);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query("UPDATE customers SET password = $1, updated_at = NOW() WHERE email = $2", [hash, session.email]);

  return NextResponse.json({ ok: true });
}
