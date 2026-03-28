import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { format, subDays } from "date-fns";

export async function GET() {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalBookings,
    completedCount,
    noShowCount,
    totalCoversResult,
    allGuests,
    last30DaysReservations,
  ] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: "COMPLETED" } }),
    prisma.reservation.count({ where: { status: "NO_SHOW" } }),
    prisma.reservation.aggregate({ _sum: { partySize: true } }),
    prisma.guest.findMany({
      select: { visitCount: true, allergies: true, firstVisit: true },
    }),
    prisma.reservation.findMany({
      where: {
        date: { gte: format(subDays(new Date(), 30), "yyyy-MM-dd") },
        status: { in: ["CONFIRMED", "COMPLETED", "ARRIVED"] },
      },
      select: { date: true, time: true, partySize: true, isWalkIn: true },
    }),
  ]);

  const returningGuests = allGuests.filter((g) => g.visitCount > 1 && g.visitCount < 10).length;
  const newGuests = allGuests.filter((g) => g.visitCount === 1).length;
  const allergyProfiles = allGuests.filter((g) => g.allergies).length;
  const totalGuests = allGuests.length;
  const vipGuests = allGuests.filter((g) => g.visitCount >= 10).length;
  const avgVisits =
    totalGuests > 0
      ? allGuests.reduce((sum, g) => sum + g.visitCount, 0) / totalGuests
      : 0;

  // Last 14 days covers by day
  const coversByDay: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    coversByDay[d] = 0;
  }
  for (const r of last30DaysReservations) {
    if (coversByDay[r.date] !== undefined) {
      coversByDay[r.date] += r.partySize;
    }
  }

  // Busiest hours (aggregate by hour across all reservations in last 30 days)
  const bookingsByHour: Record<string, number> = {};
  for (const r of last30DaysReservations) {
    const hour = r.time.split(":")[0] + ":00";
    bookingsByHour[hour] = (bookingsByHour[hour] || 0) + 1;
  }

  // Busiest days of week — broken down by walk-ins vs reservations
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const walkInsByDayOfWeek: Record<string, number> = {
    Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0,
  };
  const reservationsByDayOfWeek: Record<string, number> = {
    Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0,
  };
  for (const r of last30DaysReservations) {
    const d = new Date(r.date + "T00:00:00");
    const dayName = dayNames[d.getDay()];
    if (r.isWalkIn) {
      walkInsByDayOfWeek[dayName] += 1;
    } else {
      reservationsByDayOfWeek[dayName] += 1;
    }
  }

  return NextResponse.json({
    totalBookings,
    completedCount,
    noShowCount,
    totalCovers: totalCoversResult._sum.partySize || 0,
    returningGuests,
    newGuests,
    allergyProfiles,
    totalGuests,
    vipGuests,
    avgVisits: Math.round(avgVisits * 10) / 10,
    coversByDay,
    bookingsByHour,
    walkInsByDayOfWeek,
    reservationsByDayOfWeek,
  });
}
