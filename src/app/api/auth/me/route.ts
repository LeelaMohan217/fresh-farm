import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(
    "SELECT id, name, email, phone FROM customers WHERE email = $1",
    [session.email]
  );
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(rows[0]);
}
