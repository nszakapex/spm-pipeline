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
| `APP_MODE` | `demo` only (supported) | Signed HttpOnly demo session cookie. `auth` throws — Supabase Auth is unimplemented. |
| `HUBSPOT_MODE` | `mock` only | Live mode throws; no credentials requested. |
| `DEMO_SESSION_SECRET` | ≥ 32 chars | Required for local/.env.local and all Vercel runtimes. No production-capable default. |

Demo auth is isolated in `src/lib/auth/*` and must never become an insecure production fallback.

## Route protection

- `src/proxy.ts` — Next.js 16 Proxy (replaces deprecated Middleware). Optimistic redirects after **HMAC verification** of the demo cookie. Does not treat cookie presence or `sb-*` cookies as authentication. `/api/webhooks/*` is public; webhook auth is a separate HMAC.
- `src/app/(app)/layout.tsx` — **authorization boundary** via `getSessionUser()`.
- Valid users visiting `/login` are redirected by the login page after verified session lookup (avoids invalid-cookie redirect loops).

## Data access

- SQL migrations in `supabase/migrations` (no ORM) — reference schema only for a future pilot.
- Runtime `getStore()` serves the in-memory seeded dataset plus a process-local overlay for signed webhook ingest. No Supabase, SQL, or network data plane in demo mode.
- Types live in `src/types/domain.ts`.

## Integration boundary

```text
UI / server pages
  → domain libs (scoring, nurture flags, reconciliation, analytics, stage ingest)
  → integrations/hubspot/* (mock client — no HTTP)
  → integrations/webhooks/* (signed mock ingest)
```

UI never calls HubSpot, Jake's calendar, or a dialer directly. Demo runtime does not contact Supabase or HubSpot.

Inbound events use pre-registered routes under `/api/webhooks/*` (HMAC `spm-v1`). See [Integrations by stage](./integrations-by-stage.md).

## Key domain modules

- `src/lib/scoring/score-lead.ts` — deterministic scoring
- `src/lib/nurture/flags.ts` — SLA / at-risk rules
- `src/lib/integrity/reconciliation.ts` — source integrity + pipeline health
- `src/lib/pipeline/stage-integrations.ts` — stage × HubSpot / calendar / calls / replies
- `src/lib/pipeline/apply-ingest.ts` — webhook → stage / next action / score
- `src/integrations/hubspot/*` — mock adapter + webhook mapper
- `src/integrations/webhooks/*` — signature, parse, ingest
- `src/integrations/hubspot/signature.ts` — HubSpot v3 HMAC (ready when client secret is set)
- `src/lib/auth/demo-token.ts` — HMAC demo session tokens
