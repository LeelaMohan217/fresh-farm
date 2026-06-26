import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/pg";

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get("pincode");
  if (!pincode) return NextResponse.json({ serviced: false });

  const { rows } = await pool.query(
    `SELECT b.id, b.name FROM branch_pincodes bp
     JOIN branches b ON b.id = bp.branch_id
     WHERE bp.pincode = $1 AND b.active = TRUE
     LIMIT 1`,
    [pincode]
  );

  return NextResponse.json({ serviced: rows.length > 0, branch: rows[0] ?? null });
}
