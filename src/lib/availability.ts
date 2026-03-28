import { prisma } from "./prisma";
import { format, addDays, parse, addMinutes } from "date-fns";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

interface DayConfig {
  open: boolean;
  start?: string; // "HH:mm"
  end?: string; // "HH:mm"
}

interface SlotInfo {
  time: string; // "HH:mm"
  currentGuests: number;
  maxCapacity: number;
  isFull: boolean;
}

interface DayAvailability {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: string;
  isOpen: boolean;
  slots: SlotInfo[];
}

export async function getAvailability(
  from: string,
  to: string
): Promise<DayAvailability[]> {
  const settings = await prisma.settings.findFirst();
  if (!settings) throw new Error("Settings not configured");

  const operatingHours = settings.operatingHours as unknown as Record<string, DayConfig>;
  const { maxSeatingDuration, resetBuffer, maxTotalGuests, slotInterval: configuredSlotInterval } = settings;

  const blockedDates = await prisma.blockedDate.findMany({
    where: {
      date: { gte: from, lte: to },
    },
  });
  const blockedSet = new Set(blockedDates.map((b) => b.date));

  const reservations = await prisma.reservation.findMany({
    where: {
      date: { gte: from, lte: to },
      status: { in: ["CONFIRMED", "ARRIVED"] },
    },
    select: { date: true, time: true, partySize: true },
  });

  // Group reservations by date
  const bookingsByDate = new Map<string, { time: string; partySize: number }[]>();
  for (const r of reservations) {
    const list = bookingsByDate.get(r.date) || [];
    list.push({ time: r.time, partySize: r.partySize });
    bookingsByDate.set(r.date, list);
  }

  const occupancyDuration = maxSeatingDuration + resetBuffer;

  const result: DayAvailability[] = [];
  const startDate = parse(from, "yyyy-MM-dd", new Date());
  const endDate = parse(to, "yyyy-MM-dd", new Date());

  let current = startDate;
  while (current <= endDate) {
    const dateStr = format(current, "yyyy-MM-dd");
    const dayName = DAY_NAMES[current.getDay()];
    const dayConfig = operatingHours[dayName];

    const isBlocked = blockedSet.has(dateStr);
    const isOpen = dayConfig?.open === true && !isBlocked;

    const slots: SlotInfo[] = [];

    if (isOpen && dayConfig.start && dayConfig.end) {
      const slotInterval = configuredSlotInterval || 15;
      const dayStart = parse(dayConfig.start, "HH:mm", current);
      const dayEnd = parse(dayConfig.end, "HH:mm", current);
      const dayReservations = bookingsByDate.get(dateStr) || [];

      let slotTime = dayStart;
      while (slotTime < dayEnd) {
        const timeStr = format(slotTime, "HH:mm");

        // Count guests from all reservations that overlap this slot
        // A reservation overlaps if: resStart <= slotTime < resStart + occupancyDuration
        let currentGuests = 0;
        for (const res of dayReservations) {
          const resStart = parse(res.time, "HH:mm", current);
          const resEnd = addMinutes(resStart, occupancyDuration);
          if (slotTime >= resStart && slotTime < resEnd) {
            currentGuests += res.partySize;
          }
        }

        slots.push({
          time: timeStr,
          currentGuests,
          maxCapacity: maxTotalGuests,
          isFull: currentGuests >= maxTotalGuests,
        });

        slotTime = addMinutes(slotTime, slotInterval);
      }
    }

    result.push({
      date: dateStr,
      dayOfWeek: dayName,
      isOpen,
      slots,
    });

    current = addDays(current, 1);
  }

  return result;
}
