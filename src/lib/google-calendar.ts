import { google } from "googleapis";
import { prisma } from "./prisma";
import { encrypt, decrypt } from "./encryption";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "openid",
      "email",
    ],
  });
}

export async function handleCallback(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);

  // Decode email from the ID token (no extra API call needed)
  let email: string | null = null;
  if (tokens.id_token) {
    const payload = JSON.parse(
      Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
    );
    email = payload.email || null;
  }

  await prisma.settings.update({
    where: { id: "default" },
    data: {
      googleAccessToken: tokens.access_token ? encrypt(tokens.access_token) : null,
      googleRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      googleAccountEmail: email,
    },
  });

  return { email };
}

async function getAuthenticatedClient() {
  const settings = await prisma.settings.findFirst();
  if (!settings?.googleAccessToken || !settings?.googleRefreshToken) {
    return null;
  }

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: decrypt(settings.googleAccessToken),
    refresh_token: decrypt(settings.googleRefreshToken),
  });

  client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.settings.update({
        where: { id: "default" },
        data: { googleAccessToken: encrypt(tokens.access_token) },
      });
    }
  });

  return client;
}

interface EventInput {
  summary: string;
  description: string;
  startDateTime: string; // ISO without offset
  endDateTime: string;
  timeZone: string;
}

export async function createEvent(input: EventInput): Promise<string | null> {
  const client = await getAuthenticatedClient();
  if (!client) return null;

  const settings = await prisma.settings.findFirst();
  const calendarId = settings?.googleCalendarId || "primary";

  const calendar = google.calendar({ version: "v3", auth: client });
  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startDateTime, timeZone: input.timeZone },
      end: { dateTime: input.endDateTime, timeZone: input.timeZone },
    },
  });

  return data.id || null;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const client = await getAuthenticatedClient();
  if (!client) return;

  const settings = await prisma.settings.findFirst();
  const calendarId = settings?.googleCalendarId || "primary";

  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.delete({ calendarId, eventId });
}

export async function updateEvent(
  eventId: string,
  updates: Partial<EventInput>
): Promise<void> {
  const client = await getAuthenticatedClient();
  if (!client) return;

  const settings = await prisma.settings.findFirst();
  const calendarId = settings?.googleCalendarId || "primary";

  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      ...(updates.summary && { summary: updates.summary }),
      ...(updates.description && { description: updates.description }),
    },
  });
}

export async function listCalendars() {
  const client = await getAuthenticatedClient();
  if (!client) return [];

  const calendar = google.calendar({ version: "v3", auth: client });
  const { data } = await calendar.calendarList.list();
  return (
    data.items?.map((cal) => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary,
    })) || []
  );
}

export async function disconnect(): Promise<void> {
  await prisma.settings.update({
    where: { id: "default" },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleCalendarId: null,
      googleAccountEmail: null,
    },
  });
}
