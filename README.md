# Tutoring Tracker

A web application for tracking tutoring lessons, transportation expenses, material purchases, and financial stats. Recreates the functionality of a Google Sheet tutoring tracker.

## Features

- **Google Sign-in** – Secure authentication
- **Lessons** – Log tutoring sessions with date, student, duration, fee, and payment status
- **Transportation** – Track travel expenses (MTR, Taxi, Bus, Other)
- **Material** – Record material purchases and whether paid by parent
- **Stats** – Monthly financial summary with bar chart
- **Fees** – Pricing lookup table for lesson durations
- **Students** – Student directory with location, goals, and payment methods

## Tech Stack

- React 18 + Vite
- React Router
- Tailwind CSS
- Recharts
- **Supabase** (PostgreSQL + Auth) – free tier

## Setup (Required)

Supabase is required. The app will not run without it.

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run `supabase/schema.sql`
3. Enable Google sign-in:
   - Go to Authentication → Providers → Google
   - Enable it and add your Google OAuth credentials (from Google Cloud Console)
   - Add `https://your-project.supabase.co/auth/v1/callback` to authorized redirect URIs in Google Cloud
4. In Supabase: Authentication → URL Configuration:
   - Site URL: `http://localhost:5173` (for dev) or your production URL
   - Redirect URLs: add `http://localhost:5173/**` and your production URL
5. Copy `.env.example` to `.env` and add your credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

6. Run `npm install` and `npm run dev`

## First-time Users

New users start with empty data. Add Students and Fees first, then Lessons. The default fees (1.0h/360, 1.5h/520, 2.0h/690) can be seeded by running in SQL Editor:

```sql
INSERT INTO fees (user_id, duration, fee, description)
SELECT auth.uid(), '1.0 hour', 360, 'Standard Private Lesson'
WHERE auth.uid() IS NOT NULL;
-- Repeat for 1.5 hours and 2.0 hours
```

Or add them via the Fees page after signing in.

## Build

```bash
npm run build
npm run preview
```
