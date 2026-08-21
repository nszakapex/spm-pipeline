# SPM Pipeline — Implementation Plan

**Product:** SPM Pipeline
**Internal title:** Superpower Mentors — Pipeline Control
**Status:** Awaiting approval — no application implementation until approved
**Repo state at planning:** Greenfield (`README.md` + `.gitignore` only)
**Thesis:** We are not rebuilding HubSpot. We are making it impossible for Superpower Mentors to lose visibility into a lead between acquisition and close.

---

## 1. Product Architecture

### One product, two engines

SPM Pipeline is a single authenticated Next.js application with one shared domain model and two tightly connected operational engines:

| Engine | Purpose | Primary surfaces |
| --- | --- | --- |
| **Lead Capture & Integrity** | Prove every submission became a CRM lead, with source, owner, and sync truth | `/sources`, integrity alerts on `/dashboard`, `/integrations` |
| **Pipeline & Nurture** | Prioritize, score, stage, and force next actions until disposition | `/pipeline`, `/nurture`, `/leads`, control tower on `/dashboard` |

Both engines share:

- Supabase Auth + app users
- Postgres lead/activity/source tables
- HubSpot integration adapter (`mock` now, `live` later)
- Analytics derived from the same lead facts
- One activity timeline per lead

### System shape

```text
Acquisition sources (web, ads, referrals, partners, phone, manual)
        │
        ▼
Ingestion boundary  ──►  source_submissions (immutable intake events)
        │
        ▼
Canonical leads (SPM Pipeline working copy)  ◄──►  HubSpot (SoT in v1)
        │
        ├── Integrity engine (reconcile, unmatched, sync failures, no source/owner)
        ├── Scoring engine (deterministic, explainable)
        ├── Pipeline / nurture engine (SLA, queues, next actions)
        └── Analytics (funnel + source economics)
```

### Design principles

1. **HubSpot remains CRM source of truth in v1.** SPM Pipeline stores a working operational projection optimized for integrity, scoring, queues, and SLA — not a competing contact database philosophy.
2. **Every active lead is incomplete without:** source, owner, stage, score, last activity, next action.
3. **Intake events are first-class.** Source submissions exist even before (or without) a HubSpot contact, so missing leads are visible.
4. **Explainability over magic.** Scores, risk flags, and sync states must show *why*.
5. **Privacy-minimized sales data.** Parent/guardian decision-maker focus; no clinical mentee dossier.
6. **Prototype uses mock HubSpot + fictional sample data only.** No SPM credentials, no real customer records.

### What this product is / is not

| Is | Is not |
| --- | --- |
| Lead integrity + sales control tower | Replacement CRM |
| Scoring / prioritization / nurture enforcement | Live SMS/email/dialer in v1 |
| HubSpot-aware operational layer | Clinical matching / mentee EHR |
| Mobile-first sales workbench | Generic analytics BI tool |

---

## 2. Recommended Stack

### Adopt as proposed

| Layer | Choice | Rationale |
| --- | --- | --- |
| App | Next.js App Router | Vercel-native, server components, route protection |
| Language | TypeScript strict | Domain safety for scoring, sync, enums |
| Styling | Tailwind CSS + shadcn/ui (selective) | Speed + accessible primitives without Salesforce clutter |
| DB / Auth | Supabase Postgres + Supabase Auth | Auth + RLS + SQL in one place |
| Hosting | Vercel | Fits App Router + edge/serverless patterns |
| Integration | Local HubSpot adapter with `HUBSPOT_MODE=mock\|live` | Clean swap without leaking credentials into UI |

### Confirmed decisions / small refinements

1. **Server-first data access** — Prefer Server Components + server actions / route handlers. Client components only for interactive queues, filters, command palette, and mobile action sheets.
2. **No Prisma required for v1** — Use Supabase client + typed SQL/`drizzle` *or* Supabase-generated types. Recommendation: **Drizzle ORM** for migrations, typed queries, and enum safety without fighting Supabase Auth. If team prefers zero ORM, use SQL migrations + `@supabase/supabase-js` with hand-typed models. Plan assumes Drizzle unless approval prefers otherwise.
3. **shadcn/ui where appropriate** — Dialogs, sheets, dropdowns, form controls, tables. Custom SPM brand shell for nav, score badges, integrity alerts, and control-tower cards (avoid generic “admin dashboard kit” look).
4. **Validation** — Zod for forms, env, HubSpot payloads, scoring inputs.
5. **Testing** — Vitest (unit/domain) + Playwright (auth/routes/responsive) + `next build` in CI.
6. **No live outreach vendors in prototype** — UI affordances only; provider choice is an open question.

