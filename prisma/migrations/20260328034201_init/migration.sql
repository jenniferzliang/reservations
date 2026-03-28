-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "instagram" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "firstVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalGuests" INTEGER NOT NULL DEFAULT 0,
    "allergies" TEXT,
    "notes" TEXT,
    "mergedFrom" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "instagram" TEXT,
    "allergies" TEXT,
    "specialNotes" TEXT,
    "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "googleCalendarEventId" TEXT,
    "guestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "operatingHours" JSONB NOT NULL,
    "maxSeatingDuration" INTEGER NOT NULL DEFAULT 75,
    "resetBuffer" INTEGER NOT NULL DEFAULT 15,
    "maxTotalGuests" INTEGER NOT NULL DEFAULT 8,
    "slotInterval" INTEGER NOT NULL DEFAULT 15,
    "bookingWindowDays" INTEGER NOT NULL DEFAULT 30,
    "autoMergeDuplicates" BOOLEAN NOT NULL DEFAULT true,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleCalendarId" TEXT,
    "googleAccountEmail" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "colorPalette" TEXT NOT NULL DEFAULT 'classic',
    "fontPairing" TEXT NOT NULL DEFAULT 'serif-mono',
    "restaurantName" TEXT NOT NULL DEFAULT 'My Restaurant',
    "heroHeading" TEXT NOT NULL DEFAULT 'Reserve Your
Table.',
    "heroSubtext" TEXT NOT NULL DEFAULT 'Book your experience with us.',
    "iconType" TEXT NOT NULL DEFAULT 'emoji',
    "iconValue" TEXT NOT NULL DEFAULT '',
    "navIcon" TEXT NOT NULL DEFAULT 'utensils',
    "siteName" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_firstName_lastName_phone_key" ON "Guest"("firstName", "lastName", "phone");

-- CreateIndex
CREATE INDEX "Reservation_date_time_idx" ON "Reservation"("date", "time");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_phone_idx" ON "Reservation"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedDate_date_key" ON "BlockedDate"("date");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
