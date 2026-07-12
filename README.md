# TutorForge

Real-time AI voice tutoring — learn any subject through natural conversations with customizable AI companions.

**Stack:** Next.js 15 · Clerk · Supabase · Vapi · Gemini

---

## Features

- **Voice sessions** — real-time tutoring via Vapi
- **Companion library** — public/private tutors, bookmark, clone, sort (newest / popular / top rated)
- **Custom system prompt** — per-companion teaching instructions
- **Session replay** — transcript, AI summary, quiz, flashcards, export (Markdown / text / Print PDF)
- **My Journey** — analytics, streaks, flashcard review deck, optional study reminder emails
- **i18n (en/vi/es/zh/ja)** — locale switcher, localized marketing, per-companion session language
- **Usage limits** — monthly voice minutes by Clerk plan (Basic / Core Learner / Pro Companion)

---

## Quick start

```bash
git clone <repo-url>
cd Saas_fullstack
npm install
cp .env.example .env.local   # or create .env.local manually
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Create `.env.local` in the project root:

```bash
# Clerk — https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase — https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_DB_PASSWORD=          # optional — for ./scripts/run-migration.sh

# Vapi — voice sessions
NEXT_PUBLIC_VAPI_WEB_TOKEN=

# Gemini — session summary, quiz, flashcards (optional)
GEMINI_API_KEY=

# Sentry — optional, for source maps on build
SENTRY_AUTH_TOKEN=

# Study reminders (optional — requires migration 007)
RESEND_API_KEY=
EMAIL_FROM=reminders@yourdomain.com
CRON_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database migrations

