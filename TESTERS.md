# Tester Personas & Workflows

Use these personas when manually testing or writing automated tests for the reservation system. Each persona represents a realistic user type with specific behaviors, goals, and edge cases to exercise.

---

## Persona 1: Sofia Martinez — First-Time Guest

**Who she is:** A 28-year-old looking to book a dinner reservation for a date night. She found the restaurant via Instagram and is visiting the booking page for the first time on her phone.

**Goals:** Book a table for 2 on a Friday evening, note a shellfish allergy.

**Behaviors & test scenarios:**
- Arrives at `/` — expects the booking flow to be immediately obvious without any sign-up
- Selects a date in the current week (Friday or Saturday, the popular slots)
- Scrolls through time slots looking for 7:00 PM or later
- Fills out the form with:
  - First name: `Sofia`, Last name: `Martinez`
  - Instagram: `@sofiam_eats`
  - Phone: `2125550100` (10-digit, no formatting)
  - Party size: 2
  - Allergies: `Shellfish`
  - Special notes: `Anniversary dinner!`
- Submits and expects a clear confirmation with date, time, and party size

**Edge cases to test:**
- Phone number entered without dashes or country code (e.g. `2125550100`) — should still be accepted
- Selecting a Sunday (closed day) — should show no available time slots or indicate closure
- Trying to book a time in the past (today, earlier time slot) — should be prevented or grayed out
- Submitting with empty required fields — should show validation errors inline
- Very long special notes text (500+ chars)
- Mobile viewport (375x812) — all form fields and buttons should be reachable without horizontal scroll

---

## Persona 2: Marcus Chen — Repeat Regular

**Who he is:** A 42-year-old who dines at the restaurant every week or two. He's already in the guest database with multiple past visits.

**Goals:** Make his usual Wednesday lunch booking, party of 4. Expects the system to recognize his phone number.

**Behaviors & test scenarios:**
- Books at `/` with:
  - First name: `Marcus`, Last name: `Chen`
  - Phone: `(212) 555-0113` (formatted with parens and dash)
  - Party size: 4
  - No allergies, no special notes
- After booking, check the owner portal `/owner/guests` — Marcus should show as a returning guest with visit count incremented
- His guest profile should aggregate all past reservations

**Edge cases to test:**
- Booking with the same phone number but slightly different name spelling (e.g. `Marc Chen`) — should still link to existing guest profile
- Booking twice for the same time slot — should the system prevent double-booking for the same guest?
- Guest profile page should show correct visit count, total covers, first/last visit dates

---

## Persona 3: Jenn — Restaurant Owner

**Who she is:** The owner of the restaurant. She uses the owner portal daily to manage today's service, review upcoming reservations, and handle walk-ins.

**Goals:** Check today's manifest, mark guests as seated or no-show, quick-add a walk-in, review the week's calendar, adjust settings.

**Behaviors & test scenarios:**

### Morning check-in
- Logs in at `/owner` with passcode `0000`
- Lands on `/owner/dashboard` (Daily Manifest)
- Reviews the summary cards: Confirmed, Seated, Total Covers, Completed
- Scans the reservation list — checks status indicators (OVERDUE in red, upcoming in green with countdown)

### During service
- Clicks "CHECK IN" on a guest who has arrived — status should change to Seated, Seated count should increment
- Clicks "NO SHOW" on a guest who didn't show up — reservation should be marked accordingly
- Uses "+ QUICK ADD" to add a walk-in party:
  - First name: `Walk`, Last name: `In`
  - Party size: 3
  - No phone needed (walk-in flow)

### End of day
- Navigates to `/owner/calendar` to review the week ahead
- Clicks on a specific day to see that day's bookings
- Navigates to `/owner/guests` to check:
  - Overview tab — total guests, returning count, VIP count, allergy notes count
  - Searches for a guest by name or phone
  - Opens a guest profile to see their history
- Navigates to `/owner/analytics` to check trends

### Settings management
- Goes to `/owner/settings` > Service tab
  - Toggles a day open/closed (e.g. Sunday)
  - Adjusts operating hours
  - Changes max seating duration or reset buffer
  - Changes max party size or total seat capacity
- Goes to `/owner/settings` > Branding tab
  - Changes restaurant name, hero text, accent color
  - Saves and verifies changes reflect on the public booking page at `/`
- Clicks "RESET" to restore defaults

**Edge cases to test:**
- Logging in with wrong passcode — should show error, not redirect
- Session expiry — after 24 hours the session cookie should expire and redirect to login
- Quick-adding a reservation during a fully booked time slot — should enforce capacity limits
- Changing operating hours and verifying the public booking page only shows valid time slots
- Pressing "RESET" in settings — should show confirmation dialog before resetting

---

## Persona 4: Aria Laurent — The Edge-Case Guest

**Who she is:** A guest who will stress-test the system with unusual inputs and boundary conditions.

**Behaviors & test scenarios:**
- Name with special characters: First name `Jean-Pierre`, Last name `O'Brien`
- Name with unicode: First name `Ren`, Last name `Muller` (with umlaut: `M\u00fcller`)
- Instagram handle with no `@` prefix: `arialaurent` (should the system auto-add `@`?)
- Phone number in international format: `+44 20 7946 0958` (UK number — should be rejected since system is US-only)
- Party size: 1 (solo diner) — should be a valid option
- Party size: max value (9) — should be accepted
- Allergies field with multiple items: `Peanuts, tree nuts, dairy, gluten`
- Booking the very first available time slot (11:00 AM opening)
- Booking the very last available time slot (8:45 PM)
- Navigating weeks forward in the date picker and booking far in the future
- Rapidly clicking the submit button multiple times — should not create duplicate reservations

---

## Test Data: Valid US Phone Numbers

The system uses `libphonenumber-js` for validation (US region). These phone numbers pass validation:

| Format | Example | Notes |
|--------|---------|-------|
| 10-digit | `2125550100` | Area code + number |
| Dashed | `212-555-0100` | Common US format |
| Parenthesized | `(212) 555-0100` | Another common format |
| With country code | `+12125550100` | E.164 format |
| Spaced | `+1 800 555 0199` | Readable international |

**Numbers that will FAIL validation:**
- 7-digit without area code: `555-0100`
- Empty string
- Non-numeric: `not-a-phone`
- Non-US without `+` prefix: `020 7946 0958`

---

## Quick Reference: App URLs

| Page | URL | Auth Required |
|------|-----|---------------|
| Public booking | `/` | No |
| Owner login | `/owner` | No (login page) |
| Daily manifest | `/owner/dashboard` | Yes |
| Calendar | `/owner/calendar` | Yes |
| Guests | `/owner/guests` | Yes |
| Analytics | `/owner/analytics` | Yes |
| Settings | `/owner/settings` | Yes |
