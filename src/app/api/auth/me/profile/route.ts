import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  await pool.query(
    "UPDATE customers SET name = $1, phone = $2, updated_at = NOW() WHERE email = $3",
    [name.trim(), phone?.trim() || null, session.email]
  );

  return NextResponse.json({ ok: true });
}
