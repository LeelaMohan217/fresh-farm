import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "farmfresh-secret-key-change-in-production"
);
const COOKIE = "ff_token";

export async function signToken(payload: { id: string; name: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: string; name: string; email: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE };

// ── Admin session ──
const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "farmfresh-admin-secret-change-in-production"
);
const ADMIN_COOKIE = "ff_admin_token";

export async function getAdminSession(): Promise<{ id: string; name: string; role: string; branchId: number | null } | null> {
  try {
    const jar = await cookies();
    const token = jar.get(ADMIN_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, ADMIN_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      role: payload.role as string,
      branchId: (payload.branchId as number | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getAdminSessionFromRequest(req: import("next/server").NextRequest): Promise<{ id: string; name: string; role: string; branchId: number | null } | null> {
  try {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, ADMIN_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      role: payload.role as string,
      branchId: (payload.branchId as number | null) ?? null,
    };
  } catch {
    return null;
  }
}
