import { z } from "zod";

export const CreateReservationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().trim().default(""),
  phone: z.string().optional().default(""),
  partySize: z.number().int().min(1).max(9), // 9 = "8+"
  instagram: z.string().optional().default(""),
  allergies: z.string().optional().default(""),
  specialNotes: z.string().optional().default(""),
  isWalkIn: z.boolean().optional().default(false),
});

export const UpdateReservationSchema = z.object({
  status: z.enum(["CONFIRMED", "ARRIVED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  partySize: z.number().int().min(1).max(9).optional(),
  specialNotes: z.string().optional(),
});

export const UpdateGuestSchema = z.object({
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
  instagram: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
});

export const MergeGuestsSchema = z.object({
  sourceGuestId: z.string().uuid(),
  targetGuestId: z.string().uuid(),
});

export const UpdateSettingsSchema = z.object({
  operatingHours: z.record(z.string(), z.any()).optional(),
  maxSeatingDuration: z.number().int().min(15).max(300).optional(),
  resetBuffer: z.number().int().min(0).max(120).optional(),
  maxTotalGuests: z.number().int().min(1).max(100).optional(),
  slotInterval: z.number().int().min(5).max(120).optional(),
  bookingWindowDays: z.number().int().min(1).max(365).optional(),
  autoMergeDuplicates: z.boolean().optional(),
  timezone: z.string().optional(),
  googleCalendarId: z.string().optional(),
  blockedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  blockedDateAction: z.enum(["add", "remove"]).optional(),
  colorPalette: z.enum(["classic", "warm", "ocean", "midnight", "sage"]).optional(),
  fontPairing: z.enum(["serif-mono", "sans-serif", "mono-sans", "elegant"]).optional(),
  restaurantName: z.string().min(1).max(100).optional(),
  heroHeading: z.string().min(1).max(200).optional(),
  heroSubtext: z.string().max(300).optional(),
  iconType: z.enum(["emoji", "image"]).optional(),
  iconValue: z.string().max(500000).optional(),
});

export const AuthSchema = z.object({
  passcode: z.string().min(1, "Passcode is required"),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
export type UpdateReservationInput = z.infer<typeof UpdateReservationSchema>;
