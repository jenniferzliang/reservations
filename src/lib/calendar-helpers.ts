import { addMinutes, parse, format } from "date-fns";
import { prisma } from "./prisma";
import { createEvent } from "./google-calendar";

interface ReservationForCalendar {
  id: string;
  date: string;
  time: string;
  partySize: number;
  firstName: string;
  lastName: string;
  phone: string;
  instagram?: string | null;
  allergies?: string | null;
  specialNotes?: string | null;
}

interface GuestForCalendar {
  visitCount: number;
}

export async function createCalendarEvent(
  reservation: ReservationForCalendar,
  guest: GuestForCalendar
): Promise<string | null> {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) return null;

    const isReturning = guest.visitCount > 1;
    const partySizeLabel =
      reservation.partySize >= 9 ? "8+" : String(reservation.partySize);

    const summary = `📅 ${reservation.firstName} ${reservation.lastName} — Party of ${partySizeLabel} (Visit #${guest.visitCount})`;

    const descLines = [
      `📱 ${reservation.phone}`,
      reservation.instagram ? `📸 ${reservation.instagram}` : null,
      `👥 Party of ${partySizeLabel}`,
      `🔁 Visit #${guest.visitCount}${isReturning ? " (returning)" : ""}`,
      `🌿 Allergies: ${reservation.allergies || "none"}`,
      reservation.specialNotes ? `📝 ${reservation.specialNotes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const startDt = parse(
      `${reservation.date} ${reservation.time}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    );
    const endDt = addMinutes(startDt, settings.maxSeatingDuration);

    const eventId = await createEvent({
      summary,
      description: descLines,
      startDateTime: format(startDt, "yyyy-MM-dd'T'HH:mm:ss"),
      endDateTime: format(endDt, "yyyy-MM-dd'T'HH:mm:ss"),
      timeZone: settings.timezone,
    });

    return eventId;
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    return null;
  }
}