### Explicit non-goals for stack (prototype)

- Live HubSpot private app / OAuth
- Real Twilio/email/calendar writes
- Multi-tenant SaaS packaging
- LLM-assigned lead scores

---

## 3. Repository / File Structure

Proposed layout after foundation (not created until approval):

```text
/
├── docs/
│   ├── implementation-plan.md          # this document
│   ├── brand-audit.md                  # Phase 1 deliverable
│   └── domain-model.md                 # optional living notes
├── public/
│   └── brand/
│       ├── logo-banner.svg             # from public SPM asset if licensed for internal use
│       └── logo-mark.svg               # from public favicon / mark
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx              # authenticated shell
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── sources/page.tsx
│   │   │   ├── leads/page.tsx
│   │   │   ├── leads/[id]/page.tsx
│   │   │   ├── pipeline/page.tsx
│   │   │   ├── nurture/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── integrations/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── webhooks/hubspot/route.ts   # stubbed; live later
│   │   │   └── health/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── brand/
│   │   ├── layout/                     # sidebar, mobile nav, command palette
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── sources/
│   │   ├── pipeline/
│   │   ├── nurture/
│   │   ├── scoring/
│   │   └── ui/                         # shadcn
│   ├── lib/
│   │   ├── brand-tokens.ts
│   │   ├── supabase/
│   │   │   ├── client.ts               # browser (anon)
│   │   │   ├── server.ts               # cookies/session
│   │   │   └── admin.ts                # server-only service role if needed
│   │   ├── auth/
│   │   ├── db/                         # drizzle schema + queries
│   │   ├── scoring/
│   │   │   ├── rules.ts
│   │   │   ├── score-lead.ts
│   │   │   └── bands.ts
│   │   ├── pipeline/
│   │   │   ├── stages.ts
│   │   │   ├── transitions.ts
│   │   │   └── guards.ts               # the 10 operational guarantees
│   │   ├── nurture/
│   │   │   ├── sla.ts
│   │   │   ├── flags.ts
│   │   │   └── queues.ts
│   │   ├── integrity/
│   │   │   ├── reconcile.ts
│   │   │   └── source-health.ts
│   │   ├── analytics/
│   │   └── demo/
│   │       ├── seed.ts
│   │       └── sample-leads.ts
│   ├── integrations/
│   │   └── hubspot/
│   │       ├── client.ts
│   │       ├── types.ts
│   │       ├── mock.ts
│   │       ├── sync.ts
│   │       ├── mapper.ts
│   │       └── webhooks.ts             # future
│   └── types/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
└── README.md
```

Separation rule: **UI never talks to HubSpot directly.** Screens call domain services; domain services call `integrations/hubspot/*`.

---

## 4. Database Model

### Core tables

#### `profiles`
App user profile linked to `auth.users`.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | = auth.users.id |
| full_name | text | |
| email | text | |
| role | enum | `admin`, `sales`, `viewer` (roles soft for prototype) |
| is_active | bool | |
| created_at / updated_at | timestamptz | |

#### `lead_sources`
Catalog of acquisition channels the system can represent (not all need to be live).

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| key | text unique | e.g. `meta_ads`, `find_right_mentor` |
| name | text | display |
| category | enum | see enums |
| is_active | bool | |
| expected_volume_hint | int null | optional for health UX |
| created_at | timestamptz | |

#### `source_submissions`
Immutable intake events — the integrity spine.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| source_id | uuid FK | |
| external_submission_id | text | Meta lead id, form response id, etc. |
| submitted_at | timestamptz | |
| raw_payload | jsonb | minimized; no clinical fields |
| identity_email / identity_phone | text null | normalized for matching |
| match_status | enum | `unmatched`, `matched`, `duplicate_suspect`, `ignored` |
| matched_lead_id | uuid null FK | |
| hubspot_sync_attempted | bool | |
| created_at | timestamptz | |

Unique: `(source_id, external_submission_id)` where external id present.

