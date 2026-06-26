import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";
import pool from "@/lib/pg";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session || session.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  const [branchRes, pincodeRes, adminRes] = await Promise.all([
    pool.query(`SELECT id, name, location, address, phone, active, created_at FROM branches WHERE id = $1`, [id]),
    pool.query(`SELECT pincode FROM branch_pincodes WHERE branch_id = $1 ORDER BY pincode ASC`, [id]),
    pool.query(`SELECT id, name, email, role, phone FROM admins WHERE branch_id = $1 ORDER BY name ASC`, [id]),
  ]);

  if (!branchRes.rowCount)
    return NextResponse.json({ error: "Branch not found." }, { status: 404 });

  return NextResponse.json({
    ...branchRes.rows[0],
    pincodes: pincodeRes.rows.map((r) => r.pincode as string),
    admins: adminRes.rows,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session || session.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const { name, location, address, phone, active, pincodes } = await req.json();

  if (!name?.trim())
    return NextResponse.json({ error: "Branch name is required." }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE branches SET name = $1, location = $2, address = $3, phone = $4, active = $5, updated_at = NOW()
       WHERE id = $6 RETURNING id, name, location, address, phone, active`,
      [name.trim(), location?.trim() ?? null, address?.trim() ?? null, phone?.trim() ?? null, active ?? true, id]
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Branch not found." }, { status: 404 });
    }

    const validPincodes: string[] = (pincodes ?? []).filter((p: string) => /^\d{6}$/.test(p));

    // Block if any pincodes are taken by OTHER branches
    if (validPincodes.length > 0) {
      const { rows: conflicts } = await client.query(
        `SELECT bp.pincode, b.name as branch_name
         FROM branch_pincodes bp
         JOIN branches b ON b.id = bp.branch_id
         WHERE bp.pincode = ANY($1) AND bp.branch_id != $2`,
        [validPincodes, id]
      );
      if (conflicts.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "pincode_conflict", conflicts: conflicts.map((r) => ({ pincode: r.pincode, branch: r.branch_name })) }, { status: 409 });
      }
    }

    await client.query("DELETE FROM branch_pincodes WHERE branch_id = $1", [id]);
    for (const pincode of validPincodes) {
      await client.query(
        `INSERT INTO branch_pincodes (branch_id, pincode) VALUES ($1, $2) ON CONFLICT (pincode) DO NOTHING`,
        [id, pincode]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ...result.rows[0], pincodes: validPincodes });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("UPDATE BRANCH ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session || session.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  await pool.query("UPDATE admins SET branch_id = NULL WHERE branch_id = $1", [id]);
  await pool.query("DELETE FROM branches WHERE id = $1", [id]);

  return NextResponse.json({ ok: true });
}
