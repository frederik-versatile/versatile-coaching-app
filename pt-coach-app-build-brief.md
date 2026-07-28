# PT Coach/Client App — Build Brief for Claude Code

> **How to use this document:** This is written as a project brief you can paste into Claude Code. Don't paste the whole thing in one go and expect one shot to build everything — work through the **Build Phases** section near the bottom in separate sessions, pasting the relevant phase plus the Data Model and Security sections each time for context. That will produce far better results than a single mega-prompt.

---

## 0. Project Summary & Assumptions

Build a web app with two user roles — **Coach** and **Client** — for running a personal training business online.

Assumptions baked into this design (flag to me if any are wrong):
- One coach account (you) initially, linked to multiple clients. The schema supports more coaches later without a rewrite.
- Web app, mobile-responsive, not a native app.
- Must run in production on the public internet, not just localhost — hosting is part of the plan from day one.
- Progress photos and weight/health data are sensitive personal data. Denmark/EU data protection rules (GDPR) apply since you're operating through Sowtown Miller ApS.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend/API | Next.js 14 (App Router), TypeScript, Tailwind CSS | One codebase, deploys cleanly to Vercel |
| Database + Auth + Storage | **Supabase** (EU region — Frankfurt) | Bundles Postgres, auth, and file storage; Row-Level Security enforces data isolation at the DB layer, not just in app code |
| Charts | Recharts | Handles the trend-line date-range toggle well |
| Hosting | Vercel, functions pinned to `fra1` (Frankfurt) | Fast EU deploys, auto SSL, git-based CI/CD |
| Error monitoring | Sentry (optional, Phase 7) | Catch production issues before clients report them |

**Data access pattern:** Use the Supabase client library with the user's own session (not a service-role key) for all normal reads/writes. This means Postgres Row-Level Security policies are the actual enforcement layer — even if a bug in your app code forgot to filter by client, the database itself would refuse to return another client's row. Only use the service-role key for a small number of trusted server-only operations (e.g. sending client invites), and never expose it to the browser bundle.

---

## 2. Data Model (Postgres / Supabase SQL)

```sql
-- Extends Supabase's built-in auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('coach','client')),
  full_name text,
  created_at timestamptz default now()
);

create table coach_clients (
  coach_id uuid references profiles(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade,
  primary key (coach_id, client_id)
);

create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  week_start date not null,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid references weekly_plans(id) on delete cascade,
  day_of_week int not null, -- 0=Mon .. 6=Sun
  name text not null,
  sort_order int default 0
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade,
  name text not null,
  target_sets int,
  target_reps text,        -- e.g. "8-10"
  target_weight_kg numeric,
  notes text,
  sort_order int default 0
);

create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade,
  log_date date not null,
  status text check (status in ('completed','skipped')) not null,
  notes text,
  created_at timestamptz default now()
);

create table exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid references workout_logs(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  set_number int not null,
  reps int,
  weight_kg numeric,
  created_at timestamptz default now()
);

create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  log_date date not null,
  weight_kg numeric not null,
  created_at timestamptz default now(),
  unique(client_id, log_date)
);

create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  storage_path text not null,   -- path inside the private bucket, see Section 4
  taken_date date not null,
  created_at timestamptz default now()
);

create table macro_splits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  effective_date date not null,
  calories int,
  protein_g int,
  carbs_g int,
  fat_g int,
  set_by uuid references profiles(id)
);

create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  effective_date date not null,
  content jsonb not null,   -- structured meal list, keep flexible
  set_by uuid references profiles(id)
);
```

**Volume metric** (for the trend chart): `volume = Σ(reps × weight_kg)` across `exercise_logs` for a given `workout_log`. Aggregate by day/week for the chart.

**Macro splits & meal plans are versioned by `effective_date`**, not overwritten — so history is preserved when you adjust a client's targets.

---

## 3. Row-Level Security (the actual security boundary)

Enable RLS on every table. Pattern to repeat across `weight_logs`, `progress_photos`, `workout_logs`, `weekly_plans`, etc.:

```sql
alter table weight_logs enable row level security;

-- Clients see and write only their own rows
create policy "clients manage own weight logs"
  on weight_logs for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- Coaches see (read-only) their linked clients' rows
create policy "coaches read linked clients' weight logs"
  on weight_logs for select
  using (
    exists (
      select 1 from coach_clients
      where coach_clients.client_id = weight_logs.client_id
      and coach_clients.coach_id = auth.uid()
    )
  );
```

For tables coaches should **edit** (weekly_plans, workouts, exercises, macro_splits, meal_plans), add an additional coach `insert`/`update` policy using the same `coach_clients` join — clients get read-only policies on those instead.

**Ask Claude Code to write an explicit test** (even a simple script) that logs in as Client A and confirms a request for Client B's weight log, photo, or plan returns nothing. This is the single most important test in the app — don't skip it.

---

## 4. Progress Photos — Storage & Security

Photos are the most sensitive data in this app. Treat them accordingly:

- Store in a **private** Supabase Storage bucket (never public). Path convention: `progress-photos/{client_id}/{timestamp}-{filename}`.
- Access only via **short-lived signed URLs** (a few minutes), generated server-side, never a permanent public link.
- RLS on `storage.objects`, mirroring the pattern above:

```sql
create policy "clients manage own photos"
on storage.objects for all
using (
  bucket_id = 'progress-photos'
  and (auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'progress-photos'
  and (auth.uid())::text = (storage.foldername(name))[1]
);

create policy "coaches view linked clients' photos"
on storage.objects for select
using (
  bucket_id = 'progress-photos'
  and exists (
    select 1 from coach_clients
    where coach_clients.coach_id = auth.uid()
    and coach_clients.client_id::text = (storage.foldername(name))[1]
  )
);
```