#### `leads`
Canonical operational lead (parent/guardian / decision-maker).

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| first_name / last_name | text | |
| email / phone | text null | |
| source_id | uuid null FK | null = integrity violation |
| source_detail | text null | freeform |
| campaign | text null | |
| utm_source / utm_medium / utm_campaign | text null | |
| external_source_id | text null | |
| owner_id | uuid null FK profiles | null = integrity violation if active |
| stage | enum | primary pipeline stage |
| disposition | enum null | side outcome when applicable |
| score | int | 0–100 |
| score_band | enum | P1–P4 |
| score_reasons | jsonb | explainable breakdown |
| score_version | text | e.g. `v1` |
| scored_at | timestamptz | |
| qualification_status | enum | `unknown`, `qualified`, `not_qualified`, `pending` |
| qualification_reason | text null | |
| qualified_at | timestamptz null | |
| meeting_booked_at | timestamptz null | |
| meeting_status | enum | `none`, `booked`, `held`, `no_show`, `canceled`, `rescheduled` |
| nurture_status | enum | `none`, `active`, `paused`, `exited` |
| nurture_reason | text null | |
| nurture_until | timestamptz null | next nurture touch |
| next_action_type | enum null | |
| next_action_at | timestamptz null | |
| next_action_note | text null | |
| first_contact_at / last_contact_at / last_activity_at | timestamptz null | |
| lost_reason | text null | required when LOST |
| handoff_status | enum | `not_applicable`, `needed`, `ready`, `sent`, `accepted` |
| jake_ready_at | timestamptz null | |
| hubspot_contact_id / hubspot_lead_id / hubspot_deal_id | text null | |
| sync_status | enum | `not_synced`, `synced`, `pending`, `failed`, `conflict` |
| last_synced_at | timestamptz null | |
| is_duplicate_of | uuid null FK leads | |
| closed_at | timestamptz null | |
| created_at / updated_at | timestamptz | |

#### `lead_activities`
Chronological timeline.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| lead_id | uuid FK | |
| actor_id | uuid null FK | system if null |
| activity_type | enum | captured, synced, assigned, call_attempted, email_logged, reply_received, stage_changed, note, meeting_*, score_recomputed, integration_failed, etc. |
| body | text null | |
| metadata | jsonb | |
| occurred_at | timestamptz | |
| created_at | timestamptz | |

#### `integration_events`
Failed/successful sync visibility.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| provider | text | `hubspot` |
| direction | enum | `inbound`, `outbound` |
| event_type | text | |
| status | enum | `success`, `failed`, `retrying` |
| lead_id / submission_id | uuid null | |
| payload_summary | jsonb | redacted |
| error_message | text null | |
| occurred_at | timestamptz | |

#### `source_daily_stats` (optional materialized / computed view)
For Sources screen performance: received, matched, synced, unmatched, failed, rates.

### Important enums

```text
source_category:
  website, form, assessment, organic, paid_search, paid_social,
  referral_family, referral_jake, school_partner, ed_consultant,
  clinician_referral, tutoring_provider, community, event,
  inbound_phone, manual, other_campaign

lead_stage:           # primary path (see §8)
  NEW, ATTEMPTING_CONTACT, CONNECTED, QUALIFIED,
  JAKE_READY, CALL_BOOKED, CALL_HELD, ENROLLMENT_PENDING, WON, LOST

lead_disposition:     # side outcomes, not parallel “happy path” stages
  NONE, NURTURE, NO_RESPONSE, NOT_QUALIFIED

score_band: P1_HOT, P2_HIGH, P3_NURTURE, P4_LOW

next_action_type:
  CALL_NOW, CALL, EMAIL, TEXT, FOLLOW_UP, RESCHEDULE,
  QUALIFY, HANDOFF, BOOK_MEETING, REVIEW, OTHER

sync_status: not_synced, pending, synced, failed, conflict
match_status: unmatched, matched, duplicate_suspect, ignored
```

### Indexes (critical)

- `leads(owner_id, stage, next_action_at)`
- `leads(score desc)` / `(score_band, last_activity_at)`
- `leads(source_id, created_at)`
- `leads(sync_status) where sync_status = 'failed'`
- `leads(owner_id) where owner_id is null and closed_at is null`
- `source_submissions(match_status, submitted_at)`
- `source_submissions(source_id, submitted_at)`
- `lead_activities(lead_id, occurred_at desc)`
- Unique normalized email/phone partial indexes for dedupe suspects

### RLS sketch

- Authenticated users can read operational tables.
- Writes limited by role (viewer read-only).
- Service role for sync jobs / seed.
- Prototype may start with authenticated-all-read + sales-write for speed, tighten later.

---

## 5. HubSpot Integration Architecture

### Adapter location

```text
src/integrations/hubspot/
  client.ts    # live HTTP client (unused in prototype)
  types.ts     # contacts/deals/notes/webhook DTOs
  mock.ts      # deterministic fixture graph
  sync.ts      # pull/push orchestration
  mapper.ts    # HubSpot ↔ canonical lead
  webhooks.ts  # future inbound events
```

