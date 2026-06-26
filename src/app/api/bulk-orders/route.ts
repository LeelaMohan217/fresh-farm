import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import pool from "@/lib/pg";
import { getSession } from "@/lib/auth";

function generateId() {
  return "BO-" + randomBytes(5).toString("hex").toUpperCase();
}

const VALID_EVENT_TYPES = new Set(["Wedding", "Birthday", "Corporate", "Festival", "Other"]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Sign in to submit a bulk order request." }, { status: 401 });

  try {
    const { eventType, deliveryDate, itemsDesc, quantityDesc } = await req.json();

    if (!eventType || !deliveryDate || !itemsDesc?.trim() || !quantityDesc?.trim())
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });

    if (!VALID_EVENT_TYPES.has(eventType))
      return NextResponse.json({ error: "Invalid event type." }, { status: 400 });

    const delivery = new Date(deliveryDate);
    if (isNaN(delivery.getTime()) || delivery <= new Date())
      return NextResponse.json({ error: "Delivery date must be in the future." }, { status: 400 });

    const custResult = await pool.query(
      "SELECT id FROM customers WHERE email = $1",
      [session.email]
    );
    if (!custResult.rowCount || custResult.rowCount === 0)
      return NextResponse.json({ error: "Customer account not found." }, { status: 404 });

    const customerId = custResult.rows[0].id as string;
    const id = generateId();

    await pool.query(
      `INSERT INTO bulk_orders
         (id, customer_id, event_type, status, booking_date, delivery_date, quantity_desc, items_desc, total, created_at, updated_at)
       VALUES ($1, $2, $3, 'Pending', NOW(), $4, $5, $6, 0, NOW(), NOW())`,
      [id, customerId, eventType, delivery, quantityDesc.trim(), itemsDesc.trim()]
    );

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("BULK ORDER ERROR:", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
