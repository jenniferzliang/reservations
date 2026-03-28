import { describe, it, expect } from "vitest";
import { normalizePhone } from "../phone";

describe("normalizePhone", () => {
  it("normalizes dashes format", () => {
    expect(normalizePhone("212-555-0100")).toBe("+12125550100");
  });

  it("normalizes parentheses and spaces format", () => {
    expect(normalizePhone("(212) 555-0100")).toBe("+12125550100");
  });

  it("normalizes a number already in E.164 format", () => {
    expect(normalizePhone("+12125550100")).toBe("+12125550100");
  });

  it("normalizes a number with +1 country code and spaces", () => {
    expect(normalizePhone("+1 800 555 0199")).toBe("+18005550199");
  });

  it("normalizes a 10-digit string with no separators", () => {
    expect(normalizePhone("2125550100")).toBe("+12125550100");
  });

  it("returns null for a 7-digit number (missing area code)", () => {
    expect(normalizePhone("555-0100")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(normalizePhone("")).toBeNull();
  });

  it("returns null for non-numeric garbage", () => {
    expect(normalizePhone("not-a-phone")).toBeNull();
  });

  it("returns null for a non-US number without country code", () => {
    // A UK local number — won't parse as valid US
    expect(normalizePhone("020 7946 0958")).toBeNull();
  });

  it("accepts a non-US number when a valid +country-code prefix is provided", () => {
    // +44 UK number — libphonenumber-js can parse it but will produce a non-US E.164
    const result = normalizePhone("+44 20 7946 0958");
    expect(result).toBe("+442079460958");
  });
});
