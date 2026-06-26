import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

// GET — list all addresses for current customer
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await pool.query(
    `SELECT ca.id, ca.type, ca.address, ca.pincode, ca.is_default,
            ca.receiver_name, ca.receiver_phone, ca.receiver_email
     FROM customer_addresses ca
     JOIN customers c ON c.id = ca.customer_id
     WHERE c.email = $1
     ORDER BY ca.is_default DESC, ca.created_at DESC`,
    [session.email]
  );

  return NextResponse.json(result.rows);
}

// POST — add a new address
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, address, pincode, isDefault, receiver_name, receiver_phone, receiver_email } = await req.json();

  if (!address?.trim() || !pincode?.trim())
    return NextResponse.json({ error: "Address and pincode are required." }, { status: 400 });

  if (!/^\d{6}$/.test(pincode))
    return NextResponse.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });

  const cust = await pool.query("SELECT id FROM customers WHERE email = $1", [session.email]);
  if (!cust.rowCount) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const customerId = cust.rows[0].id as string;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (isDefault) {
      await client.query(
        "UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1",
        [customerId]
      );
    }

    // First address is always default
    const countRes = await client.query(
      "SELECT COUNT(*) FROM customer_addresses WHERE customer_id = $1",
      [customerId]
    );
    const makeDefault = isDefault || Number(countRes.rows[0].count) === 0;

    const result = await client.query(
      `INSERT INTO customer_addresses (customer_id, type, address, pincode, is_default, receiver_name, receiver_phone, receiver_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, type, address, pincode, is_default, receiver_name, receiver_phone, receiver_email`,
      [customerId, type ?? "Home", address.trim(), pincode.trim(), makeDefault, receiver_name || null, receiver_phone || null, receiver_email || null]
    );

    await client.query("COMMIT");
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
