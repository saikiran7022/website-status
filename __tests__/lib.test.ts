/**
 * Unit tests for pure library helpers (no database access).
 */
import { sha256, generateApiKey, signToken, verifyToken } from "@/lib/auth/password";
import { PLANS, getPlan } from "@/lib/plans";

describe("auth/password helpers", () => {
  it("sha256 is deterministic", () => {
    expect(sha256("hello")).toBe(sha256("hello"));
    expect(sha256("hello")).not.toBe(sha256("world"));
    expect(sha256("hello")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generateApiKey produces a ws_ key whose hash matches", () => {
    const { key, prefix, hash } = generateApiKey();
    expect(key.startsWith("ws_")).toBe(true);
    expect(prefix.startsWith("ws_")).toBe(true);
    expect(hash).toBe(sha256(key));
  });

  it("generateApiKey produces unique keys", () => {
    expect(generateApiKey().key).not.toBe(generateApiKey().key);
  });

  it("signs and verifies a JWT round-trip with orgId", () => {
    const token = signToken("user_1", "admin", "org_1");
    const payload = verifyToken(token);
    expect(payload).toMatchObject({ userId: "user_1", role: "admin", orgId: "org_1" });
  });

  it("rejects a tampered token", () => {
    expect(verifyToken("not-a-jwt")).toBeNull();
  });
});

describe("plans", () => {
  it("falls back to the free plan for unknown/empty values", () => {
    expect(getPlan(undefined).id).toBe("free");
    expect(getPlan("nope").id).toBe("free");
    expect(getPlan("pro").id).toBe("pro");
  });

  it("free plan has tighter limits than pro", () => {
    expect(PLANS.free.maxMonitors!).toBeLessThan(PLANS.pro.maxMonitors!);
    expect(PLANS.free.minInterval).toBeGreaterThanOrEqual(PLANS.pro.minInterval);
    expect(PLANS.enterprise.maxMonitors).toBeNull();
  });
});
