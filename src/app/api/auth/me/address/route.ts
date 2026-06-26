import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await pool.query(
    "SELECT address, pincode FROM customers WHERE email = $1",
    [session.email]
  );
  if (!result.rowCount) return NextResponse.json({ address: null, pincode: null });

  const row = result.rows[0];
  return NextResponse.json({ address: row.address ?? null, pincode: row.pincode ?? null });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { address, pincode } = await req.json();

  if (!address?.trim() || !pincode?.trim())
    return NextResponse.json({ error: "Address and pincode are required." }, { status: 400 });

  if (!/^\d{6}$/.test(pincode))
    return NextResponse.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });

  await pool.query(
    "UPDATE customers SET address = $1, pincode = $2, updated_at = NOW() WHERE email = $3",
    [address.trim(), pincode.trim(), session.email]
  );

  return NextResponse.json({ ok: true });
}
