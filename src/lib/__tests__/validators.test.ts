import { describe, it, expect } from "vitest";
import {
  CreateReservationSchema,
  UpdateReservationSchema,
  UpdateGuestSchema,
  MergeGuestsSchema,
  UpdateSettingsSchema,
  AuthSchema,
} from "../validators";

const BASE_RESERVATION = {
  date: "2026-03-27",
  time: "09:00",
  firstName: "Jane",
  lastName: "Doe",
  phone: "212-555-0100",
  partySize: 2,
};

describe("CreateReservationSchema", () => {
  it("accepts a minimal valid reservation", () => {
    expect(CreateReservationSchema.safeParse(BASE_RESERVATION).success).toBe(true);
  });

  it("rejects an invalid date format (DD-MM-YYYY)", () => {
    const r = CreateReservationSchema.safeParse({ ...BASE_RESERVATION, date: "27-03-2026" });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid time format (missing leading zero)", () => {
    const r = CreateReservationSchema.safeParse({ ...BASE_RESERVATION, time: "9:00" });
    expect(r.success).toBe(false);
  });

  it("rejects partySize of 0", () => {
    expect(CreateReservationSchema.safeParse({ ...BASE_RESERVATION, partySize: 0 }).success).toBe(false);
  });

  it("accepts partySize of 9 (the '8+' sentinel value)", () => {
    expect(CreateReservationSchema.safeParse({ ...BASE_RESERVATION, partySize: 9 }).success).toBe(true);
  });

  it("rejects partySize of 10", () => {
    expect(CreateReservationSchema.safeParse({ ...BASE_RESERVATION, partySize: 10 }).success).toBe(false);
  });

  it("rejects a non-integer partySize", () => {
    expect(CreateReservationSchema.safeParse({ ...BASE_RESERVATION, partySize: 2.5 }).success).toBe(false);
  });

  it("defaults instagram to empty string when omitted", () => {
    const r = CreateReservationSchema.safeParse(BASE_RESERVATION);
    expect(r.success && r.data.instagram).toBe("");
  });

  it("defaults allergies to empty string when omitted", () => {
    const r = CreateReservationSchema.safeParse(BASE_RESERVATION);
    expect(r.success && r.data.allergies).toBe("");
  });

  it("rejects a missing required field (firstName)", () => {
    const { firstName, ...rest } = BASE_RESERVATION;
    expect(CreateReservationSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an empty firstName", () => {
    expect(CreateReservationSchema.safeParse({ ...BASE_RESERVATION, firstName: "" }).success).toBe(false);
  });

  it("trims whitespace from firstName", () => {
    const r = CreateReservationSchema.safeParse({ ...BASE_RESERVATION, firstName: "  Jane  " });
    expect(r.success && r.data.firstName).toBe("Jane");
  });
});

describe("UpdateReservationSchema", () => {
  it("accepts all valid statuses", () => {
    for (const status of ["CONFIRMED", "ARRIVED", "COMPLETED", "CANCELLED", "NO_SHOW"]) {
      expect(UpdateReservationSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rejects an invalid status", () => {
    expect(UpdateReservationSchema.safeParse({ status: "PENDING" }).success).toBe(false);
  });

  it("accepts an empty object (all fields optional)", () => {
    expect(UpdateReservationSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a valid partySize update", () => {
    expect(UpdateReservationSchema.safeParse({ partySize: 4 }).success).toBe(true);
  });
});

describe("UpdateGuestSchema", () => {
  it("accepts a partial update", () => {
    expect(UpdateGuestSchema.safeParse({ firstName: "John" }).success).toBe(true);
  });

  it("accepts an empty object", () => {
    expect(UpdateGuestSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an empty firstName string", () => {
    expect(UpdateGuestSchema.safeParse({ firstName: "" }).success).toBe(false);
  });
});

describe("MergeGuestsSchema", () => {
  const VALID_MERGE = {
    sourceGuestId: "550e8400-e29b-41d4-a716-446655440000",
    targetGuestId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  };

  it("accepts valid UUIDs", () => {
    expect(MergeGuestsSchema.safeParse(VALID_MERGE).success).toBe(true);
  });

  it("rejects non-UUID strings", () => {
    expect(
      MergeGuestsSchema.safeParse({ sourceGuestId: "abc", targetGuestId: "def" }).success
    ).toBe(false);
  });

  it("rejects a missing targetGuestId", () => {
    expect(
      MergeGuestsSchema.safeParse({ sourceGuestId: VALID_MERGE.sourceGuestId }).success
    ).toBe(false);
  });
});

describe("UpdateSettingsSchema", () => {
  it("accepts maxSeatingDuration at the min boundary (15)", () => {
    expect(UpdateSettingsSchema.safeParse({ maxSeatingDuration: 15 }).success).toBe(true);
  });

  it("accepts maxSeatingDuration at the max boundary (300)", () => {
    expect(UpdateSettingsSchema.safeParse({ maxSeatingDuration: 300 }).success).toBe(true);
  });

  it("rejects maxSeatingDuration below 15", () => {
    expect(UpdateSettingsSchema.safeParse({ maxSeatingDuration: 14 }).success).toBe(false);
  });

  it("rejects maxSeatingDuration above 300", () => {
    expect(UpdateSettingsSchema.safeParse({ maxSeatingDuration: 301 }).success).toBe(false);
  });

  it("accepts resetBuffer at the min boundary (0)", () => {
    expect(UpdateSettingsSchema.safeParse({ resetBuffer: 0 }).success).toBe(true);
  });

  it("rejects resetBuffer above 120", () => {
    expect(UpdateSettingsSchema.safeParse({ resetBuffer: 121 }).success).toBe(false);
  });

  it("accepts maxTotalGuests within range", () => {
    expect(UpdateSettingsSchema.safeParse({ maxTotalGuests: 50 }).success).toBe(true);
  });

  it("rejects maxTotalGuests above 100", () => {
    expect(UpdateSettingsSchema.safeParse({ maxTotalGuests: 101 }).success).toBe(false);
  });

  it("accepts blockedDateAction 'add'", () => {
    expect(UpdateSettingsSchema.safeParse({ blockedDateAction: "add" }).success).toBe(true);
  });

  it("accepts blockedDateAction 'remove'", () => {
    expect(UpdateSettingsSchema.safeParse({ blockedDateAction: "remove" }).success).toBe(true);
  });

  it("rejects an invalid blockedDateAction", () => {
    expect(UpdateSettingsSchema.safeParse({ blockedDateAction: "delete" }).success).toBe(false);
  });

  it("rejects a blockedDate in wrong format", () => {
    expect(UpdateSettingsSchema.safeParse({ blockedDate: "03/27/2026" }).success).toBe(false);
  });

  it("accepts an empty object (all fields optional)", () => {
    expect(UpdateSettingsSchema.safeParse({}).success).toBe(true);
  });
});

describe("AuthSchema", () => {
  it("accepts a non-empty passcode", () => {
    expect(AuthSchema.safeParse({ passcode: "secret" }).success).toBe(true);
  });

  it("rejects an empty passcode", () => {
    expect(AuthSchema.safeParse({ passcode: "" }).success).toBe(false);
  });

  it("rejects a missing passcode", () => {
    expect(AuthSchema.safeParse({}).success).toBe(false);
  });
});
