import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- mocks ----------------------------------------------------------------

const { mockTransaction, mockReservationUpdate } = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
  mockReservationUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mockTransaction,
    reservation: { update: mockReservationUpdate },
  },
}));

vi.mock("@/lib/calendar-helpers", () => ({
  createCalendarEvent: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue(true),
}));

// ---- helpers ---------------------------------------------------------------

import { POST } from "../route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  date: "2026-03-27",
  time: "09:00",
  firstName: "Jane",
  lastName: "Doe",
  phone: "(212) 555-0100",
  partySize: 2,
};

// A transaction mock that simulates a successful new-guest booking
function setupSuccessfulTransaction(overrides: {
  currentGuests?: number;
  maxTotalGuests?: number;
  existingGuest?: object | null;
  autoMergeDuplicates?: boolean;
} = {}) {
  const {
    currentGuests = 0,
    maxTotalGuests = 20,
    existingGuest = null,
    autoMergeDuplicates = true,
  } = overrides;

  // Build a list of existing reservations to simulate currentGuests via overlap
  const existingReservations = currentGuests > 0
    ? [{ time: "09:00", partySize: currentGuests }]
    : [];

  const mockTx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    reservation: {
      findMany: vi.fn().mockResolvedValue(existingReservations),
      create: vi.fn().mockResolvedValue({
        id: "res-1",
        date: "2026-03-27",
        time: "09:00",
        partySize: 2,
        firstName: "Jane",
        status: "CONFIRMED",
      }),
    },
    settings: {
      findFirst: vi.fn().mockResolvedValue({ maxTotalGuests, autoMergeDuplicates, maxSeatingDuration: 75, resetBuffer: 15 }),
    },
    guest: {
      upsert: vi.fn().mockResolvedValue({ id: existingGuest ? "guest-existing" : "guest-1", visitCount: existingGuest ? 2 : 1 }),
    },
  };

  mockTransaction.mockImplementation((fn: (tx: typeof mockTx) => unknown) => fn(mockTx));
  return mockTx;
}

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/reservations", () => {
  describe("validation", () => {
    it("returns 400 for a missing required field", async () => {
      const { firstName, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
    });

    it("returns 400 for an invalid date format", async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, date: "27/03/2026" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 for an invalid phone number", async () => {
      setupSuccessfulTransaction();
      const res = await POST(makeRequest({ ...VALID_BODY, phone: "not-a-phone" }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid phone number");
    });
  });

  describe("capacity checks", () => {
    it("returns 409 when the slot is at capacity", async () => {
      setupSuccessfulTransaction({ currentGuests: 19, maxTotalGuests: 20 });
      // partySize=2, currentGuests=19 → 21 > 20 → full
      const res = await POST(makeRequest({ ...VALID_BODY, partySize: 2 }));
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toMatch(/fully booked/i);
    });

    it("returns 200 when the slot has exact remaining capacity", async () => {
      setupSuccessfulTransaction({ currentGuests: 18, maxTotalGuests: 20 });
      // partySize=2, currentGuests=18 → 20 === 20, not > 20 → allowed
      const res = await POST(makeRequest({ ...VALID_BODY, partySize: 2 }));
      expect(res.status).toBe(200);
    });

    it("bypasses capacity check when partySize is 9 ('8+' sentinel)", async () => {
      // Slot is overfull (25 guests), but partySize=9 skips the check
      setupSuccessfulTransaction({ currentGuests: 25, maxTotalGuests: 20 });
      const res = await POST(makeRequest({ ...VALID_BODY, partySize: 9 }));
      expect(res.status).toBe(200);
    });
  });

  describe("guest handling", () => {
    it("upserts guest when the phone is not on file", async () => {
      const mockTx = setupSuccessfulTransaction({ existingGuest: null });
      await POST(makeRequest(VALID_BODY));
      expect(mockTx.guest.upsert).toHaveBeenCalledOnce();
    });

    it("upserts guest when autoMergeDuplicates is true", async () => {
      const existingGuest = { id: "guest-existing", visitCount: 1, instagram: null, allergies: null };
      const mockTx = setupSuccessfulTransaction({ existingGuest, autoMergeDuplicates: true });
      await POST(makeRequest(VALID_BODY));
      expect(mockTx.guest.upsert).toHaveBeenCalledOnce();
    });

    it("upserts guest when autoMergeDuplicates is false", async () => {
      const existingGuest = { id: "guest-existing", visitCount: 1 };
      const mockTx = setupSuccessfulTransaction({ existingGuest, autoMergeDuplicates: false });
      await POST(makeRequest(VALID_BODY));
      expect(mockTx.guest.upsert).toHaveBeenCalledOnce();
    });
  });

  describe("walk-in (no phone)", () => {
    const WALKIN_BODY = {
      date: "2026-03-27",
      time: "12:30",
      firstName: "Alex",
      lastName: "",
      partySize: 3,
      isWalkIn: true,
    };

    it("returns 200 when phone is omitted", async () => {
      setupSuccessfulTransaction();
      const res = await POST(makeRequest(WALKIN_BODY));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toMatchObject({ id: "res-1", status: "CONFIRMED" });
    });

    it("returns 200 when phone is an empty string", async () => {
      setupSuccessfulTransaction();
      const res = await POST(makeRequest({ ...WALKIN_BODY, phone: "" }));
      expect(res.status).toBe(200);
    });

    it("generates a unique walkin phone identifier for guest upsert", async () => {
      const mockTx = setupSuccessfulTransaction();
      await POST(makeRequest(WALKIN_BODY));
      const upsertCall = mockTx.guest.upsert.mock.calls[0][0];
      expect(upsertCall.where.firstName_lastName_phone.phone).toMatch(/^walkin-/);
    });

    it("still validates phone when one is provided", async () => {
      setupSuccessfulTransaction();
      const res = await POST(makeRequest({ ...WALKIN_BODY, phone: "not-valid" }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid phone number");
    });

    it("normalizes a valid phone when provided on a walk-in", async () => {
      const mockTx = setupSuccessfulTransaction();
      await POST(makeRequest({ ...WALKIN_BODY, phone: "(212) 555-0100" }));
      const upsertCall = mockTx.guest.upsert.mock.calls[0][0];
      expect(upsertCall.where.firstName_lastName_phone.phone).toBe("+12125550100");
    });

    it("respects capacity checks for walk-ins", async () => {
      setupSuccessfulTransaction({ currentGuests: 19, maxTotalGuests: 20 });
      const res = await POST(makeRequest({ ...WALKIN_BODY, time: "09:00", partySize: 2 }));
      expect(res.status).toBe(409);
    });
  });

  describe("successful booking response", () => {
    it("returns 200 with reservation fields", async () => {
      setupSuccessfulTransaction();
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toMatchObject({
        id: "res-1",
        date: "2026-03-27",
        time: "09:00",
        partySize: 2,
        status: "CONFIRMED",
      });
    });
  });
});
