import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "farmfresh-admin-secret-change-in-production"
);

export async function GET() {
  try {
    const jar = await cookies();
    const token = jar.get("ff_admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    return NextResponse.json({
      id:    payload.id,
      name:  payload.name,
      email: payload.email,
      role:  payload.role,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
