import { describe, it, expect, afterEach, vi } from "vitest";

// Mock next/headers so importing auth.ts doesn't fail outside Next.js context
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { verifyPasscode, createSessionToken, verifySessionToken } from "../auth";

describe("verifyPasscode", () => {
  const original = process.env.PORTAL_ACCESS_CODE;

  afterEach(() => {
    if (original === undefined) delete process.env.PORTAL_ACCESS_CODE;
    else process.env.PORTAL_ACCESS_CODE = original;
  });

  it("returns false when PORTAL_ACCESS_CODE is not set", async () => {
    delete process.env.PORTAL_ACCESS_CODE;
    expect(await verifyPasscode("anything")).toBe(false);
  });

  it("returns true for the correct passcode", async () => {
    process.env.PORTAL_ACCESS_CODE = "correct-code";
    expect(await verifyPasscode("correct-code")).toBe(true);
  });

  it("returns false for an incorrect passcode", async () => {
    process.env.PORTAL_ACCESS_CODE = "correct-code";
    expect(await verifyPasscode("wrong-code")).toBe(false);
  });

  it("is case-sensitive", async () => {
    process.env.PORTAL_ACCESS_CODE = "Secret";
    expect(await verifyPasscode("secret")).toBe(false);
  });
});

describe("createSessionToken / verifySessionToken", () => {
  it("creates a token that verifies with role=owner", async () => {
    const token = await createSessionToken();
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.role).toBe("owner");
  });

  it("returns null for a tampered token", async () => {
    const token = await createSessionToken();
    // Corrupt the signature portion
    const tampered = token.slice(0, -6) + "XXXXXX";
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("returns null for a random string", async () => {
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });

  it("returns null for an empty string", async () => {
    expect(await verifySessionToken("")).toBeNull();
  });
});
