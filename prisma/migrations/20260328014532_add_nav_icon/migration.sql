-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "navIcon" TEXT NOT NULL DEFAULT 'utensils',
ALTER COLUMN "heroHeading" SET DEFAULT 'Reserve Your
Table.',
ALTER COLUMN "heroSubtext" SET DEFAULT 'Book your experience with us.',
ALTER COLUMN "restaurantName" SET DEFAULT 'My Restaurant';
