// @vitest-environment node
import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "@/lib/auth";

describe("signToken / verifyToken", () => {
  it("round-trips a payload", async () => {
    const payload = { id: "1", name: "Alice", email: "alice@example.com" };
    const token = await signToken(payload);
    expect(typeof token).toBe("string");

    const decoded = await verifyToken(token);
    expect(decoded?.id).toBe(payload.id);
    expect(decoded?.name).toBe(payload.name);
    expect(decoded?.email).toBe(payload.email);
  });

  it("returns null for an invalid token", async () => {
    const result = await verifyToken("not-a-valid-token");
    expect(result).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await signToken({ id: "1", name: "Bob", email: "bob@example.com" });
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });
});
