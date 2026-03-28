import { NextResponse } from "next/server";
import {
  verifyPasscode,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { AuthSchema } from "@/lib/validators";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = AuthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Passcode is required" }, { status: 400 });
  }

  const valid = await verifyPasscode(parsed.data.passcode);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = await createSessionToken();
  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
