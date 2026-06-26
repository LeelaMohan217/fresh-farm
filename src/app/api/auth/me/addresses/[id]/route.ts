import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/pg";

// DELETE — remove an address
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const cust = await pool.query("SELECT id FROM customers WHERE email = $1", [session.email]);
  if (!cust.rowCount) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const customerId = cust.rows[0].id as string;

  // Confirm address belongs to this customer
  const addr = await pool.query(
    "SELECT id, is_default FROM customer_addresses WHERE id = $1 AND customer_id = $2",
    [id, customerId]
  );
  if (!addr.rowCount) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM customer_addresses WHERE id = $1", [id]);

    // If deleted address was default, promote the next most recent one
    if (addr.rows[0].is_default) {
      await client.query(
        `UPDATE customer_addresses SET is_default = TRUE
         WHERE id = (SELECT id FROM customer_addresses WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1)`,
        [customerId]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// PUT — edit address
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { type, address, pincode, receiver_name, receiver_phone, receiver_email } = await req.json();

  if (!address?.trim()) return NextResponse.json({ error: "Address is required." }, { status: 400 });
  if (!/^\d{6}$/.test(pincode)) return NextResponse.json({ error: "Invalid pincode." }, { status: 400 });

  const cust = await pool.query("SELECT id FROM customers WHERE email = $1", [session.email]);
  if (!cust.rowCount) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const customerId = cust.rows[0].id as string;
  const result = await pool.query(
    `UPDATE customer_addresses SET type = $1, address = $2, pincode = $3,
     receiver_name = $4, receiver_phone = $5, receiver_email = $6
     WHERE id = $7 AND customer_id = $8
     RETURNING id, type, address, pincode, is_default, receiver_name, receiver_phone, receiver_email`,
    [type, address.trim(), pincode, receiver_name || null, receiver_phone || null, receiver_email || null, id, customerId]
  );
  if (!result.rowCount) return NextResponse.json({ error: "Address not found." }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

// PATCH — set as default
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const cust = await pool.query("SELECT id FROM customers WHERE email = $1", [session.email]);
  if (!cust.rowCount) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const customerId = cust.rows[0].id as string;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1",
      [customerId]
    );
    await client.query(
      "UPDATE customer_addresses SET is_default = TRUE WHERE id = $1 AND customer_id = $2",
      [id, customerId]
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
