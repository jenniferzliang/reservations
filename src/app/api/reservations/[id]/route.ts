import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { UpdateReservationSchema } from "@/lib/validators";
import { deleteEvent, updateEvent } from "@/lib/google-calendar";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: {
      id: true,
      date: true,
      time: true,
      partySize: true,
      firstName: true,
      lastName: true,
      status: true,
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(reservation);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = UpdateReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reservation = await prisma.reservation.update({
    where: { id },
    data: parsed.data,
  });

  // Update Google Calendar if status changed
  if (parsed.data.status && existing.googleCalendarEventId) {
    try {
      if (parsed.data.status === "CANCELLED") {
        await deleteEvent(existing.googleCalendarEventId);
      } else if (parsed.data.status === "NO_SHOW") {
        await updateEvent(existing.googleCalendarEventId, {
          summary: `[NO SHOW] ${existing.firstName} ${existing.lastName} — Party of ${existing.partySize}`,
        });
      }
    } catch (error) {
      console.error("Failed to update calendar event:", error);
    }
  }

  return NextResponse.json(reservation);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.reservation.delete({
    where: { id },
  });

  if (existing.googleCalendarEventId) {
    try {
      await deleteEvent(existing.googleCalendarEventId);
    } catch (error) {
      console.error("Failed to delete calendar event:", error);
    }
  }

  return NextResponse.json({ success: true });
}
