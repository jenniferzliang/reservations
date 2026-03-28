import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- mocks ----------------------------------------------------------------

const { mockRequireAuth, mockFindUnique, mockUpdate, mockDelete, mockDeleteEvent, mockUpdateEvent } =
  vi.hoisted(() => ({
    mockRequireAuth: vi.fn(),
    mockFindUnique: vi.fn(),
    mockUpdate: vi.fn(),
    mockDelete: vi.fn(),
    mockDeleteEvent: vi.fn(),
    mockUpdateEvent: vi.fn(),
  }));

vi.mock("@/lib/auth", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reservation: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

vi.mock("@/lib/google-calendar", () => ({
  deleteEvent: mockDeleteEvent,
  updateEvent: mockUpdateEvent,
}));

// ---- helpers ---------------------------------------------------------------

import { GET, PATCH, DELETE } from "../route";

const RESERVATION_ID = "res-abc-123";

function makeParams(id = RESERVATION_ID) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(method: string, body?: unknown) {
  return new Request(`http://localhost/api/reservations/${RESERVATION_ID}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

const EXISTING_RESERVATION = {
  id: RESERVATION_ID,
  date: "2026-03-27",
  time: "09:00",
  partySize: 2,
  firstName: "Jane",
  lastName: "Doe",
  status: "CONFIRMED",
  googleCalendarEventId: null,
};

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue(true);
});

describe("GET /api/reservations/[id]", () => {
  it("returns the reservation when found", async () => {
    mockFindUnique.mockResolvedValue(EXISTING_RESERVATION);
    const res = await GET(makeRequest("GET"), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe(RESERVATION_ID);
  });

  it("returns 404 when the reservation does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest("GET"), makeParams());
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/reservations/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(false);
    const res = await PATCH(makeRequest("PATCH", { status: "ARRIVED" }), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid status value", async () => {
    mockFindUnique.mockResolvedValue(EXISTING_RESERVATION);
    const res = await PATCH(makeRequest("PATCH", { status: "UNKNOWN" }), makeParams());
    expect(res.status).toBe(400);
  });

  it("returns 404 when the reservation does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await PATCH(makeRequest("PATCH", { status: "ARRIVED" }), makeParams());
    expect(res.status).toBe(404);
  });

  it("updates the reservation and returns 200", async () => {
    const updated = { ...EXISTING_RESERVATION, status: "ARRIVED" };
    mockFindUnique.mockResolvedValue(EXISTING_RESERVATION);
    mockUpdate.mockResolvedValue(updated);
    const res = await PATCH(makeRequest("PATCH", { status: "ARRIVED" }), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ARRIVED");
  });

  it("calls deleteEvent when status changes to CANCELLED and a calendar event exists", async () => {
    const withCalendar = { ...EXISTING_RESERVATION, googleCalendarEventId: "gcal-event-1" };
    mockFindUnique.mockResolvedValue(withCalendar);
    mockUpdate.mockResolvedValue({ ...withCalendar, status: "CANCELLED" });
    await PATCH(makeRequest("PATCH", { status: "CANCELLED" }), makeParams());
    expect(mockDeleteEvent).toHaveBeenCalledWith("gcal-event-1");
  });

  it("calls updateEvent with [NO SHOW] prefix when status changes to NO_SHOW", async () => {
    const withCalendar = { ...EXISTING_RESERVATION, googleCalendarEventId: "gcal-event-2" };
    mockFindUnique.mockResolvedValue(withCalendar);
    mockUpdate.mockResolvedValue({ ...withCalendar, status: "NO_SHOW" });
    await PATCH(makeRequest("PATCH", { status: "NO_SHOW" }), makeParams());
    expect(mockUpdateEvent).toHaveBeenCalledWith(
      "gcal-event-2",
      expect.objectContaining({ summary: expect.stringContaining("[NO SHOW]") })
    );
  });

  it("does not call deleteEvent or updateEvent when no calendar event is linked", async () => {
    mockFindUnique.mockResolvedValue(EXISTING_RESERVATION); // googleCalendarEventId: null
    mockUpdate.mockResolvedValue({ ...EXISTING_RESERVATION, status: "CANCELLED" });
    await PATCH(makeRequest("PATCH", { status: "CANCELLED" }), makeParams());
    expect(mockDeleteEvent).not.toHaveBeenCalled();
    expect(mockUpdateEvent).not.toHaveBeenCalled();
  });

  it("does not call calendar functions for non-calendar statuses (ARRIVED)", async () => {
    const withCalendar = { ...EXISTING_RESERVATION, googleCalendarEventId: "gcal-event-3" };
    mockFindUnique.mockResolvedValue(withCalendar);
    mockUpdate.mockResolvedValue({ ...withCalendar, status: "ARRIVED" });
    await PATCH(makeRequest("PATCH", { status: "ARRIVED" }), makeParams());
    expect(mockDeleteEvent).not.toHaveBeenCalled();
    expect(mockUpdateEvent).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/reservations/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue(false);
    const res = await DELETE(makeRequest("DELETE"), makeParams());
    expect(res.status).toBe(401);
  });

  it("returns 404 when the reservation does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE"), makeParams());
    expect(res.status).toBe(404);
  });

  it("deletes the reservation and returns success", async () => {
    mockFindUnique.mockResolvedValue(EXISTING_RESERVATION);
    mockDelete.mockResolvedValue(undefined);
    const res = await DELETE(makeRequest("DELETE"), makeParams());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("calls deleteEvent when a calendar event is linked", async () => {
    const withCalendar = { ...EXISTING_RESERVATION, googleCalendarEventId: "gcal-del-1" };
    mockFindUnique.mockResolvedValue(withCalendar);
    mockDelete.mockResolvedValue(undefined);
    await DELETE(makeRequest("DELETE"), makeParams());
    expect(mockDeleteEvent).toHaveBeenCalledWith("gcal-del-1");
  });

  it("does not call deleteEvent when no calendar event is linked", async () => {
    mockFindUnique.mockResolvedValue(EXISTING_RESERVATION); // googleCalendarEventId: null
    mockDelete.mockResolvedValue(undefined);
    await DELETE(makeRequest("DELETE"), makeParams());
    expect(mockDeleteEvent).not.toHaveBeenCalled();
  });
});
