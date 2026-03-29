/**
 * Shared time-formatting helpers.
 * These were previously duplicated in calendar/page.tsx and settings/page.tsx.
 */

/** Converts an "HH:mm" 24-hour string to a human-readable "h:mm AM/PM" string. */
export function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Adds `mins` minutes to an "HH:mm" string and returns the result as "H:mm". */
export function addMinutesToTime(time24: string, mins: number): string {
  const [h, m] = time24.split(":").map(Number);
  const totalMins = h * 60 + m + mins;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${newH}:${newM.toString().padStart(2, "0")}`;
}
