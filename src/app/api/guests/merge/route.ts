import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { MergeGuestsSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = MergeGuestsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sourceGuestId, targetGuestId } = parsed.data;

  if (sourceGuestId === targetGuestId) {
    return NextResponse.json(
      { error: "Cannot merge a guest with themselves" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const source = await tx.guest.findUnique({ where: { id: sourceGuestId } });
    const target = await tx.guest.findUnique({ where: { id: targetGuestId } });

    if (!source || !target) {
      throw new Error("Guest not found");
    }

    // Move all reservations from source to target
    await tx.reservation.updateMany({
      where: { guestId: sourceGuestId },
      data: { guestId: targetGuestId },
    });

    // Update target with merged data
    const mergedGuest = await tx.guest.update({
      where: { id: targetGuestId },
      data: {
        visitCount: target.visitCount + source.visitCount,
        totalGuests: target.totalGuests + source.totalGuests,
        firstVisit:
          source.firstVisit < target.firstVisit
            ? source.firstVisit
            : target.firstVisit,
        lastVisit:
          source.lastVisit > target.lastVisit
            ? source.lastVisit
            : target.lastVisit,
        instagram: target.instagram || source.instagram,
        allergies: [target.allergies, source.allergies]
          .filter(Boolean)
          .join(", ") || null,
        notes: [target.notes, source.notes].filter(Boolean).join("\n") || null,
        mergedFrom: [...target.mergedFrom, sourceGuestId, ...source.mergedFrom],
      },
    });

    // Delete source guest
    await tx.guest.delete({ where: { id: sourceGuestId } });

    return mergedGuest;
  });

  return NextResponse.json(result);
}
