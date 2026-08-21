# Demo Guide

## Supported modes

| Mode | Status |
| --- | --- |
| `APP_MODE=demo` + `HUBSPOT_MODE=mock` | **Only supported** combination for local and Vercel Preview |
| `APP_MODE=auth` | Unsupported — Supabase Auth login/session refresh not implemented |
| `HUBSPOT_MODE=live` | Rejected — no live HubSpot credentials or writes |

Supabase is **not required** for the demo. Every displayed record is synthetic.

## Local setup

```bash
npm ci
cp .env.example .env.local
openssl rand -hex 32
# Set DEMO_SESSION_SECRET in .env.local to that value (do not commit it)
npm run dev
```

Open http://localhost:3000 and sign in as **Max Sussman** (Sales), **Mack Ianni** (Sales), or **Nate Szakallas** (Admin).

`DEMO_SESSION_SECRET` must be at least 32 characters. On Vercel Preview/Production it is required and must not use placeholder or test-only values.

## Story to present

1. **Marketing generates leads** — multiple sources feed `lead_source_events`.
2. **Source Integrity proves they arrived** — open **Sources**. Select Meta / Instagram. Show 41 vs 40 and the unmatched event.
3. **Pipeline Control identifies action** — **Dashboard** Needs Attention + Priority Leads.
4. **Scoring prioritizes humans** — open Sarah Thompson (`/leads/lead_001`); walk **Why this score?**
5. **Nurture prevents “not now” from becoming lost** — **Nurture** queues.
6. **Jake-ready creates a clean handoff** — filter Jake Ready / pipeline column.
7. **Funnel analytics show what converts** — **Analytics** source comparison.

## Auth notes

- Demo login sets an HttpOnly, SameSite=Lax cookie (`spm_demo_session`), Path=/, 14-day max age.
- Cookies are `Secure` on Vercel and HTTPS; localhost HTTP remains non-Secure so local login works.
- Invalid or expired cookies must reach `/login` without redirect loops.
- Authorization is enforced by verified session lookup in the authenticated app layout — not by cookie name presence alone.

## Vercel Preview (names only)

Configure Preview variables:

- `APP_MODE=demo`
- `HUBSPOT_MODE=mock`
- `DEMO_SESSION_SECRET` (Sensitive; generate with `openssl rand -hex 32`)

Proposed project settings:

- Framework: Next.js
- Root Directory: `.`
- Node.js: `24.x`
- Default install/build/output
- Protected Preview before any production decision

## Reminders

- Subtle shell disclosure: **Demo · synthetic data · HubSpot mock**
- Call / Email / Text / Book actions are mocked UI affordances — no live outreach
- Do not claim records are real SPM customers
- Do not enable live HubSpot or Supabase without a new explicit approval
