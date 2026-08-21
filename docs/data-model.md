# Data Model

## Core entities

### users
App operators (`admin` | `sales` | `viewer`).

### source_definitions
Configured acquisition channels (Meta, Jake referral, school partner, etc.).

### lead_source_events (first-class)
Every inbound acquisition event **before** reconciliation. Not the same as a CRM lead.

Reconciliation statuses: `pending` | `matched` | `created` | `duplicate` | `unmatched` | `failed` | `ignored`.

Payloads store **summaries only** — never secrets, never clinical mentee data.

### leads
Canonical operational lead (parent/guardian / decision-maker).

Includes stage, disposition, score, next action, HubSpot IDs, sync status.

### lead_score_factors / lead_score_snapshots
Explainability and score history.

### activities
Timeline events (captured, call, reply, sync_event, …).

### integration_sync_events
HubSpot sync attempts and failures.

## Stage vs disposition

**Stage** (primary path): NEW → … → WON / LOST
**Disposition** (side state): ACTIVE | NURTURE | NO_RESPONSE | NOT_QUALIFIED | NO_SHOW | INVALID_CONTACT

Example: stage `CALL_BOOKED` + disposition `NO_SHOW`.

## Privacy boundary

Do not store diagnoses, mental-health history, medication, race, ethnicity, clinical records, or sensitive child history in this application.
