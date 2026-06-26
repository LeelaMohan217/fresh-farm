import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/pg";

// GET /api/admin/branches/check-pincodes?pincodes=500034,500032&excludeId=3
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const raw = url.searchParams.get("pincodes") ?? "";
  const excludeId = url.searchParams.get("excludeId");

  const pincodes = raw.split(",").map((p) => p.trim()).filter((p) => /^\d{6}$/.test(p));
  if (!pincodes.length) return NextResponse.json({});

  const { rows } = await pool.query(
    `SELECT bp.pincode, b.name as branch_name
     FROM branch_pincodes bp
     JOIN branches b ON b.id = bp.branch_id
     WHERE bp.pincode = ANY($1)
     ${excludeId ? "AND bp.branch_id != $2" : ""}`,
    excludeId ? [pincodes, excludeId] : [pincodes]
  );

  // Build a map: pincode -> branch name (null = available)
  const result: Record<string, string | null> = {};
  for (const p of pincodes) result[p] = null;
  for (const r of rows) result[r.pincode] = r.branch_name;

  return NextResponse.json(result);
}
