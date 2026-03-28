import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guests = await prisma.guest.findMany({
    orderBy: { lastVisit: "desc" },
  });

  const header =
    "ID,First Name,Last Name,Phone,Instagram,Visit Count,First Visit,Last Visit,Total Guests,Allergies,Notes";
  const rows = guests.map((g) =>
    [
      g.id,
      `"${g.firstName}"`,
      `"${g.lastName}"`,
      g.phone,
      g.instagram || "",
      g.visitCount,
      g.firstVisit.toISOString(),
      g.lastVisit.toISOString(),
      g.totalGuests,
      `"${g.allergies || ""}"`,
      `"${(g.notes || "").replace(/"/g, '""')}"`,
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=guests.csv",
    },
  });
}
