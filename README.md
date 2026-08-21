# SPM Pipeline

**Superpower Mentors — Pipeline Control**

Internal sales integrity, pipeline, scoring, and nurture layer that sits on top of HubSpot. HubSpot remains the CRM source of truth.

> We are not rebuilding HubSpot. We are making it impossible for Superpower Mentors to lose visibility into a lead between acquisition and close.

**Phase 1 (demo hardening) is on this branch:** `cursor/spm-pipeline-mvp-e857`  
**PR:** https://github.com/nszakapex/spm-pipeline/pull/2  
**`main` does not include the app or Phase 1.** Checkout this branch (or the PR) to see login, HMAC demo sessions, `src/proxy.ts`, `/api/logout`, and `.env.example`.

## Supported runtime (local + Vercel Preview)

| Variable | Required value |
| --- | --- |
| `APP_MODE` | `demo` |
| `HUBSPOT_MODE` | `mock` |
| `DEMO_SESSION_SECRET` | random secret, **≥ 32 characters** |

**`demo` + `mock` is the only supported deployed combination.**

- Supabase is **not** required for the demo.
- Supabase Auth mode (`APP_MODE=auth`) is **incomplete and unsupported**.
- HubSpot is **mocked** — no live CRM credentials or writes.
- Every displayed record is **synthetic sample data**.

## Local demo setup

```bash
npm ci
cp .env.example .env.local
openssl rand -hex 32
# Paste the output into .env.local as DEMO_SESSION_SECRET=...
npm run dev
```

Open http://localhost:3000 → sign in as **Maya Chen** (or another demo user).

Generate a secret without pasting it into chat or commits:

```bash
openssl rand -hex 32
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |

## Vercel Preview settings (proposed)

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `.` |
| Node.js Version | `24.x` |
| Install Command | default (`npm install` / lockfile) |
| Build Command | default (`npm run build`) |
| Output Directory | default |

### Preview environment variable **names** (never commit values)

- `APP_MODE`
- `HUBSPOT_MODE`
- `DEMO_SESSION_SECRET` (Sensitive)

Do **not** set Supabase or HubSpot credentials for Preview.

Use a **protected Preview** (Vercel Authentication / Standard Protection) before any production decision.

## Docs

- [Architecture](./docs/architecture.md)
- [Brand audit](./docs/brand-audit.md)
- [Data model](./docs/data-model.md)
- [Scoring](./docs/scoring.md)
- [Reconciliation](./docs/reconciliation.md)
- [Demo guide](./docs/demo-guide.md)
- [Implementation plan](./docs/implementation-plan.md)

## Stack

Next.js App Router · TypeScript strict · Tailwind · SQL migrations (no ORM) · HubSpot mock adapter · demo-cookie auth · Vercel-ready
