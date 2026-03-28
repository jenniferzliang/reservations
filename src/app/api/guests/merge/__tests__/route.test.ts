import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- mocks ----------------------------------------------------------------

const { mockRequireAuth, mockTransaction } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mockTransaction,
  },
}));

// ---- helpers ---------------------------------------------------------------

import { POST } from "../route";

const SOURCE_ID = "550e8400-e29b-41d4-a716-446655440001";
const TARGET_ID = "550e8400-e29b-41d4-a716-446655440002";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/guests/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const SOURCE_GUEST = {
  id: SOURCE_ID,
  visitCount: 3,
  totalGuests: 6,
  firstVisit: new Date("2024-01-15"),
  lastVisit: new Date("2024-06-01"),
  instagram: null,
  allergies: "shellfish",
  notes: "VIP",
  mergedFrom: [],
};

const TARGET_GUEST = {
  id: TARGET_ID,
  visitCount: 5,
  totalGuests: 10,
  firstVisit: new Date("2023-08-01"),
  lastVisit: new Date("2024-05-15"),
  instagram: "@jane",
  allergies: "peanuts",
  notes: null,
  mergedFrom: [],
};

function setupTransaction(source = SOURCE_GUEST, target = TARGET_GUEST) {
  const mergedGuest = {
    ...target,
    visitCount: target.visitCount + source.visitCount,
    totalGuests: target.totalGuests + source.totalGuests,
    firstVisit: source.firstVisit < target.firstVisit ? source.firstVisit : target.firstVisit,
    lastVisit: source.lastVisit > target.lastVisit ? source.lastVisit : target.lastVisit,
    instagram: target.instagram || source.instagram,
    allergies: [target.allergies, source.allergies].filter(Boolean).join(", ") || null,
    notes: [target.notes, source.notes].filter(Boolean).join("\n") || null,
    mergedFrom: [...target.mergedFrom, SOURCE_ID, ...source.mergedFrom],
  };

  const mockTx = {
    guest: {
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id === SOURCE_ID ? source : target)
      ),
      update: vi.fn().mockResolvedValue(mergedGuest),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    reservation: {
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
  };

  mockTransaction.mockImplementation((fn: (tx: typeof mockTx) => unknown) => fn(mockTx));
  return { mockTx, mergedGuest };
}

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(true);
});

describe("POST /api/guests/merge", () => {
  describe("authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockRequireAuth.mockResolvedValue(false);
      const res = await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      expect(res.status).toBe(401);
    });
  });

  describe("validation", () => {
    it("returns 400 for non-UUID IDs", async () => {
      const res = await POST(makeRequest({ sourceGuestId: "not-uuid", targetGuestId: "also-not" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when merging a guest with themselves", async () => {
      const res = await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: SOURCE_ID }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/themselves/i);
    });

    it("returns 400 when body is missing", async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
    });
  });

  describe("merge data aggregation", () => {
    it("sums visitCount from both guests", async () => {
      const { mergedGuest } = setupTransaction();
      const res = await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.visitCount).toBe(mergedGuest.visitCount); // 5 + 3 = 8
    });

    it("sums totalGuests from both guests", async () => {
      const { mergedGuest } = setupTransaction();
      const res = await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      const json = await res.json();
      expect(json.totalGuests).toBe(mergedGuest.totalGuests); // 10 + 6 = 16
    });

    it("uses the earlier firstVisit", async () => {
      // SOURCE firstVisit = 2024-01-15, TARGET firstVisit = 2023-08-01
      // target is earlier → keep target's firstVisit
      const { mockTx } = setupTransaction();
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      const updateCall = mockTx.guest.update.mock.calls[0][0];
      expect(updateCall.data.firstVisit).toEqual(TARGET_GUEST.firstVisit);
    });

    it("uses the later lastVisit", async () => {
      // SOURCE lastVisit = 2024-06-01, TARGET lastVisit = 2024-05-15
      // source is later → use source's lastVisit
      const { mockTx } = setupTransaction();
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      const updateCall = mockTx.guest.update.mock.calls[0][0];
      expect(updateCall.data.lastVisit).toEqual(SOURCE_GUEST.lastVisit);
    });

    it("concatenates allergies from both guests", async () => {
      const { mockTx } = setupTransaction();
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      const updateCall = mockTx.guest.update.mock.calls[0][0];
      expect(updateCall.data.allergies).toBe("peanuts, shellfish");
    });

    it("handles null allergies on one side gracefully", async () => {
      const sourceNoAllergies = { ...SOURCE_GUEST, allergies: null };
      const { mockTx } = setupTransaction(sourceNoAllergies, TARGET_GUEST);
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      const updateCall = mockTx.guest.update.mock.calls[0][0];
      expect(updateCall.data.allergies).toBe("peanuts");
    });

    it("sets allergies to null when both are null", async () => {
      const sourceNoAllergies = { ...SOURCE_GUEST, allergies: null };
      const targetNoAllergies = { ...TARGET_GUEST, allergies: null };
      const { mockTx } = setupTransaction(sourceNoAllergies, targetNoAllergies);
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      const updateCall = mockTx.guest.update.mock.calls[0][0];
      expect(updateCall.data.allergies).toBeNull();
    });

    it("prefers target instagram when both are set", async () => {
      const { mockTx } = setupTransaction(
        { ...SOURCE_GUEST, instagram: "@source" },
        { ...TARGET_GUEST, instagram: "@target" }
      );
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      const updateCall = mockTx.guest.update.mock.calls[0][0];
      expect(updateCall.data.instagram).toBe("@target");
    });

    it("falls back to source instagram when target has none", async () => {
      const { mockTx } = setupTransaction(
        { ...SOURCE_GUEST, instagram: "@source" },
        { ...TARGET_GUEST, instagram: null }
      );
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      const updateCall = mockTx.guest.update.mock.calls[0][0];
      expect(updateCall.data.instagram).toBe("@source");
    });

    it("includes sourceGuestId in the target's mergedFrom array", async () => {
      const { mockTx } = setupTransaction();
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      const updateCall = mockTx.guest.update.mock.calls[0][0];
      expect(updateCall.data.mergedFrom).toContain(SOURCE_ID);
    });

    it("moves all reservations from source to target", async () => {
      const { mockTx } = setupTransaction();
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      expect(mockTx.reservation.updateMany).toHaveBeenCalledWith({
        where: { guestId: SOURCE_ID },
        data: { guestId: TARGET_ID },
      });
    });

    it("deletes the source guest after merging", async () => {
      const { mockTx } = setupTransaction();
      await POST(makeRequest({ sourceGuestId: SOURCE_ID, targetGuestId: TARGET_ID }));
      expect(mockTx.guest.delete).toHaveBeenCalledWith({ where: { id: SOURCE_ID } });
    });
  });
});