### Modes

| Mode | Behavior |
| --- | --- |
| `HUBSPOT_MODE=mock` | All reads/writes against in-memory/DB fixtures; sync statuses simulated including failures |
| `HUBSPOT_MODE=live` | Real API via server-only secrets; never exposed to client |

Prototype ships **mock only**. Do not request HubSpot private app tokens.

### Sync directions (future live)

1. **HubSpot → SPM Pipeline** (primary): contacts, lifecycle/deal stage, meeting outcomes, owner, notes timestamps.
2. **SPM → HubSpot (approved fields only)**: stage changes, next-action notes, qualification flags, score band (if desired), activity summaries.

### Webhooks (planned, not built in early prototype)

- Contact creation/property change
- Deal stage change
- Meeting booked / no-show
- Form submission association

Webhook receiver authenticates signatures, writes `integration_events`, upserts leads, recomputes integrity flags. Polling remains fallback.

### Mapper philosophy

Map into canonical fields; do not mirror HubSpot’s entire property zoo in the UI. Preserve HubSpot IDs for round-trip. Unknown properties stay in a redacted `hubspot_raw_subset` only if needed for debugging — not shown as clinical detail.

### Mock realism

Mock must include:

- Synced happy-path contacts
- Unmatched source submissions
- Sync failures
- Owner missing in HubSpot
- Duplicate emails
- Deal-linked won/lost examples

---

## 6. Lead Ingestion Architecture

### Event-first intake

Every acquisition path eventually produces a `source_submission`, then a reconcile step creates/links a `lead`.

```text
Source connector / webhook / manual entry
        → normalize identity (email/phone)
        → write source_submission
        → attempt match to existing lead / HubSpot contact
        → create or link lead
        → enqueue HubSpot sync (mock)
        → assign default owner rules (or flag no owner)
        → set next_action (first contact SLA)
        → score
        → append activities
```

### Source categories the system must represent

Including (not all live today):

- Main website / waitlist
- Find the Right Mentor form
- Free assessment (capability, even if not live)
- Organic search
- Google Ads
- Meta / Instagram
- Existing-family referral
- Jake referral
- School partner
- Educational consultant
- Therapist / clinician referral
- Tutoring / coaching provider
- Community organization
- Event / speaking engagement
- Inbound phone inquiry
- Manually entered lead
- Other campaign source

### Public-site clues already visible (for planning only)

From the live marketing site (not an integration commitment):

- Family CTA: **Find the Right Mentor** / strategy call booking
- HubSpot Meetings links present on public site for strategy calls
- Typeform used for mentor applications / onboarding (privacy policy)
- Internal waitlist API pattern on marketing site
- Brochure hosted on HubSpot sales-engage domain

Exact production source → HubSpot property mapping remains an open question for SPM.

### Reconciliation UX (core feature)

Sources screen must make gaps obvious:

> Meta reports 41 submissions.
> 40 leads accounted for.
> **1 lead potentially missing.**

Implementation: compare `source_submissions` count vs matched leads / HubSpot-synced records for a period, surface `unmatched` + `failed` with drill-down.

### Deduplication

- Soft suspects on normalized email/phone
- UI: merge suggestion, not silent auto-merge in v1
- Keep `is_duplicate_of` + activity trail

---

## 7. Lead Scoring Specification

### Principles

- Deterministic rule-based scoring (`score_version = "v1"`)
- Cap at 100; floor at 0
- Always persist `score_reasons[]` as `{code, label, points, category}`
- No LLM arbitrary scoring
- Commercial intent + engagement only — **never** sensitive mentee attributes

### Category budgets

| Category | Max | Examples |
| --- | --- | --- |
| Intent | 40 | Requested strategy call (+20), requested more info (+10), actively seeking mentorship (+10), asked about enrollment (+15) — combined capped at 40 |
| Engagement | 30 | Replied to outreach (+15), booked meeting (+15), multiple meaningful engagements (+10), returned after earlier contact (+8) |
| Readiness | 20 | Wants to start soon (+15), complete contact info (+10), parent/guardian decision-maker engaged (+10) — capped 20 |
| Source quality | 10 | Existing-family referral (+8), Jake referral (+10), historically strong source (+6), trusted partner (+7) |
| Negative | −∞ to 0 | Repeated no response (−10 each, capped −25), explicit lack of interest (−30), long-term timing (−10), invalid contact info (−20), no-show unrecovered (−8) |

Exact point table lives in `src/lib/scoring/rules.ts` and is unit-tested.

### Bands

