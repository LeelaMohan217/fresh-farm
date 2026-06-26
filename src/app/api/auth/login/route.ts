import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import pool from "@/lib/pg";
import { signToken, COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    const result = await pool.query(
      "SELECT id, name, email, password FROM customers WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    if (!result.rowCount || result.rowCount === 0)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const user = result.rows[0];
    const valid = await compare(password, user.password);
    if (!valid)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const token = await signToken({ id: user.id, name: user.name, email: user.email });

    const res = NextResponse.json({ id: user.id, name: user.name, email: user.email });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
