import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { revalidateTag } from "next/cache";
import pool from "@/lib/pg";
import { signToken, COOKIE } from "@/lib/auth";

function generateCustomerId() {
  return `CUST-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random().toString(36).toUpperCase().slice(2, 5)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });

    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const existing = await pool.query(
      "SELECT id FROM customers WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    if (existing.rowCount && existing.rowCount > 0)
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

    const hashed = await hash(password, 10);
    const customerId = generateCustomerId();
    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `INSERT INTO customers (id, name, email, phone, password, status, joined_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'Active', NOW(), NOW(), NOW())
       RETURNING id, name, email`,
      [customerId, name.trim(), normalizedEmail, phone.trim(), hashed]
    );

    const customer = result.rows[0];

    revalidateTag("customers", {});

    const token = await signToken({ id: customer.id, name: customer.name, email: customer.email });

    const res = NextResponse.json({ id: customer.id, name: customer.name, email: customer.email });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (e) {
    const pg = e as { code?: string };
    if (pg.code === "23505")
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    console.error("REGISTER ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