| Score | Band | Label |
| --- | --- | --- |
| 80–100 | P1 | Hot |
| 60–79 | P2 | High |
| 40–59 | P3 | Nurture |
| 0–39 | P4 | Low |

### Explainability UI

```text
Sarah Thompson — 91 · P1 Hot
+20 Requested strategy call
+15 Responded today
+15 Referral (Jake)
+15 Wants to start soon
+10 Complete contact info
+10 Strong engagement
+6  Additional intent signals
```

Recompute on: new activity, stage change, meeting status change, source attribution fix, nightly job.

---

## 8. Pipeline State Model

### Recommendation: stages + dispositions (not one flat list)

**Primary stage** = where the lead sits on the enrollment path.
**Disposition** = side operating mode / outcome qualifier.

This is cleaner than stuffing `NURTURE`, `NO_RESPONSE`, and `NOT_QUALIFIED` into the same ordered kanban as `WON`.

### Primary stages (happy / core path)

1. `NEW`
2. `ATTEMPTING_CONTACT`
3. `CONNECTED`
4. `QUALIFIED`
5. `JAKE_READY`
6. `CALL_BOOKED`
7. `CALL_HELD`
8. `ENROLLMENT_PENDING`
9. `WON`
10. `LOST`

### Dispositions (side states)

| Disposition | Meaning | Stage interaction |
| --- | --- | --- |
| `NONE` | Normal path | Any open stage |
| `NURTURE` | Timed future follow-up; still owned | Usually stays on last meaningful stage or `CONNECTED`/`QUALIFIED` with nurture flags |
| `NO_RESPONSE` | Exhausted contact attempts for now | Often with `ATTEMPTING_CONTACT`; requires nurture_until or LOST |
| `NOT_QUALIFIED` | Explicit disqualification | Typically moves to `LOST` with reason, or temporary hold before close |

**Recommendation for kanban `/pipeline`:** show primary open stages as columns; filter chips for disposition (`Nurture`, `No response`). Do not create a confusing second board unless SPM insists.

### Transition guards (selected)

- Cannot enter `JAKE_READY` without `qualification_status=qualified` and handoff fields set.
- Cannot enter `CALL_BOOKED` without meeting time / booking reference (mock ok).
- `meeting_status=no_show` forces recovery next action (`RESCHEDULE`) and integrity flag.
- `WON` / `LOST` require disposition reason; clear `next_action` only on closed.
- Active (not closed) leads require owner + next_action (enforced in UI + server guards; soft-warn in early prototype seed data to demonstrate violations).

### Alignment with HubSpot

Map SPM stages ↔ HubSpot lifecycle/deal pipelines via `mapper.ts`. Exact HubSpot stage names are an open question; architecture assumes a mapping table, not identical naming.

---

## 9. Nurture / SLA Engine

### Universal requirement

Every **active** lead has:

- owner
- stage
- last activity
- next action (`type` + `at`)

### Flag detection (`src/lib/nurture/flags.ts`)

| Flag | Rule (initial defaults — tunable) |
| --- | --- |
| `untouched` | No contact activity since create |
| `overdue_first_contact` | `NEW`/`ATTEMPTING` and now > created_at + 4 business hours (or 24h calendar for prototype) |
| `overdue_follow_up` | `next_action_at` < now |
| `no_owner` | owner null and not closed |
| `no_next_action` | next_action null and not closed |
| `stale_stage` | no stage/activity change in N days by stage (e.g. 7/14) |
| `nurture_due` | disposition/nurture_status active and nurture_until <= today |
| `promised_follow_up_missed` | note/metadata promised_at < now |
| `no_show_recovery` | meeting_status=no_show and not recovered |
| `reply_waiting` | inbound reply without outbound since |
| `integration_failure` | sync_status=failed |
| `unmatched_submission` | source integrity |

### Daily working queue (`/nurture` + dashboard Attention)

Sorted by:

1. P1 + reply waiting / call now
2. No-show recovery
3. Overdue first contact
4. Overdue follow-ups
5. Nurture due today
6. No owner / no next action
7. Lower priority stale

Example rows:

- Sarah Thompson · Hot · Replied 18m ago · **Call now**
- Michael Reynolds · No-show yesterday · **Reschedule**
- Amanda Chen · Asked to reconnect this week · **Follow-up today**

### Enforcement style

- Prototype: highly visible warnings + filtered queues; allow intentional bad seed rows so the product can demonstrate breakage.
- Later: hard blocks on stage advance when guarantees fail.

---

## 10. UI / Navigation

### Auth

