# Reservations — Restaurant Reservation Template

A ready-to-fork reservation system for restaurants. Includes a public booking flow, owner portal (dashboard, calendar, guest management, analytics), and Google Calendar integration.

Fork this repo, configure your restaurant's details, deploy, and you're live.

## Quick Start

### 1. Fork & clone

Fork this repo on GitHub, then:

```bash
git clone git@github.com:YOUR_USERNAME/reservations.git
cd reservations
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your values — see `.env.example` for documentation on each variable.

### 3. Customize defaults

Edit `prisma/seed.ts` to set your restaurant's:
- Operating hours (days open, start/end times)
- Seating duration and reset buffer
- Max guest capacity
- Timezone

### 4. Set up the database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Run the dev server

```bash
npm run dev
```

- Public booking page: `http://localhost:3000`
- Owner portal: `http://localhost:3000/owner`

### 6. Customize in the UI

Once running, go to **Settings > Appearance** in the owner portal to set:
- Restaurant name, hero heading, and subtext
- Color palette and font pairing
- Tab icon (emoji or image)

---

## Google Calendar Setup

The system uses Google OAuth 2.0 to create calendar events for each reservation.

### 1. Create a Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Calendar API** under APIs & Services > Library

### 2. Configure the OAuth consent screen

1. Go to APIs & Services > OAuth consent screen
2. Choose **External** user type
3. Fill in the app name, support email, and developer contact
4. Add the scope: `https://www.googleapis.com/auth/calendar.events`
5. Publish the app to **Production** status (click "Publish App") — this removes the 100-user cap and test-user requirement. Since the scope (`calendar.events`) is not sensitive/restricted, no Google verification is needed.

### 3. Create OAuth credentials

1. Go to APIs & Services > Credentials
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
5. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
6. Copy the Client ID and Client Secret into your `.env`

### 4. Connect from the app

1. Log into the owner portal at `/owner`
2. Go to **Settings > Google Calendar**
3. Click **Connect Google Calendar** and complete the OAuth flow

---

## Deployment

### Vercel + Neon

1. Push the repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Set all environment variables in Vercel project settings
4. Create a [Neon](https://neon.tech) Postgres database and set `DATABASE_URL`
5. Update `GOOGLE_REDIRECT_URI` to your production callback URL
6. Add your production domain to the Google OAuth authorized origins and redirect URIs

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Styling:** Tailwind CSS 4
- **Auth:** Passcode + JWT
- **Calendar:** Google Calendar API (OAuth 2.0)
- **Hosting:** Vercel
