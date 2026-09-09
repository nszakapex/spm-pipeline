# Integrations by stage

HubSpot stays the CRM. SPM Pipeline is the operational projection. Jake’s calendar today is **HubSpot Meetings** (the public site already books strategy calls there). Sales-call updates and lead replies are first-class ingest events, not UI chrome.

Live credentials are still **not** enabled (`HUBSPOT_MODE=mock`). The routes and stage mapping are pre-wired so turning live later is a signature + subscription swap, not a redesign.

## Flow

```text
Signed webhook
  → parse to a canonical event
  → match lead (id / HubSpot contact / email / phone)
  → restage (forward-only, plus cancel/no-show)
  → append timeline activity
  → recompute deterministic score
  → set next action
  → raise flags (needs_reply, no-show recovery, …)
```

The UI never calls HubSpot, calendar, or a dialer. Pages read the store; ingest writes through `src/integrations/webhooks/*`.

## Stage contract

| Stage | HubSpot | Jake’s calendar | Sales calls | Lead replies |
| --- | --- | --- | --- | --- |
| New | Contact create, owner, form association | Site booking can jump straight to Call Booked | First-touch attempt | Inbound reply → Connected + needs reply |
| Attempting contact | Last contacted, lifecycle still lead | Unexpected site booking still allowed | Voicemail / no-answer stay here; connected → Connected | Usual path into Connected |
| Connected | MQL, notes | Eligible to send Jake’s Meetings link | Discovery recap | Thread until an outbound reply exists |
| Qualified | SQL / deal create | Intended book window | Qual recap → book or handoff | Booking intent → Jake Ready |
| Jake Ready | Handoff note, score band | **Primary: HubSpot Meetings on Jake’s calendar** | Founder brief | Confirm / reschedule asks |
| Call Booked | Meeting engagement | Booked / rescheduled / canceled / no-show | Prep; held can be logged here first | Reminders |
| Call Held | Meeting outcome completed | Completed event | Structured strategy-call analysis | Post-call questions |
| Enrollment pending | Deal stage contract / enrollment | Usually idle | Close notes | Paperwork / timing |
| Won | Closed-won, lifecycle customer | Idle | Win note | New family member = new lead |
| Lost | Closed-lost / disqualified | Cancel leftovers | Loss reason | Stop-outreach |

## Pre-registered webhook routes

Auth is **not** the demo session cookie. Each POST must send:

- `X-SPM-Webhook-Timestamp` — unix seconds
- `X-SPM-Webhook-Signature` — `sha256=` HMAC of `{timestamp}.{rawBody}`

The HMAC key is derived from `DEMO_SESSION_SECRET` (`spm-pipeline-webhook-v1`) so a stolen demo cookie cannot sign webhooks. Timestamps older than five minutes are rejected. Duplicate `externalEventId` values per channel return `duplicate`.

| Channel | Route | What to subscribe when live |
| --- | --- | --- |
| HubSpot | `POST /api/webhooks/hubspot` | `contact.creation`, `contact.propertyChange` (lifecycle, owner, lead status), `deal.propertyChange:dealstage`, `meeting.creation` / meeting outcome |
| Jake calendar | `POST /api/webhooks/calendar` | HubSpot Meetings booked / completed / no-show / canceled (or a Zapier/Make relay of the same) |
| Sales calls | `POST /api/webhooks/calls` | Dialer or recorder: `call.logged`, `call.analyzed` |
| Lead replies | `POST /api/webhooks/messaging` | Inbound/outbound email or SMS |
| Sources | `POST /api/webhooks/sources/{meta\|forms\|website\|typeform\|google_ads}` | Meta leadgen, site forms |

`GET` on those routes returns the mock catalog (no secrets). Unsigned `POST` returns 401. The Next.js proxy treats `/api/webhooks/*` as public; authorization is the signature.

### Example (mock)

```bash
ts=$(date +%s)
body='{"event":"meeting.booked","externalEventId":"demo-1","leadId":"lead_001","calendar":"jake"}'
# Sign with the derived key (see src/integrations/webhooks/signature.ts). Do not paste DEMO_SESSION_SECRET into chat.
curl -sS https://spm-pipeline.vercel.app/api/webhooks/calendar \
  -H "content-type: application/json" \
  -H "X-SPM-Webhook-Timestamp: $ts" \
  -H "X-SPM-Webhook-Signature: sha256=$sig" \
  -d "$body"
```

Successful ingest patches the in-memory overlay (lead, timeline, score, next action). On Vercel that overlay is per-instance and disappears on cold start — expected for this prototype.

## Call and reply analysis (v1)

No LLM scoring. Structured fields plus keyword classifiers:

- Replies: book / question / not interested / timing / confirm
- Calls: connected, voicemail, no-answer, held, no-show, enrollment ask, book intent
- Output: timeline recap, recommended next action, score extras (`repliedToday`, `askedAboutEnrollment`, `bookedMeeting`, …)

When a live transcription vendor exists, send `call.analyzed` with `recap` and flags. Do not dump clinical content into `recap`.

## What is still mock

- No HubSpot private app, no real Meetings writes, no Twilio/email
- No HubSpot v3 signature (`X-HubSpot-Signature-v3`) — that swap lives in `verifySpmWebhookSignature` later
- Creating HubSpot webhook subscriptions via API is catalog-only (`PRE_REGISTERED_WEBHOOKS`)