- `/login` — Supabase email/password (or magic link); demo users seeded
- Middleware protects all `(app)` routes
- Unauthenticated → `/login`

### App routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Sales control tower — attention + health + at-risk |
| `/sources` | Source integrity & conversion economics |
| `/leads` | Searchable lead index with risk/score filters |
| `/leads/[id]` | Detail: score why, timeline, actions, sync |
| `/pipeline` | Stage board / list with disposition filters |
| `/nurture` | Today’s working queue + SLA flags |
| `/analytics` | Funnel + rates by source/owner/time |
| `/integrations` | HubSpot mode, sync health, failures |
| `/settings` | Profile, prototype disclosure, scoring version notes |

### Global search / command palette — **yes, include**

A command interface materially helps mobile + power users:

- Jump to lead by name/email/phone
- Jump to source
- “Show overdue follow-ups”
- “Show unmatched Meta submissions”
- “Show Jake-ready”

Recommend `⌘K` / `Ctrl+K` desktop + search icon in mobile top bar.

### Shell UX

- Desktop: left nav with product wordmark **SPM Pipeline**, subtle subtitle “Pipeline Control”
- Tablet: collapsible nav
- Mobile: bottom primary tabs (Attention / Leads / Nurture / More) + large action buttons on lead detail
- Avoid KPI-card soup; prefer priority lists and actionable rows

---

## 11. Dashboard

### Role: control tower, not vanity KPI page

#### Pipeline Health (top summary)

- Pipeline Health % (composite of integrity + SLA adherence — formula documented in code)
- New leads today
- Hot leads (P1)
- Needs reply
- Jake-ready
- Calls booked
- Nurture due today

Each metric is a drill-through link to a filtered lead list.

#### At Risk

- Uncontacted leads
- Overdue first contact
- No owner
- No source
- No next action
- Stale pipeline records
- Overdue follow-ups
- No-show recovery
- Integration failures
- Unmatched source submissions

#### Hero region: **What needs attention right now?**

A ranked operational queue (not charts). This is the most important visual area.

Secondary: small integrity strip (“2 unmatched · 1 sync failed”) linking to Sources / Integrations.

---

## 12. Brand Plan

Research performed against the **current** public site `https://superpowermentors.com` (release meta `spm:release` dated 2026-08-12), plus `/llms.txt`, `/mentors`, `/legal/privacy`, CSS/JS bundles, and public assets. Distinguishing **confirmed** vs **approximate**.

### Confirmed brand tokens (from live CSS/JS/assets)

| Token | Value | Source |
| --- | --- | --- |
| Product/org name | Superpower Mentors | site / JSON-LD |
| Tagline | “Because being understood changes everything.” | JS site copy |
| CSS `--spm-blue-primary` | `#1c48e6` | `:root` in production CSS |
| CSS `--spm-blue-secondary` | `#2f6fc4` | `:root` |
| CSS `--spm-text-muted` | `#4b5875` (also a dark-theme override `#24315a` exists) | `:root` |
| Deep navy text | `#07164A` | heavily used in JS classNames |
| Warm cream surface accent | `#faf6ee` | JS/CSS usage |
| Gold accent | `#e8bd36` (hover/highlight variants e.g. `#f0d06a`) | JS/CSS |
| Soft sky CTA top | `#4f9dff` | primary button gradient start |
| Radius base | `--radius: 1.25rem` | `:root` |
| Font stack | `Inter, "Avenir Next", ui-sans-serif, system-ui, ...` | CSS `--default-font-family` / JS |
| Primary CTA shape | `rounded-full`, height ~`h-14`, gradient `from-[#4f9dff] to-[#1c48e6]` | JS |
| Secondary CTA | text link navy → secondary blue on hover | JS |
| Nav aesthetic | “liquid glass” rounded-full bar, soft blur, navy type | JS classes |
| Card / panel radii | ~`1.75rem`–`2rem` soft panels, subtle navy-tint shadows | JS |
| Logo banner (public) | `/assets/logo_banner_blue-2ntnM3I7.svg` — wordmark `#07164A` + mark `#2563eb` | live asset |
| Favicon mark | `/favicon.svg` — abstract S/mark in `#2563eb` | live asset |
| Illustration / photo style | Real mentor photography; warm/neutral frames (`#e8e1d7`); human, not cartoon | site |
| Tone of voice | Warm, confident, plain-language, high-trust; “strategy call”, strengths-based; clearly not clinical therapy | copy across pages |
| Headline style | Large semibold Inter, tight tracking (`-0.03em` to `-0.04em`), occasional italic emphasis / secondary-blue span words | JS |

