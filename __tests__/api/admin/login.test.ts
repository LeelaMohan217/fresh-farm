// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the pg pool before importing the route
vi.mock("@/lib/pg", () => ({
  default: { query: vi.fn() },
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
}));

import { POST } from "@/app/api/admin/login/route";
import pool from "@/lib/pg";
import { compare } from "bcryptjs";

const mockQuery = vi.mocked(pool.query);
const mockCompare = vi.mocked(compare);

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validAdmin = {
  id: "42",
  name: "Super Admin",
  email: "admin@farmfresh.com",
  password: "$2b$10$hashedpassword",
  role: "superadmin",
};

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Validation ───────────────────────────────────────────────────────────────

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ password: "secret" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email and password are required.");
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ email: "admin@farmfresh.com" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Email and password are required.");
  });

  it("returns 400 when body is empty", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  // ── Email normalisation ───────────────────────────────────────────────────────

  it("queries the DB with a lowercased email", async () => {
    mockQuery.mockResolvedValue({ rows: [] } as never);
    await POST(makeRequest({ email: "ADMIN@FARMFRESH.COM", password: "secret" }));
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ["admin@farmfresh.com"]);
  });

  // ── Authentication failures ───────────────────────────────────────────────────

  it("returns 401 when no admin matches the email", async () => {
    mockQuery.mockResolvedValue({ rows: [] } as never);
    const res = await POST(makeRequest({ email: "nobody@farmfresh.com", password: "secret" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password.");
  });

  it("returns 401 when password is wrong", async () => {
    mockQuery.mockResolvedValue({ rows: [validAdmin] } as never);
    mockCompare.mockResolvedValue(false as never);
    const res = await POST(makeRequest({ email: "admin@farmfresh.com", password: "wrong" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password.");
  });

  // ── Successful login ──────────────────────────────────────────────────────────

  it("returns 200 with admin info on valid credentials", async () => {
    mockQuery.mockResolvedValue({ rows: [validAdmin] } as never);
    mockCompare.mockResolvedValue(true as never);
    const res = await POST(makeRequest({ email: "admin@farmfresh.com", password: "correct" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: validAdmin.id,
      name: validAdmin.name,
      email: validAdmin.email,
      role: validAdmin.role,
    });
    // password must not be in the response
    expect(body.password).toBeUndefined();
  });

  it("sets ff_admin_token cookie on successful login", async () => {
    mockQuery.mockResolvedValue({ rows: [validAdmin] } as never);
    mockCompare.mockResolvedValue(true as never);
    const res = await POST(makeRequest({ email: "admin@farmfresh.com", password: "correct" }));
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("ff_admin_token");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Path=/");
  });

  it("sets cookie Max-Age to 7 days", async () => {
    mockQuery.mockResolvedValue({ rows: [validAdmin] } as never);
    mockCompare.mockResolvedValue(true as never);
    const res = await POST(makeRequest({ email: "admin@farmfresh.com", password: "correct" }));
    const setCookie = res.headers.get("set-cookie");
    // 7 days = 604800 seconds
    expect(setCookie).toContain("604800");
  });

  // ── Error handling ────────────────────────────────────────────────────────────

  it("returns 500 when the database throws", async () => {
    mockQuery.mockRejectedValue(new Error("Connection refused"));
    const res = await POST(makeRequest({ email: "admin@farmfresh.com", password: "secret" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Something went wrong.");
  });
});
