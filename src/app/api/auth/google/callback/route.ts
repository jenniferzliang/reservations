import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleCallback } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing auth code" }, { status: 400 });
  }

  try {
    await handleCallback(code);
    return NextResponse.redirect(new URL("/owner/settings", request.url));
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/owner/settings?error=google_auth_failed", request.url)
    );
  }
}
