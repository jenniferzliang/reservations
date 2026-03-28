import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { UpdateSettingsSchema } from "@/lib/validators";
import type { Prisma } from "@/generated/prisma/client";

export async function GET() {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [settings, blockedDates] = await Promise.all([
    prisma.settings.findFirst(),
    prisma.blockedDate.findMany({ select: { date: true } }),
  ]);
  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  // Don't expose tokens
  const { googleAccessToken, googleRefreshToken, ...safe } = settings;
  return NextResponse.json({
    ...safe,
    googleConnected: !!googleAccessToken,
    blockedDates: blockedDates.map((b) => b.date),
  });
}

export async function PATCH(request: Request) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = UpdateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { operatingHours, blockedDate, blockedDateAction, ...rest } = parsed.data;

  // Handle blocked date toggle
  if (blockedDate && blockedDateAction) {
    if (blockedDateAction === "add") {
      await prisma.blockedDate.upsert({
        where: { date: blockedDate },
        update: {},
        create: { date: blockedDate },
      });
    } else {
      await prisma.blockedDate.deleteMany({
        where: { date: blockedDate },
      });
    }
  }

  const settings = await prisma.settings.update({
    where: { id: "default" },
    data: {
      ...rest,
      ...(operatingHours && {
        operatingHours: operatingHours as unknown as Prisma.InputJsonValue,
      }),
    },
  });

  const { googleAccessToken, googleRefreshToken, ...safe } = settings;
  return NextResponse.json({
    ...safe,
    googleConnected: !!googleAccessToken,
  });
}
