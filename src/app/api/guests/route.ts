import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { instagram: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const guests = await prisma.guest.findMany({
    where,
    include: { reservations: { orderBy: { date: "desc" } } },
    orderBy: { lastVisit: "desc" },
  });

  return NextResponse.json(guests);
}
