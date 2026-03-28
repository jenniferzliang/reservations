import { NextResponse } from "next/server";
import { getCachedSettings } from "@/lib/prisma";

const DEFAULTS = {
  restaurantName: "My Restaurant",
  heroHeading: "Reserve Your\nTable.",
  heroSubtext: "Book your experience with us.",
  iconType: "emoji",
  iconValue: "",
  navIcon: "utensils",
};

export async function GET() {
  try {
    const settings = await getCachedSettings();
    if (!settings) return NextResponse.json(DEFAULTS);

    const { restaurantName, heroHeading, heroSubtext, iconType, iconValue, navIcon } = settings;
    return NextResponse.json({ restaurantName, heroHeading, heroSubtext, iconType, iconValue, navIcon });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}
