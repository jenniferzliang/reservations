import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSettingsFindFirst, mockCreateEvent } = vi.hoisted(() => ({
  mockSettingsFindFirst: vi.fn(),
  mockCreateEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: { findFirst: mockSettingsFindFirst },
  },
}));

vi.mock("@/lib/google-calendar", () => ({
  createEvent: mockCreateEvent,
}));

import { createCalendarEvent } from "../calendar-helpers";

const BASE_SETTINGS = {
  maxSeatingDuration: 90,
  timezone: "America/New_York",
  googleCalendarId: "cal-id",
  googleAccessToken: "token",
};

const BASE_RESERVATION = {
  id: "res-1",
  date: "2026-03-27",
  time: "09:00",
  partySize: 2,
  firstName: "Jane",
  lastName: "Doe",
  phone: "+12125550100",
  instagram: "@janedoe",
  allergies: "peanuts",
  specialNotes: "Window seat please",
};

const RETURNING_GUEST = { visitCount: 3 };
const NEW_GUEST = { visitCount: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  mockSettingsFindFirst.mockResolvedValue(BASE_SETTINGS);
  mockCreateEvent.mockResolvedValue("gcal-event-id-123");
});

describe("createCalendarEvent", () => {
  it("returns null when settings are not found", async () => {
    mockSettingsFindFirst.mockResolvedValue(null);
    const result = await createCalendarEvent(BASE_RESERVATION, RETURNING_GUEST);
    expect(result).toBeNull();
  });

  it("returns the event ID from createEvent on success", async () => {
    const result = await createCalendarEvent(BASE_RESERVATION, RETURNING_GUEST);
    expect(result).toBe("gcal-event-id-123");
  });

  it("returns null when createEvent throws", async () => {
    mockCreateEvent.mockRejectedValue(new Error("Google API error"));
    const result = await createCalendarEvent(BASE_RESERVATION, RETURNING_GUEST);
    expect(result).toBeNull();
  });

  it("uses '8+' as party size label when partySize >= 9", async () => {
    await createCalendarEvent({ ...BASE_RESERVATION, partySize: 9 }, RETURNING_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].summary).toContain("8+");
    expect(call[0].summary).not.toContain("9");
  });

  it("uses the numeric party size label when partySize < 9", async () => {
    await createCalendarEvent({ ...BASE_RESERVATION, partySize: 4 }, RETURNING_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].summary).toContain("Party of 4");
  });

  it("includes '(returning)' in description for visitCount > 1", async () => {
    await createCalendarEvent(BASE_RESERVATION, RETURNING_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].description).toContain("(returning)");
  });

  it("does not include '(returning)' for a first-time guest", async () => {
    await createCalendarEvent(BASE_RESERVATION, NEW_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].description).not.toContain("(returning)");
  });

  it("includes instagram in description when present", async () => {
    await createCalendarEvent(BASE_RESERVATION, NEW_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].description).toContain("@janedoe");
  });

  it("omits instagram line when instagram is null", async () => {
    await createCalendarEvent({ ...BASE_RESERVATION, instagram: null }, NEW_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].description).not.toContain("📸");
  });

  it("omits specialNotes line when specialNotes is null", async () => {
    await createCalendarEvent({ ...BASE_RESERVATION, specialNotes: null }, NEW_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].description).not.toContain("📝");
  });

  it("includes specialNotes in description when present", async () => {
    await createCalendarEvent(BASE_RESERVATION, NEW_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].description).toContain("Window seat please");
  });

  it("computes end time as start + maxSeatingDuration minutes", async () => {
    // start = 09:00, maxSeatingDuration = 90 min → end = 10:30
    await createCalendarEvent(BASE_RESERVATION, NEW_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].startDateTime).toBe("2026-03-27T09:00:00");
    expect(call[0].endDateTime).toBe("2026-03-27T10:30:00");
  });

  it("passes the settings timezone to createEvent", async () => {
    await createCalendarEvent(BASE_RESERVATION, NEW_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].timeZone).toBe("America/New_York");
  });

  it("shows 'none' for allergies when allergies field is empty", async () => {
    await createCalendarEvent({ ...BASE_RESERVATION, allergies: "" }, NEW_GUEST);
    const [call] = mockCreateEvent.mock.calls;
    expect(call[0].description).toContain("Allergies: none");
  });
});
