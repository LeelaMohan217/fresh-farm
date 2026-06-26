import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/pg";

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query(`
    SELECT b.id, b.name, b.location, b.address, b.phone, b.active, b.created_at,
      (SELECT COALESCE(JSON_AGG(bp.pincode ORDER BY bp.pincode), '[]')
       FROM branch_pincodes bp WHERE bp.branch_id = b.id) AS pincodes,
      (SELECT COALESCE(JSON_AGG(jsonb_build_object('id', a.id, 'name', a.name, 'role', a.role) ORDER BY a.name), '[]')
       FROM admins a WHERE a.branch_id = b.id) AS admins
    FROM branches b
    ORDER BY b.name ASC
  `);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session || session.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { name, location, address, phone, pincodes } = await req.json();

  if (!name?.trim())
    return NextResponse.json({ error: "Branch name is required." }, { status: 400 });

  const validPincodes: string[] = (pincodes ?? []).filter((p: string) => /^\d{6}$/.test(p));

  // Block if any pincodes are already taken
  if (validPincodes.length > 0) {
    const { rows: conflicts } = await pool.query(
      `SELECT bp.pincode, b.name as branch_name
       FROM branch_pincodes bp
       JOIN branches b ON b.id = bp.branch_id
       WHERE bp.pincode = ANY($1)`,
      [validPincodes]
    );
    if (conflicts.length > 0)
      return NextResponse.json({ error: "pincode_conflict", conflicts: conflicts.map((r) => ({ pincode: r.pincode, branch: r.branch_name })) }, { status: 409 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO branches (name, location, address, phone, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
       RETURNING id, name, location, address, phone, active`,
      [name.trim(), location?.trim() ?? null, address?.trim() ?? null, phone?.trim() ?? null]
    );
    const branch = result.rows[0];

    for (const pincode of validPincodes) {
      await client.query(
        `INSERT INTO branch_pincodes (branch_id, pincode) VALUES ($1, $2) ON CONFLICT (pincode) DO NOTHING`,
        [branch.id, pincode]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ...branch, pincodes: validPincodes }, { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("CREATE BRANCH ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  } finally {
    client.release();
  }
}
