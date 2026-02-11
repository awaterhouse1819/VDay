# Valentine Time Capsule — Product Requirements Document

## Summary

**Valentine Time Capsule** is a private web application where two partners (identified by initials **ACW** and **SLS**) write answers to romantic “time-capsule” questions each year.  
The application must allow past years’ answers to be opened at any time, but it should **lock the current/upcoming year’s entries until 14 February** (America/New_York time).  
It uses Next.js (App Router) with TypeScript, Supabase’s Postgres as a managed database (without using Supabase Auth), custom authentication using initials & passwords, and Luxon for timezone handling.

## Goals & objectives

- **Romantic journaling:** partners privately record answers to a curated set of at least **15 romantic prompts** each year.
- **Time-capsule access control:** past years are always viewable, while the current Valentine’s year is locked until **14 February**; after that date entries become viewable.
- **Simple but secure authentication:** no third-party auth; the app must verify uppercase initials (**ACW** or **SLS**) and a partner-specific password, hashing passwords securely and storing only password hashes (e.g., using bcrypt).
- **Modern web stack:** built with Next.js App Router and TypeScript, Supabase Postgres as a database (Supabase can be used purely as Postgres; there is no vendor lock-in), and deployable on Vercel.
- **Timezone correctness:** enforce the Feb 14 lock using Luxon; DateTime objects can be created in the **America/New_York** zone via `DateTime.fromObject`, ensuring server-side checks use the partners’ timezone.

## Background & research

- **Supabase as Postgres** — Supabase provides full access to PostgreSQL; it can be used solely as a database without proprietary tooling or vendor lock-in. This project uses Supabase for its managed Postgres instance while bypassing Supabase Auth.
- **Secure session cookies** — When setting cookies, adding `Secure` (HTTPS-only) and `HttpOnly` attributes ensures the cookie is only accessible on secure connections and not readable by client-side JavaScript. The app must set signed session cookies marked `HttpOnly` and `Secure` in production.
- **Password hashing** — Bcrypt is among the most widely used and reliable password-hashing algorithms. It uses salts and a tunable cost factor to slow brute-force attacks. The PRD mandates hashing partner passwords with bcrypt (or Argon2 if desired) and storing only the hashed values in environment variables.
- **Luxon for timezone** — Luxon’s `DateTime.fromObject()` can create DateTime objects in specific zones; passing `{ zone: 'America/New_York' }` creates times anchored to the Eastern U.S. zone. This ensures Valentine’s date checks respect the New York timezone.

## Personas & user stories

| Persona       | Description                                                                                                                                                                         | Key Goals                                                                                                         |
|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| **Partner**   | One of the two partners (ACW or SLS). They log in with initials and password, write romantic answers for the current year, browse past years, and read partner’s entries on Feb 14. | Write and revise answers any time; look back on past years; enjoy a surprise on Feb 14 when current year unlocks. |
| **Developer** | Maintainer who deploys and operates the app.                                                                                                                                        | Setup Supabase, run migrations and seed prompts, configure environment variables, deploy on Vercel, and ensure security. |

### Sample User Stories

1. **Login:** As ACW, I enter my initials in uppercase and my secret password. If I mistype my initials or use lowercase, the system rejects the login.
2. **Writing entries:** After logging in, I navigate to the `/write` page. I see the current year’s romantic prompts and fill out answers. I can update my answers any time before and after Feb 14.
3. **Viewing past years:** I click `/open`, browse a list of past years, and read both partners’ answers. Past years are always accessible.
4. **Valentine’s surprise:** On Feb 14, I receive a notification (e.g., page indicator) that the current year’s entries are unlocked. I open them and see my partner’s answers.

## Functional requirements

### Authentication & session management

1. **Login page (`/login`)**
   - Collect two fields: **Initials** and **Password**.
   - Only allow uppercase initials exactly matching `ACW` or `SLS`; reject any other values or lowercase forms.
   - Validate the password on the server by comparing a bcrypt/Argon2 hash stored in environment variables. The PRD prohibits storing plaintext passwords.
   - On successful authentication, create a signed HTTP-only session cookie containing the partner identity (`ACW` or `SLS`). The cookie must include `Secure` and `HttpOnly` flags to prevent access via client scripts and ensure it is sent only over HTTPS.
   - Set a `SameSite` attribute (preferably `Lax`) to mitigate CSRF.

