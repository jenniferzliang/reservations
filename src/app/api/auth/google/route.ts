import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