Run **once** on a new Supabase project via [SQL Editor](https://supabase.com/dashboard), in order:

| File | Purpose |
|------|---------|
| `scripts/migrations/001-feature-pack.sql` | `is_public`, bookmarks, transcript columns, RLS |
| `scripts/migrations/002-session-summary.sql` | `summary`, `quiz` on sessions |
| `scripts/migrations/003-session-snapshot.sql` | Companion name/topic/subject snapshot on sessions |
| `scripts/migrations/004-system-prompt.sql` | `companions.system_prompt` |
| `scripts/migrations/005-companion-ratings.sql` | `companion_ratings` table |
| `scripts/migrations/006-session-flashcards.sql` | `session_history.flashcards` jsonb |
| `scripts/migrations/007-reminders.sql` | Study reminder preferences + send log |
| `scripts/migrations/008-locale.sql` | `companions.session_locale` for voice i18n |
| `scripts/migrations/009-locale-expand.sql` | Expand session_locale to en/vi/es/zh/ja |
| `scripts/migrations/010-scale-indexes.sql` | Composite indexes for sessions & library |
| `scripts/migrations/011-companion-rating-stats.sql` | Denormalized `average_rating`, `rating_count` |
| `scripts/migrations/012-user-learning-stats.sql` | `user_learning_stats` + usage RPC |
| `scripts/migrations/013-session-messages.sql` | Append-only `session_messages` for transcripts |
| `scripts/migrations/014-search-trgm.sql` | `pg_trgm` indexes + reminder cron RPC |
| `scripts/migrations/015-rag.sql` | PDF documents, `pgvector`, storage bucket |
| `scripts/migrations/016-marketplace.sql` | Marketplace status, tags, featured, reports, clone count |
| `scripts/migrations/017-classroom.sql` | Classrooms, roster, assignments, teacher analytics RPC |

**CLI alternative** (requires `psql` + `SUPABASE_DB_PASSWORD`):

```bash
./scripts/run-migration.sh   # applies 001 only — run 002–017 manually in SQL Editor
```

Optional env for marketplace admin queue:

```bash
ADMIN_USER_IDS=user_xxx,user_yyy   # comma-separated Clerk user IDs
```

Restore / reference schema: `scripts/supabase-restore-public.sql`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test:smoke` | Smoke test DB schema + HTTP routes |
| `npm run test:reminder` | Unit checks for reminder engine logic |
| `npm run test:library-search` | Unit checks for library search sanitization |
| `npm run backfill:learning-stats` | Backfill `user_learning_stats` (service role key) |
| `npm run migrate:transcripts` | Migrate jsonb transcripts → `session_messages` |
| `npm run test:e2e` | Playwright E2E tests (public + optional authenticated) |
| `npm run test:e2e:ui` | Playwright UI mode |

Smoke test expects `.env.local` with Supabase keys and a running dev server (`APP_URL` defaults to `http://localhost:3000`):

```bash
npm run dev          # terminal 1
npm run test:smoke   # terminal 2 — expect 22/22 passed after migrations (017 for classroom)
```

### E2E tests (Playwright)

Requires Chromium (installed via `npx playwright install chromium`).

**Public tests** (no extra config):

```bash
npm run test:e2e
```

**Authenticated tests** — add to `.env.local`:

```bash
E2E_CLERK_USER_EMAIL=your-clerk-user@example.com
# Optional — marketplace admin approve test
ADMIN_USER_IDS=user_xxx
# Optional — full classroom student join flow (second Clerk user)
E2E_CLERK_STUDENT_EMAIL=student@example.com
```

Uses `@clerk/testing` with your `CLERK_SECRET_KEY` (Clerk **development** instance only). Auth state is saved to `playwright/.clerk/user.json` (gitignored).

First-time setup:

```bash
npx playwright install chromium
```

```bash
npm run dev            # terminal 1
npm run test:e2e       # terminal 2 — 13 public/i18n tests (always)
                       # + authenticated/marketplace/classroom if E2E_CLERK_USER_EMAIL is set
                       # + classroom-student if E2E_CLERK_STUDENT_EMAIL is set
npm run test:e2e:ui    # interactive debugger
```

---

## Project structure

```
app/                    # Next.js App Router pages
components/             # UI components
lib/
  actions/              # Server actions (companions, sessions, ratings, flashcards…)
  session-persistence.ts
constants/              # Subjects, voices, plans, Vapi prompts
scripts/
  migrations/           # SQL migrations (001–009)
  test-smoke.mjs
  test-reminder-engine.mjs
docs/
  FEATURE-PLAN.md       # Roadmap, known issues, test checklist
  PHASE-C1-C7-PLAN.md   # Roadmap C1/C5/C6 (C3/C7 done)
  PHASE-SCALE-P0-P2-PLAN.md  # Backend scale trước khi data lớn
```

---

## Key routes

| Route | Description |
|-------|-------------|
| `/` | Home / dashboard |
| `/companions` | Companion library (filter, search, sort) |
| `/companions/new` | Create companion |
| `/companions/[id]` | Voice session + companion detail |
| `/companions/[id]/edit` | Edit companion |
| `/sessions/[id]` | Session replay (transcript, summary, quiz, flashcards) |
| `/my-journey` | Progress, analytics, flashcard deck |
| `/pricing` | Plan comparison (marketing) |
| `/subscription` | Clerk billing / upgrade |

---

## Plans (Clerk)

| Plan | Highlights |
|------|------------|
| Basic Plan | Browse library, 60 min/month |
| Core Learner | 3 companions, 120 min/month, analytics |
| Pro Companion | Unlimited companions & minutes |

Plan limits: `constants/plans.ts` · `lib/plan-access.ts`

---

## Docs

- [Feature Plan & Roadmap](docs/FEATURE-PLAN.md)
- [Phase C2–C9 plan (done)](docs/PHASE-C2-C9-PLAN.md)
- [Phase C1/C3/C5/C6/C7 plan (next)](docs/PHASE-C1-C7-PLAN.md)

---

## Onboarding

First-time signed-in users see a 3-step wizard (stored in `localStorage` as `tutorforge_onboarding_complete`). To replay: clear that key in DevTools → Application → Local Storage.

---

## License

Private project — see repository owner for terms.
