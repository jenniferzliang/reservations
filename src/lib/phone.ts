import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizePhone(raw: string): string | null {
  const phone = parsePhoneNumberFromString(raw, "US");
  if (!phone || !phone.isValid()) return null;
  return phone.format("E.164");
}
