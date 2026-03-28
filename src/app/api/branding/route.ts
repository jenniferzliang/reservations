import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  restaurantName: process.env.NEXT_PUBLIC_SITE_NAME || "My Restaurant",
  heroHeading: "Reserve Your\nTable.",
  heroSubtext: "Book your experience with us.",
  iconType: "emoji",
  iconValue: "",
  navIcon: "utensils",
};

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({
      select: {
        restaurantName: true,
        heroHeading: true,
        heroSubtext: true,
        iconType: true,
        iconValue: true,
        navIcon: true,
      },
    });

    return NextResponse.json(settings ?? DEFAULTS);
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}
