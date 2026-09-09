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

1. **Max signs in** — click Max’s profile, enter the shared demo password, then sales nav is Home, Leads, Nurture, Pipeline. Sources, Analytics, Integrations, and Settings stay under Admin.
2. **Home is one queue** — **Work next** lists about ten unique people, reply-first.
3. **Open Sarah Thompson** (`/leads/lead_001`) — **Next Action** sits under her name; log the result after you do it. No environment-variable copy.
4. **Nurture does not repeat people** — Sarah appears once under Needs reply; overdue/due today stay as flags.
5. **Nate opens Admin** — Sources, Analytics, Integrations, and Settings. Integrations still holds webhook routes and secrets.

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

- Subtle shell disclosure: **Demo · HubSpot mock** in the sidebar account card
- Call / Email / Text / Book actions are mocked UI affordances — no live outreach
- Signed `/api/webhooks/*` routes are pre-registered in mock (see [Integrations by stage](./integrations-by-stage.md))
- Do not claim records are real SPM customers
- Do not enable live HubSpot or Supabase without a new explicit approval
