# Source Reconciliation

## Why this exists

Marketing platforms and forms produce **source events**. HubSpot holds CRM contacts. Those are not automatically the same set.

SPM Pipeline makes the gap visible:

> Meta reports 41 submissions.  
> 40 are accounted for.  
> **1 potentially missing.**

## Model

1. Write `lead_source_events` for every inbound submission (safe summary payload).
2. Normalize identity (email/phone).
3. Attempt match/create against leads + HubSpot projection.
4. Set `reconciliation_status` + reason.
5. Surface unmatched/failed on `/sources` and dashboard At Risk.

## Health rules

- `critical` if unmatched/missing or sync failures
- `warning` if capture rate &lt; 98% or duplicates present
- otherwise `healthy`

## Demo proof

Seeded Meta / Instagram includes a deliberate unmatched event (`meta_missing_41`) so the pitch can show a real integrity miss.