2. **Session middleware**
   - Provide server middleware to validate the signed cookie on every request. Unauthenticated users are redirected to `/login`.
   - Middleware should parse the cookie, verify its signature, and attach the partner identity to `request`/`user` context for downstream handlers.
   - Deny access if the cookie signature fails or is missing.
   - In production, ensure cookies are signed with a secret stored in an environment variable and rotated if necessary.

### Data model & migrations (Supabase)

Define SQL migrations compatible with Supabase (e.g., using `supabase db` CLI or Prisma Migrate).  
The schema must be idempotent and include timestamps (`created_at`, `updated_at`) with default values.

1. **`questions` table**
   - `id` (serial primary key)
   - `prompt` (text, not null)
   - `is_active` (boolean, default `true`)
   - `created_at` / `updated_at` timestamps

2. **`entries` table**
   - `id` (serial primary key)
   - `year` (integer, not null) — the year the answers belong to
   - `partner_id` (varchar(3), not null) — either `ACW` or `SLS`
   - `answers` (jsonb, not null) — object keyed by `question_id`; values are strings
   - `created_at` / `updated_at` timestamps
   - **Unique constraint on `(partner_id, year)`** to ensure only one record per partner per year

3. **Seed script**
   - Insert at least **15** romantic prompts into `questions` with `is_active = true`.
   - Example prompts:
     - “What is your favorite memory of us this past year?”
     - “What challenges did we overcome together?”
     - “One thing I appreciate about you today is…”
     - “A song that reminds me of our love…”
     - “The best date we had this year was…”
     - “Something I want us to try next year…”
     - “One time you made me laugh uncontrollably was…”
     - “I felt loved when you…”
     - “If our love were a movie title…”
     - “What smell or flavor reminds you of us?”
     - “A small detail about you that I adore…”
     - “What I am most proud of us for this year…”
     - “An adventure I want to take with you…”
     - “Our love in three words…”
     - “What does Valentine’s Day mean to you now?”

### Application routes

| Route                          | Description                                                                                                                                                                                                                                                                     |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **`/login`**                   | Login form for initials & password. Reject invalid initials or wrong password. On success, set session cookie and redirect to `/write` or `/open`.                                                                                                                              |
| **`/write`** (protected)       | Server action that fetches active prompts from `questions` and loads or creates an `entries` record for the current year and authenticated partner. Shows a form listing each active prompt with textareas for answers. Updates answers on submit.                              |
| **`/open`** (protected)        | Shows a list of years with existing entries. Past years (< current year) are always viewable. Current year’s entries are locked until Feb 14 (America/New_York); until then, display a message with a countdown to Feb 14. After Feb 14, allow viewing current year entries. |
| **`/api/entries`** (protected) | REST/route handlers for reading and updating entries. All handlers must enforce the same Valentine’s lock: if a request attempts to fetch current-year entries before Feb 14, it must return a forbidden error.                                                             |

### Access control & Valentine’s lock

- **Current year detection** — compute the current year using `DateTime.now().setZone('America/New_York')` from Luxon. Use `DateTime.fromObject()` with the zone option to create a Feb 14 00:00:00 boundary.
- **Unlock condition** — allow reading current year entries only if:
  - `now >= DateTime.fromObject({ year: now.year, month: 2, day: 14, hour: 0, minute: 0 }, { zone: 'America/New_York' })`
  - Past years (`year < current year`) are always viewable.
- **Server enforcement** — implement these checks in API route handlers rather than trusting client logic. Clients should never be able to fetch current year entries before the unlock time.
- **Countdown** — when current year is locked, compute `diff = unlockDate.diff(now)` and display a countdown timer in days/hours/minutes using Luxon durations; show a romantic lock message.

### Client & UI requirements

- **Minimal romantic design** — use soft pink/red tones, heart icons, and gentle typography to evoke a Valentine’s feel. Keep the UI clean and minimal.
- **Forms** — use controlled components for prompts; persist unsaved input locally (e.g., local state) until form submission to avoid accidental loss. Provide clear save confirmation.
- **Archive browsing** — list years in descending order; clicking a year shows a two-column layout with partner names and answers. Only show entries that exist; show placeholder text (e.g., “No entry yet”) for missing answers.
- **Error handling** — display validation errors for wrong initials/password, show messages for locked years, and show server errors elegantly.