### Approximations / caveats

- OKLCH design tokens in `:root` (`--brand`, `--surface`, etc.) appear framework-level; **prefer explicit SPM hex CSS variables above** for the internal app unless design QA says otherwise.
- Logo mark fill `#2563eb` ≠ primary CTA `#1c48e6` — both appear on the live site; document both; do not “fix” without brand owner input.
- Dark-theme alternate SPM blues exist in CSS; marketing site is predominantly **light, airy, blue-navy-gold**.
- Full authorized brand package (usage rights for internal apps, clear-space, locked wordmark) not obtained — **use public SVG assets for prototype with attribution in brand-audit; request authorized package before production.**

### Application feel targets

Human, optimistic, polished, warm, modern, high-trust, operationally serious.

### Avoid

Neon AI gradients, excessive glassmorphism (marketing uses light glass — keep **much more restrained** in the ops app), purple-on-black AI tropes, childish illustration, clinical healthcare chrome, Salesforce clutter.

### Implementation artifacts (after approval)

- `docs/brand-audit.md` — full confirmed vs approximate ledger + asset URLs
- `src/lib/brand-tokens.ts` — typed tokens for Tailwind theme mapping
- App chrome: SPM wordmark + “SPM Pipeline” product name; not a new startup brand

### Typography note for internal product

Public site uses Inter. User frontend rules caution against default Inter for greenfield marketing sites; **here we intentionally follow SPM’s live brand stack** for coherence with Superpower Mentors. If brand owner later supplies a different licensed font, swap in tokens.

---

## 13. Demo Data Strategy

### Rules

- Fictional only; never claim real SPM customers
- No permanent loud DEMO banner
- Subtle Settings disclosure / tooltip:
  **“Prototype environment — customer records shown here are sample data.”**
- Realistic names, imperfect timestamps, messy ops problems baked in

### Seed population goals (~80–120 leads)

Must include scenarios:

- Missing attribution / no source
- Overdue follow-up
- No owner
- No next action
- Duplicate suspect
- HubSpot sync failure
- Unmatched source submission (the “41 vs 40” story)
- No-show recovery
- Stale nurture
- Hot new lead (P1)
- Referral (family + Jake)
- Jake-ready
- Won enrollment
- Lost with reason
- Reply waiting
- Incomplete phone/email (negative score)

### Metric realism (targets for seed aggregates)

Example shape (not hard-coded UI strings forever):

| Metric | Example |
| --- | --- |
| Capture rate | 96.7% |
| Contact rate | 72.4% |
| Qualification rate | 38.9% |
| Booking rate | 31.2% |
| Show rate | 82.6% |

Source performance must differ: e.g. Jake referral high qualification; Meta high volume / lower qualify; one source with integrity gap.

### Demo auth

Seed 2–3 fake users (`sales@example.spm-pipeline.local` style) via Supabase local/demo — **not** real SPM emails.

---

## 14. Security / Privacy

### Boundaries

- Sales pipeline for **parent/guardian / decision-maker** contact and commercial intent
- **Do not store:** diagnoses, mental-health history, medication, race, ethnicity, detailed behavioral health, clinical records, sensitive child history
- Mentee first name optional only if needed for sales context (“parent of Ava”) — avoid child PII sprawl; prefer no child DOB/school records in this app
- HubSpot raw payloads: minimize; strip unknown sensitive properties in mapper
- Secrets only in server env: Supabase service key, future HubSpot token
- RLS + protected routes + no anon access to leads
- Audit activity for stage/owner/score changes
- Prototype disclosure so sample data is not mistaken for production PHI/PII of real families

### Compliance posture

This app is not the mentoring clinical platform. Align with SPM privacy principles by **data minimization**. Legal review before live HubSpot sync of any field set.

---

## 15. Implementation Phases

### Phase 1 — Foundation / auth / schema / brand

- Next.js + Tailwind + shadcn scaffold
- Supabase Auth + `/login` + middleware
- Drizzle/SQL schema + migrations
- `docs/brand-audit.md` + `brand-tokens.ts` + app shell
- Empty route pages wired in nav
- `.env.example` with `HUBSPOT_MODE=mock`

### Phase 2 — Leads / sources / integrity

- Seed sources + submissions + leads
- `/leads`, `/leads/[id]` (core fields + timeline)
- `/sources` with unmatched/missing reconciliation UI
- Integrity flags: no source, unmatched, sync failed

### Phase 3 — Scoring / pipeline

- Scoring engine v1 + Why this score?
- `/pipeline` board/list + transitions
- Stage/disposition model + guards (soft)

