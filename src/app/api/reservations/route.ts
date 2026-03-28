import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { CreateReservationSchema } from "@/lib/validators";
import { createCalendarEvent } from "@/lib/calendar-helpers";
import { parse, addMinutes } from "date-fns";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  let phone: string;
  if (data.phone) {
    const normalized = normalizePhone(data.phone);
    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }
    phone = normalized;
  } else {
    phone = `walkin-${crypto.randomUUID()}`;
  }

  // Check capacity in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const settings = await tx.settings.findFirst();
    const maxGuests = settings?.maxTotalGuests || 8;
    const occupancyDuration = (settings?.maxSeatingDuration || 75) + (settings?.resetBuffer || 15);

    // Find all active reservations on this date to check overlap
    const dayReservations = await tx.reservation.findMany({
      where: { date: data.date, status: { in: ["CONFIRMED", "ARRIVED"] } },
      select: { time: true, partySize: true },
    });

    // Count guests whose stay overlaps the requested time
    const slotTime = parse(data.time, "HH:mm", new Date());
    let currentGuests = 0;
    for (const res of dayReservations) {
      const resStart = parse(res.time, "HH:mm", new Date());
      const resEnd = addMinutes(resStart, occupancyDuration);
      if (slotTime >= resStart && slotTime < resEnd) {
        currentGuests += res.partySize;
      }
    }

    if (currentGuests + data.partySize > maxGuests && data.partySize < 9) {
      return { error: "This time slot is fully booked", status: 409 };
    }

    // Upsert guest
    const autoMerge = settings?.autoMergeDuplicates ?? true;
    let guest;

    if (autoMerge) {
      guest = await tx.guest.upsert({
        where: { firstName_lastName_phone: { firstName: data.firstName, lastName: data.lastName, phone } },
        update: {
          firstName: data.firstName,
          lastName: data.lastName,
          instagram: data.instagram || undefined,
          visitCount: { increment: 1 },
          lastVisit: new Date(),
          totalGuests: { increment: data.partySize },
          allergies: data.allergies || undefined,
        },
        create: {
          phone,
          firstName: data.firstName,
          lastName: data.lastName,
          instagram: data.instagram || undefined,
          visitCount: 1,
          firstVisit: new Date(),
          lastVisit: new Date(),
          totalGuests: data.partySize,
          allergies: data.allergies || undefined,
        },
      });
    } else {
      guest = await tx.guest.upsert({
        where: { firstName_lastName_phone: { firstName: data.firstName, lastName: data.lastName, phone } },
        update: {
          visitCount: { increment: 1 },
          lastVisit: new Date(),
          totalGuests: { increment: data.partySize },
        },
        create: {
          phone,
          firstName: data.firstName,
          lastName: data.lastName,
          instagram: data.instagram || undefined,
          visitCount: 1,
          firstVisit: new Date(),
          lastVisit: new Date(),
          totalGuests: data.partySize,
          allergies: data.allergies || undefined,
        },
      });
    }

    const reservation = await tx.reservation.create({
      data: {
        date: data.date,
        time: data.time,
        partySize: data.partySize,
        firstName: data.firstName,
        lastName: data.lastName,
        phone,
        instagram: data.instagram || undefined,
        allergies: data.allergies || undefined,
        specialNotes: data.specialNotes || undefined,
        isWalkIn: data.isWalkIn || false,
        status: "CONFIRMED",
        guestId: guest.id,
      },
    });

    return { reservation, guest };
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  // Create Google Calendar event (non-blocking, best-effort)
  const eventId = await createCalendarEvent(result.reservation, result.guest);
  if (eventId) {
    await prisma.reservation.update({
      where: { id: result.reservation.id },
      data: { googleCalendarEventId: eventId },
    });
  }

  return NextResponse.json({
    id: result.reservation.id,
    date: result.reservation.date,
    time: result.reservation.time,
    partySize: result.reservation.partySize,
    firstName: result.reservation.firstName,
    status: result.reservation.status,
  });
}

export async function GET(request: Request) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (date) {
    where.date = date;
  } else if (dateFrom && dateTo) {
    where.date = { gte: dateFrom, lte: dateTo };
  }
  if (status) where.status = status;

  const reservations = await prisma.reservation.findMany({
    where,
    include: { guest: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json(reservations);
}
