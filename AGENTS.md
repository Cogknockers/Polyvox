# AGENTS.md — Polyvox

This repo is a Next.js app backed by **Supabase (hosted-only)**.
We do **not** use the Supabase CLI.

Agents should follow the rules below when making changes.

---

## Non-negotiable product invariants
- Preserve the jurisdiction hierarchy everywhere: **City → County → State → National/Federal**.
- Support cross-jurisdiction aggregation: **local instances → canonical issues/clusters** without losing provenance.
- **Do not hardcode party logic**. Keep ideology/party neutral; treat party as data where needed.
- Prefer **auditability**: important actions should be attributable and reviewable (who/what/when).

---

## Project setup (npm)
- Install: `npm ci` (preferred) or `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`
- Tests: `npm test` (if present)

If a command doesn’t exist in `package.json`, do not invent it—check scripts and use what’s available.

---

## Environment & secrets
- Do **not** commit secrets.
- Supabase is **hosted-only**: there is no local Supabase stack to start.
- Expect env vars in `.env.local` (or equivalent). Typical keys:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never exposed to the client)
- When adding a new env var:
  - Update `.env.example` (or your env template file)
  - Update any env documentation in `/docs` if present

---

## Supabase workflow (NO Supabase CLI)
### Schema changes & migrations (SQL-only)
- All schema/RLS changes must be represented as **SQL** stored in-repo.
- SQL migration files live in: **`db/migrations/`**
- Apply SQL via the **Supabase Dashboard → SQL Editor** (manual execution).
- File naming convention:

  `db/migrations/YYYYMMDD_HHMM__short_slug.sql`

  Example: `db/migrations/20260117_1430__add_issue_clusters.sql`

- Each migration should be **idempotent when practical**:
  - `create table if not exists ...`
  - `create index if not exists ...`
  - `alter table ... add column if not exists ...`
  - guarded `do $$ begin ... end $$;` blocks when needed

When proposing a DB change, include:
- The full SQL migration file contents
- Any required RLS policies
- Any backfill steps (SQL) if needed
- Any app code/type updates required

### RLS & security rules
- Default posture: **deny by default** with RLS enabled.
- Avoid broad policies like “all authenticated users can do everything.”
- Separate policies for `select`, `insert`, `update`, `delete`.
- Prefer using `auth.uid()` and explicit ownership / role tables.
- Never use the Service Role key in client-side code.

### Privileged operations
- Anything requiring `SUPABASE_SERVICE_ROLE_KEY` must run **server-side only**
  (Next.js Route Handler / Server Action / server utility).
- Client code must only use the anon key.

---

## Next.js conventions
- Keep server-only code server-only (Route Handlers, Server Actions, server utils).
- Do not move secrets into client components.
- Prefer minimal, scoped diffs. No drive-by refactors.

---

## Data model rules (Polyvox-specific)
- Jurisdictions must remain explicit and composable.
- Canonical issues must link to many local instances with provenance:

  `local_instance → jurisdiction → canonical_issue`

- Avoid ambiguous “location” fields that collapse city/county/state.
- Keep changes RLS-friendly: tables should support clear access patterns.

---

## Change discipline
- Make the smallest change that solves the task.
- Do not reformat unrelated files.
- If you’re unsure, add a short note with options rather than guessing.

---

## Definition of done for any change
- Lint passes: `npm run lint`
- Build passes: `npm run build`
- Any DB/RLS changes include:
  - a new SQL migration file committed to `db/migrations/`
  - updated types/interfaces if used
  - updated docs (if applicable)