### Phase 4 — Nurture / control tower

- SLA flags + `/nurture` daily queue
- `/dashboard` attention-first control tower
- Next-action enforcement UX
- Command palette

### Phase 5 — Analytics / integrations mock

- `/analytics` funnel + rates
- `/integrations` mock HubSpot health
- Sync failure surfaces + adapter completeness
- Settings prototype disclosure

### Phase 6 — Mobile polish / testing

- Mobile nav, action sheets, large touch targets
- Playwright responsive suites
- Unit tests for scoring/reconcile/guards
- Production `next build` validation
- README for local demo

Phases 2–4 can overlap slightly after schema stabilizes; sequence above matches risk (integrity before vanity analytics).

---

## 16. Testing Strategy

| Layer | Focus |
| --- | --- |
| Unit | Scoring rules, band assignment, SLA flags, stage guards, reconciliation math (41 vs 40), mappers |
| Integration | Supabase queries, seed invariants, HubSpot mock sync success/fail |
| Route protection | Unauthenticated redirects; authenticated access matrix |
| Data integrity | Active lead invariants (detect violations); unique submission ids; duplicate suspects |
| Scoring tests | Golden fixtures with expected reason arrays |
| Source reconciliation | Per-source accounted/synced/unmatched/failed |
| Responsive | Playwright mobile/tablet/desktop for dashboard, nurture, lead detail actions |
| Build | `tsc --noEmit`, lint, `next build` |

CI recommendation: GitHub Actions on PR — unit + typecheck + build; nightly/e2e optional.

---

## 17. Risks / Open Questions

Must learn from SPM before any **live** integration:

1. Exact production lead sources and volumes
2. Current HubSpot portal schema (contact properties, pipelines, deal stages)
3. Existing lifecycle stages vs desired SPM stages
4. HubSpot subscription/tier (webhooks, custom objects, API limits)
5. Any existing HubSpot score / workflows to complement not fight
6. Communication stack (SMS/email/dialer) for future outreach
7. Meeting/calendar setup (HubSpot Meetings vs other) — public site currently references HubSpot Meetings for strategy calls
8. How Jake receives qualified / Jake-ready leads today (Slack? HubSpot task? email?)
9. Official qualification definition
10. Current nurture cadences and owners
11. Attribution model (UTM standards, ad platform → CRM)
12. User roles / who uses mobile in the field
13. Whether “Find the Right Mentor”, waitlist, assessments, and ads all land in the same HubSpot object
14. Authorized logo/brand package for internal software distribution
15. Data retention expectations for sales notes

**Risk:** Building hard-coupled stage names before HubSpot mapping is known.
**Mitigation:** mapping table + adapter; UI uses SPM canonical stages.

**Risk:** Accidental clinical data leakage via HubSpot property sync.
**Mitigation:** allowlist mapper; privacy review.

**Risk:** Prototype mistaken for live CRM.
**Mitigation:** mock mode + Settings disclosure + fictional seed.

---

## 18. Recommended MVP (Presentation-Ready Prototype)

### Include

- Auth login + protected shell branded as SPM Pipeline
- Dashboard control tower with Attention queue + At Risk + Health metrics (all drillable)
- Sources integrity view with at least one dramatic unmatched gap
- Leads list + rich lead detail (score why + timeline + sync status)
- Pipeline board with canonical stages + disposition filters
- Nurture / today queue with SLA flags
- Deterministic scoring v1
- HubSpot integration page in **mock** mode with visible failures
- Analytics funnel with imperfect realistic rates
- Realistic messy demo data
- Solid mobile nurture/lead action UX
- Command palette (lightweight)
- Mocked/disabled Call · Email · Text · Book · Note · Schedule follow-up affordances
- Subtle prototype sample-data disclosure in Settings

### Deliberately wait

- Live HubSpot OAuth/private app and writes
- Live SMS/email/dialer
- Automated outbound nurture sequences
- Advanced role admin UI
- Auto-merge duplicates
- AI scoring / AI email drafts
- Full webhook infrastructure hardening
- Real SPM credentials or real customer imports
- Multi-workspace / agency SaaS features

---

## Central Product Thesis (unchanged)

**We are not rebuilding HubSpot. We are making it impossible for Superpower Mentors to lose visibility into a lead between acquisition and close.**

Every active lead has a source, owner, stage, score, last activity, and next action — or the system loudly says what is broken.

---

## Approval checkpoint

No application scaffolding, dependencies, or feature implementation will begin until this plan is approved (with any requested edits to stack, stage model, scoring weights, or phase order).