- Validate file type (images only) and cap file size client-side before upload; resize/compress client-side too (saves storage cost and upload time on mobile data).
- No third-party image CDN or public sharing feature for these photos, ever.

---

## 5. GDPR / Privacy — Non-negotiables

Since photos and weight data are "special category" health data under GDPR, and you're Denmark/EU-based:

- **Explicit, specific consent** at signup for photo storage and progress tracking — not buried in generic terms. Record consent with a timestamp in the DB.
- **Data minimization** — don't collect fields you don't need.
- **Right to erasure** — build an account-deletion flow that actually cascades: deletes storage objects, not just DB rows referencing them.
- **Right to access/export** — a client should be able to request their own data.
- **EU data residency** — keep Supabase project region set to Frankfurt; pin Vercel functions to `fra1`.
- **A real privacy policy** covering what's collected, why, retention period, and rights — this is a legal document, not just a UI checkbox. Flag this to me separately when you're ready; I can help draft it the way I did for your LinkedIn ads app.
- **72-hour breach notification duty** exists under GDPR if things go wrong — worth having basic logging/alerting (Sentry, Supabase logs) so you'd actually notice a breach.

None of this blocks building the MVP — it just needs to be true by the time real client data goes in.

---

## 6. Feature List (mapped to your spec)

### Client interface
1. **Weekly training plan view** — current week's `weekly_plans` + nested `workouts`, day-by-day.
2. **Workout detail view** — exercises within a workout: target sets/reps/weight, notes.
3. **Log completed/skipped** — one action per workout, writes to `workout_logs.status`.
4. **Log sets/reps/weight per exercise** — form pre-filled from `exercises` targets, writes to `exercise_logs`; allow adding extra sets beyond the plan.
5. **Log weight** — simple date + weight_kg entry, one per day.
6. **Upload progress photos** — see Section 4.
7. **Trend line (weight + volume), 30/90/180/365-day toggle** — Recharts, filtered by `log_date >= now() - interval`.

### Coach interface
1. **Add clients** — invite-by-email flow: generate a signup link/token, client sets their own password on first login (you should never see or set client passwords).
2. **See clients' weight/volume trends** — same chart component as client-side, coach picks a client from a list first.
3. **Edit weekly plans** — week builder UI.
4. **Edit workouts/exercises** — per-workout exercise builder; consider an optional reusable exercise-name library later to speed up plan-building.
5. **Edit macro splits** — versioned by effective date (Section 2).
6. **Edit meal plans** — structured or flexible free-text, your call on rigidity.
7. **View progress photos** — gallery per client, sorted by date; a side-by-side compare view is a nice Phase 2 add.

**Optional future enhancement:** since you're already integrating the Claude API into Ezra, the coach-side plan/macro editors could get an "AI draft" button that proposes a starting point via the Claude API, which you then review and edit — not required for MVP, just worth knowing the door's open.

---

## 7. Design Tokens (from your palette)

Exact colors pulled from your reference image:

| Token | Hex | Use |
|---|---|---|
| Accent (CTAs, highlights, active states) | `#EC5E2A` | Log buttons, primary actions, chart accent |
| Ink (primary text) | `#151412` | Body text, headers |
| Surface — charcoal | `#5D5D5D` | Secondary surfaces, nav, muted UI |
| Surface — light neutral | `#C4C4C4` | Borders, dividers, disabled states |
| Background | `#EDE7E0` | Page background, cards |
| White | `#FFFFFF` | Card surfaces, contrast areas |

Keep it minimal: beige/white backgrounds, near-black text, charcoal for secondary/nav elements, orange reserved for actions and progress indicators so it doesn't get visually noisy.

---

## 8. Build Phases (paste one at a time into Claude Code)

**Phase 0 — Scaffold & deploy skeleton**
Next.js + Tailwind scaffold, Supabase project (Frankfurt region), `profiles` table + auth with role-based signup, basic coach/client login. Deploy to Vercel immediately — get a live URL before building further features.

**Phase 1 — Coach-side plan building**
`weekly_plans`, `workouts`, `exercises` tables + RLS. Coach UI to create/edit a client's weekly plan and workouts.

**Phase 2 — Client-side logging**
Client views for weekly plan/workouts, log completed/skipped, log sets/reps/weight, log weight. Full RLS on all logging tables + the isolation test from Section 3.

**Phase 3 — Progress photos**
Private bucket, signed URLs, upload UI, coach gallery view. Hardening per Section 4.

**Phase 4 — Trend charts**
Weight + volume trend lines with 30/90/180/365-day range toggle, both client and coach views.

**Phase 5 — Macros & meal plans**
`macro_splits`, `meal_plans` tables, coach edit UI, client read-only view.

**Phase 6 — Coach dashboard polish**
Client list/overview, invite-client flow, at-a-glance client status.

**Phase 7 — Production hardening**
Rate limiting on auth, verify backups are actually running, error monitoring, custom domain, and the real privacy policy before any real client data goes in.

---

## 9. Deployment Checklist (for when you get there)

- Supabase project region: Frankfurt (`eu-central-1`)
- Vercel functions region: `fra1`
- Env vars in Vercel project settings (never committed to git): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, no `NEXT_PUBLIC_` prefix)
- Custom domain → CNAME to Vercel, SSL is automatic
- Confirm Supabase backup/point-in-time-recovery settings — free tier retention is short; consider upgrading before real client data is in play

I'm happy to walk through the actual deployment steps with you when you're at that point — just flag me.
