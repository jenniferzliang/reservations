import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Edit these defaults to match your restaurant's schedule
const DEFAULT_OPERATING_HOURS = {
  monday: { open: true, start: "11:00", end: "21:00" },
  tuesday: { open: true, start: "11:00", end: "21:00" },
  wednesday: { open: true, start: "11:00", end: "21:00" },
  thursday: { open: true, start: "11:00", end: "21:00" },
  friday: { open: true, start: "11:00", end: "22:00" },
  saturday: { open: true, start: "11:00", end: "22:00" },
  sunday: { open: false },
};

async function main() {
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      operatingHours: DEFAULT_OPERATING_HOURS,
      maxSeatingDuration: 90,
      resetBuffer: 15,
      maxTotalGuests: 20,
      autoMergeDuplicates: true,
      timezone: "America/New_York",  // Change to your timezone
    },
  });

  console.log("Seeded default settings");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
