import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservations = await prisma.reservation.findMany({
    orderBy: [{ date: "desc" }, { time: "asc" }],
  });

  const header =
    "ID,Date,Time,Party Size,First Name,Last Name,Phone,Instagram,Allergies,Special Notes,Status";
  const rows = reservations.map((r) =>
    [
      r.id,
      r.date,
      r.time,
      r.partySize,
      `"${r.firstName}"`,
      `"${r.lastName}"`,
      r.phone,
      r.instagram || "",
      `"${r.allergies || ""}"`,
      `"${(r.specialNotes || "").replace(/"/g, '""')}"`,
      r.status,
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=reservations.csv",
    },
  });
}
