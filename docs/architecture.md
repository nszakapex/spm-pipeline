# Architecture

## Thesis

We are not rebuilding HubSpot. SPM Pipeline is the operational visibility and control layer that makes it extremely difficult for Superpower Mentors to lose a lead between acquisition and close.

## One application, two engines

| Engine | Responsibility |
| --- | --- |
| Lead Capture & Integrity | Source events, reconciliation, unmatched/missing detection, sync health |
| Pipeline & Nurture | Scoring, stages/dispositions, SLA flags, queues, Jake-ready handoff |

Shared: auth, database model, canonical leads, source events, timelines, scoring, analytics, HubSpot adapter, users, activities.

## Runtime modes

| Variable | Values | Behavior |
| --- | --- | --- |
| `APP_MODE` | `demo` (default), `auth` | Demo uses signed httpOnly session cookie. Auth uses Supabase Auth architecture. |
| `HUBSPOT_MODE` | `mock` only in this prototype | Live mode throws; no credentials requested. |

Demo auth is isolated in `src/lib/auth/*` and must never become an insecure production fallback.

## Data access

- SQL migrations in `supabase/migrations` (no ORM).
- Prototype serves a seeded in-memory store via `src/lib/db/store.ts` so the demo runs without live Supabase.
- Types live in `src/types/domain.ts`.

## Integration boundary

```text
UI / server pages
  → domain libs (scoring, nurture flags, reconciliation, analytics)
  → integrations/hubspot/* (mock client)
```

UI never calls HubSpot directly.

## Key domain modules

- `src/lib/scoring/score-lead.ts` — deterministic scoring
- `src/lib/nurture/flags.ts` — SLA / at-risk rules
- `src/lib/integrity/reconciliation.ts` — source integrity + pipeline health
- `src/integrations/hubspot/*` — mock adapter
