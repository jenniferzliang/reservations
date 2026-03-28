import { PrismaClient, type Settings } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Cached settings to avoid hitting the DB on every request
const SETTINGS_TTL_MS = 30_000; // 30 seconds
let cachedSettings: Settings | null = null;
let cacheTimestamp = 0;

export async function getCachedSettings(): Promise<Settings | null> {
  const now = Date.now();
  if (cachedSettings && now - cacheTimestamp < SETTINGS_TTL_MS) {
    return cachedSettings;
  }
  cachedSettings = await prisma.settings.findFirst();
  cacheTimestamp = now;
  return cachedSettings;
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}
