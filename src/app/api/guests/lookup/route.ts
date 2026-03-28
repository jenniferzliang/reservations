import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

export async function GET(request: Request) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone parameter required" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ guest: null });
  }

  const guest = await prisma.guest.findFirst({
    where: { phone: normalized },
    include: { reservations: { orderBy: { date: "desc" }, take: 1 } },
  });

  return NextResponse.json({ guest });
}