## Non-functional requirements

- **Security**
  - Session cookies must set `HttpOnly` and `Secure` flags to prevent JavaScript access and ensure secure transmission.
  - Use bcrypt (or Argon2) to hash passwords; bcrypt is widely regarded as secure and reliable and uses salts and cost factors to resist brute-force attacks.
  - Protect against SQL injection by parameterizing queries or using the Supabase client.
  - Enforce CSRF protection by using SameSite cookie settings.
  - Ensure the session cookie signature secret and password hashes are stored in environment variables and not committed to the repository.
- **Performance** — The app is small; responses should render within 200 ms for typical queries. Use static optimization where possible (e.g., caching questions).
- **Accessibility** — Provide semantic labels for form fields and ensure color contrasts meet accessibility guidelines.
- **Scalability** — Schema and code should support adding new questions or partners if needed (though for now only two partners exist). Use JSONB answers to flexibly store question→answer mapping.
- **Deployment** — The codebase must be ready to deploy on Vercel. Provide a `README.md` with local development instructions, environment variable names, and deployment steps.

## Technical design notes

1. **Supabase Postgres** — Use Supabase solely for its Postgres database. Supabase provides full Postgres access and can be used without vendor lock-in, so the migrations can be applied via `supabase db push` or `supabase db migration`.
2. **Database access layer** — Use the native Supabase server client (`@supabase/supabase-js`) with the service role key on the server only. Ensure queries are parameterized.
3. **Password verification** — Compute password hashes offline and store them in environment variables (`ACW_PASSWORD_HASH`, `SLS_PASSWORD_HASH`). During login, compare with `bcryptjs.compare` to avoid native dependency issues.
4. **Session management** — Use a signed JWT session cookie via `jose`, stored in `vtimecapsule_session` and signed by `SESSION_SECRET`.
5. **Luxon usage** — Import `DateTime` and `Duration` from `luxon`. To handle timezone correctly, set zone explicitly for all date calculations (`DateTime.now().setZone('America/New_York')`). This prevents differences in server and client timezones.
6. **Middleware** — Add `middleware.ts` at the repository root (Next.js App Router) to intercept requests and check session cookies. Redirect unauthenticated users or unauthorized access to `/login` or an error page.
7. **Testing** — Post-MVP: add unit tests for authentication logic, session parsing, Valentine’s lock, and API handlers using `vitest` or `jest`.

## Deployment & setup instructions (for README)

1. **Create Supabase project** — Sign in to Supabase and create a new project. Note the `SUPABASE_URL` and service role keys (`SUPABASE_SERVICE_ROLE_KEY`).
2. **Run migrations** — Use the `supabase` CLI or your migration tool to apply the SQL schema and seed script to the new database. Ensure the unique constraint and seed data are applied.
3. **Configure environment variables** — In Vercel and local `.env` files, set:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — for server access (never exposed to the client)
   - `ACW_PASSWORD_HASH`, `SLS_PASSWORD_HASH` — bcrypt hashes of partner passwords
   - `SESSION_SECRET` — random 32-byte secret to sign cookies
   - `NODE_ENV` — `production` or `development`
4. **Run locally** — Install dependencies (`pnpm install` or `npm install`), run the dev server with `pnpm dev`. Access `http://localhost:3000`.
5. **Deploy to Vercel** — Push the repository to GitHub, import into Vercel, set environment variables in the Vercel dashboard, and deploy. Vercel will detect the Next.js project and build it automatically.
6. **Manual steps**
   - Generate password hashes using Node (e.g., `bcryptjs.hash(password, 10)`) and copy them into the environment variables.
   - Ensure the session secret is long and random (e.g., generate via `openssl rand -base64 32`).
   - After initial deployment, verify that the Valentine lock works by changing system time or waiting until Feb 14.

## Out-of-scope and future considerations

- **Partner management** — The application currently hardcodes two partners. Future versions could include an admin interface for adding more partners and resetting passwords.
- **Notifications** — The MVP does not send emails or push notifications. In later iterations, consider adding email reminders ahead of Feb 14.
- **Mobile app** — While the responsive web version should work on mobile, a native mobile app is not included.
- **Multilingual support** — All prompts and UI text are in English.
- **API security** — The API is only exposed to the web app; there is no public API for third-party clients.
