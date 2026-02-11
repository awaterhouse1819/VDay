# Valentine Time Capsule

A private Valentine time capsule for ACW and SLS. Built with Next.js App Router, Supabase Postgres, and Luxon.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase Postgres (database only, no Supabase Auth)
- Luxon (America/New_York timezone logic)
- bcryptjs (password hash verification)
- jose (signed session cookie)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file (see `.env.example`) with:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ACW_PASSWORD_HASH=
SLS_PASSWORD_HASH=
SESSION_SECRET=
NODE_ENV=development
```

3. Apply database migrations and seed prompts:

- Migration: `supabase/migrations/001_init.sql`
- Seed: `supabase/seed.sql`

You can run these from the Supabase SQL editor, `supabase db push`, or `psql`.

4. Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Password Hashes

Generate bcrypt hashes locally and set them in `.env`:

```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('your-password', 10).then(console.log)"
```

## Deployment (Vercel)

- Add the environment variables from `.env.example` in Vercel.
- Deploy as a standard Next.js app.
- Only the server uses the Supabase service role key; it should never be exposed to the client.

## Notes

- Current year entries are locked until February 14 (America/New_York). Past years are always viewable.
- Session cookies are signed, `HttpOnly`, and `Secure` in production.
