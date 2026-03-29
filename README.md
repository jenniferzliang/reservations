# Reservations — Open Source Restaurant Booking System

A complete, self-hosted reservation system you can fork and make your own. Guests book through a clean public page; you manage everything from a private owner portal.

**Live demo:** [bookatable.vercel.app](https://bookatable.vercel.app)

**What's included:**
- Public booking page with real-time availability
- Owner portal: dashboard, calendar, guest profiles, analytics
- Fully customizable branding (name, colors, fonts, logo)
- Guest history and automatic duplicate merging
- Optional Google Calendar sync for every reservation

**Tech:** Next.js · PostgreSQL · Prisma · Tailwind · Vercel · Neon

---

## Who This Is For

This is for restaurant owners who want full control over their reservation system — no monthly fees, no third-party platform. You'll need to be comfortable following technical instructions, or have someone set it up for you once.

If you run into trouble at any step, see [Getting Help with AI](#getting-help-with-ai) — you can use a free AI assistant that will guide you through the entire setup interactively.

---

## What You'll Need

Before starting, create free accounts at these services:

| Service | What It's For | Sign Up |
|---------|---------------|---------|
| **GitHub** | Stores your code | [github.com](https://github.com) |
| **Neon** | Hosts your database | [neon.tech](https://neon.tech) |
| **Vercel** | Hosts your website | [vercel.com](https://vercel.com) |

You'll also need **Node.js** installed on your computer (only needed once, for the initial database setup). Download it at [nodejs.org](https://nodejs.org) — choose the "LTS" version.

**Optional:** A Google account if you want reservations to appear in Google Calendar.

---

## Setup Guide

### Step 1 — Fork this repository

"Forking" makes a personal copy of this project under your own GitHub account. You'll make all your changes there.

1. Click **Fork** in the top-right corner of this GitHub page
2. Choose your GitHub account as the destination
3. Click **Create fork**

You now have your own copy at `github.com/YOUR_USERNAME/reservations`.

---

### Step 2 — Create your database

Your reservation data needs somewhere to live. Neon provides a free PostgreSQL database.

1. Go to [neon.tech](https://neon.tech) and sign in
2. Click **New Project**
3. Give it a name (e.g., "my-restaurant") and click **Create project**
4. On the project dashboard, find the **Connection string** — it looks like:
   ```
   postgresql://username:password@host.neon.tech/dbname?sslmode=require
   ```
5. Copy it — you'll need it in Step 4

---

### Step 3 — Deploy to Vercel

Vercel hosts your website and makes it publicly accessible.

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New > Project**
3. Find your forked `reservations` repository and click **Import**
4. **Before clicking Deploy**, click **Environment Variables** and add each of the following:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your Neon connection string from Step 2 | |
| `PORTAL_ACCESS_CODE` | A password you choose | This is how you log into the owner portal — pick something secure |
| `JWT_SECRET` | A long random string | Use the generator below |
| `ENCRYPTION_KEY` | A 64-character hex string | Use the generator below |

**To generate `JWT_SECRET`:** Open Terminal (Mac) or Command Prompt (Windows) and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output and use it as your `JWT_SECRET`.

**To generate `ENCRYPTION_KEY`:** Run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the 64-character output and use it as your `ENCRYPTION_KEY`.

5. Click **Deploy**

Vercel will build and deploy your site. This takes about a minute. The app won't be fully functional until you complete Step 4 (database setup).

---

### Step 4 — Initialize your database

After deployment, your database exists but is empty. You need to set it up once from your computer.

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Clone your forked repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/reservations.git
   cd reservations
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
5. Open the `.env` file in any text editor (Notepad, TextEdit, VS Code) and fill in the same values you used in Vercel:
   ```
   DATABASE_URL="your-neon-connection-string"
   PORTAL_ACCESS_CODE="your-chosen-password"
   JWT_SECRET="your-generated-secret"
   ENCRYPTION_KEY="your-generated-key"
   ```
6. Run the database migrations (creates all the tables):
   ```bash
   npx prisma migrate deploy
   ```
7. Seed the default settings:
   ```bash
   npx prisma db seed
   ```

Your database is now ready.

---

### Step 5 — Configure your restaurant in the portal

Go to your Vercel deployment URL and log in at `/owner` with your `PORTAL_ACCESS_CODE`.

Navigate to **Settings** and configure:

- **Restaurant name** — appears on the booking page and confirmation
- **Hero heading and subtext** — the text guests see when they land on your booking page
- **Color palette** — choose from 5 preset themes
- **Font pairing** — 4 options from classic serif to modern mono
- **Logo** — upload an image or choose an emoji icon
- **Operating hours** — fine-tune days and times (or reset to defaults)
- **Booking window** — how many days ahead guests can book

---

## Google Calendar Integration (Optional)

If you want a Google Calendar event created for every reservation:

### 1. Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Give it a name (e.g., "My Restaurant Reservations") and click **Create**
4. Make sure your new project is selected in the dropdown
5. Go to **APIs & Services > Library**
6. Search for "Google Calendar API" and click **Enable**

### 2. Configure the consent screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** and click **Create**
3. Fill in:
   - App name: your restaurant name
   - User support email: your email
   - Developer contact: your email
4. Click **Save and Continue**
5. On the Scopes page, click **Add or Remove Scopes**
6. Search for and add: `https://www.googleapis.com/auth/calendar.events`
7. Click **Save and Continue** through the rest
8. Back on the main OAuth screen, click **Publish App** → **Confirm**
   > Publishing removes the 100-user test limit. The `calendar.events` scope doesn't require Google verification.

### 3. Create OAuth credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Add **Authorized JavaScript origins**:
   - `https://your-vercel-domain.vercel.app`
5. Add **Authorized redirect URIs**:
   - `https://your-vercel-domain.vercel.app/api/auth/google/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### 4. Add credentials to Vercel

In your Vercel project settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Your Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret |
| `GOOGLE_REDIRECT_URI` | `https://your-vercel-domain.vercel.app/api/auth/google/callback` |

Redeploy your Vercel project after adding these (Deployments → Redeploy).

### 5. Connect from the app

1. Log into the owner portal → **Settings**
2. Scroll to **Google Calendar**
3. Click **Connect Google Calendar** and complete the sign-in

---

## Running Locally (Optional)

If you want to test changes before deploying, make sure you've completed Step 4 (your `.env` file should already be set up with your database and secrets), then run:

```bash
npm run dev
```

- Booking page: [http://localhost:3000](http://localhost:3000)
- Owner portal: [http://localhost:3000/owner](http://localhost:3000/owner)

---

## Getting Help with AI

This repo includes a guided setup assistant you can use if you have [Claude Code](https://claude.ai/code) installed.

**What is Claude Code?** It's a free AI assistant that runs in your terminal and can walk you through technical tasks step by step, answer questions in plain language, and even run commands for you.

### Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Then sign in:
```bash
claude
```

### Use the Setup Wizard

Once inside your project directory, type:

```
/setup
```

This launches an interactive walkthrough that guides you through the entire setup process — from creating your database to deploying your site. It checks what's already configured, asks you questions about your restaurant, and handles each remaining step for you (generating secrets, setting up Neon and Vercel, seeding the database, and more).

If you prefer to set things up manually, follow the [Setup Guide](#setup-guide) above. But if you want a guided experience, `/setup` is the easiest way to get started.

You can also just ask it questions in plain English:
- *"I'm stuck on the database step, what do I do?"*
- *"How do I find my Neon connection string?"*
- *"My site deployed but I can't log in — what's wrong?"*

---

## Troubleshooting

**"I can't log into the owner portal"**
Double-check that `PORTAL_ACCESS_CODE` in your Vercel environment variables matches exactly what you're typing. It's case-sensitive.

**"The database migration failed"**
Make sure your `DATABASE_URL` in `.env` is the correct Neon connection string, including `?sslmode=require` at the end.

**"The booking page shows no available times"**
Log into the owner portal → Settings → check that your operating hours are configured and at least one day is set to open.

**"Google Calendar connect fails"**
Make sure `GOOGLE_REDIRECT_URI` in Vercel matches exactly the redirect URI you added in Google Cloud (including `https://`, your full domain, and `/api/auth/google/callback`).

**"I changed settings in `seed.ts` but nothing changed"**
You need to re-run `npx prisma db seed` after editing the file.

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

---

## License

MIT
