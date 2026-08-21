# SPM Pipeline

**Superpower Mentors — Pipeline Control**

Internal sales integrity, pipeline, scoring, and nurture layer that sits on top of HubSpot. HubSpot remains the CRM source of truth.

> We are not rebuilding HubSpot. We are making it impossible for Superpower Mentors to lose visibility into a lead between acquisition and close.

## Quick start (demo)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sign in with a demo user on `/login` (`APP_MODE=demo`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |

## Docs

- [Architecture](./docs/architecture.md)
- [Brand audit](./docs/brand-audit.md)
- [Data model](./docs/data-model.md)
- [Scoring](./docs/scoring.md)
- [Reconciliation](./docs/reconciliation.md)
- [Demo guide](./docs/demo-guide.md)
- [Implementation plan](./docs/implementation-plan.md)

## Stack

Next.js App Router · TypeScript strict · Tailwind · selective shadcn-style primitives · Supabase Auth architecture · SQL migrations (no ORM) · HubSpot mock adapter · Vercel-ready

## Modes

- `APP_MODE=demo` — isolated demo session (default)
- `APP_MODE=auth` — Supabase Auth (requires Supabase env)
- `HUBSPOT_MODE=mock` — only supported mode in this prototype
