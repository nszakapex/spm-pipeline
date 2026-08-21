# Demo Guide

## Start

```bash
npm install
cp .env.example .env.local   # APP_MODE=demo already set
npm run dev
```

Open http://localhost:3000 → sign in as Maya Chen (or another demo user).

## Story to present

1. **Marketing generates leads** — multiple sources feed `lead_source_events`.
2. **Source Integrity proves they arrived** — open **Sources**. Select Meta / Instagram. Show 41 vs 40 and the unmatched Vanessa Cole event.
3. **Pipeline Control identifies action** — **Dashboard** Needs Attention + Priority Leads.
4. **Scoring prioritizes humans** — open Sarah Thompson; walk **Why this score?**
5. **Nurture prevents “not now” from becoming lost** — **Nurture** queues (Amanda Chen reconnect).
6. **Jake-ready creates a clean handoff** — filter Jake Ready leads / pipeline column.
7. **Funnel analytics show what converts** — **Analytics** source comparison (Meta volume vs referral quality).

## Reminders

- Sample data only (subtle disclosure on Settings).
- HubSpot connector is **mock**.
- Call / Email / Text / Book actions are mocked UI affordances — no live outreach.
- Do not claim records are real SPM customers.
