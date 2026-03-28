import { NextResponse } from "next/server";
import { format, addDays } from "date-fns";
import { getAvailability } from "@/lib/availability";
import { getCachedSettings } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const settings = await getCachedSettings();
  const windowDays = settings?.bookingWindowDays || 30;
  const today = format(new Date(), "yyyy-MM-dd");
  const from = searchParams.get("from") || today;
  const to = searchParams.get("to") || format(addDays(new Date(), windowDays), "yyyy-MM-dd");

  try {
    const availability = await getAvailability(from, to);
    return NextResponse.json(availability);
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
