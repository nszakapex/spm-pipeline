import { getStore } from "@/lib/db/store";
import { overlayHasEvent, findOverlayReceipt } from "@/lib/db/overlay";
import { applyCanonicalEvent } from "@/lib/pipeline/apply-ingest";
import { evaluateLeadRisks } from "@/lib/nurture/flags";
import type { CanonicalIngestEvent } from "@/integrations/webhooks/types";
import type { IngestReceipt, LeadSourceEvent, IntegrationSyncEvent } from "@/types/domain";

export interface IngestBatchResult {
  ok: boolean;
  httpStatus: number;
  results: IngestReceipt[];
}

function idempotencyKey(event: CanonicalIngestEvent): string {
  return `${event.channel}:${event.externalEventId}`;
}

function sourceEventFrom(
  event: CanonicalIngestEvent,
  leadId: string | null,
  status: LeadSourceEvent["reconciliation_status"],
): LeadSourceEvent {
  const now = new Date().toISOString();
  return {
    id: `evt_ing_${event.externalEventId}`,
    source_type: event.source?.category ?? "other_campaign",
    source_name: event.source?.name ?? event.channel,
    source_detail: event.source?.campaign ?? null,
    source_definition_id: null,
    external_event_id: event.externalEventId,
    campaign: event.source?.campaign ?? null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    received_at: event.occurredAt,
    raw_payload_summary_json: event.payloadSummary,
    normalized_identity_json: {
      email: event.identity.email ?? null,
      phone: event.identity.phone ?? null,
      first_name: event.identity.firstName ?? null,
      last_name: event.identity.lastName ?? null,
    },
    processing_status: status === "unmatched" ? "error" : "processed",
    matched_lead_id: leadId,
    hubspot_contact_id: event.identity.hubspotContactId ?? null,
    hubspot_lead_id: null,
    reconciliation_status: status,
    reconciliation_reason:
      status === "unmatched" ? "Webhook identity did not match an existing lead" : null,
    last_reconciliation_at: now,
    created_at: now,
    updated_at: now,
  };
}

function syncEventFrom(
  event: CanonicalIngestEvent,
  leadId: string | null,
  ok: boolean,
): IntegrationSyncEvent {
  const now = new Date().toISOString();
  return {
    id: `sync_ing_${event.externalEventId}`,
    provider: event.channel,
    object_type: event.hubspot?.objectType ?? event.type.split(".")[0] ?? "event",
    object_id: event.hubspot?.objectId ?? event.identity.hubspotContactId ?? null,
    direction: "inbound",
    status: ok ? "success" : "failed",
    reason: ok ? "Webhook ingest applied (mock)" : "Unmatched webhook identity",
    attempted_at: now,
    completed_at: now,
    lead_id: leadId,
    source_event_id: null,
  };
}

export function ingestCanonicalEvents(events: CanonicalIngestEvent[]): IngestBatchResult {
  if (events.length === 0) {
    return {
      ok: false,
      httpStatus: 400,
      results: [],
    };
  }

  const store = getStore();
  const results: IngestReceipt[] = [];

  for (const event of events) {
    const key = idempotencyKey(event);
    if (overlayHasEvent(key)) {
      const existing = findOverlayReceipt(key);
      results.push(
        existing
          ? { ...existing, status: "duplicate" }
          : {
              id: `dup_${event.externalEventId}`,
              channel: event.channel,
              event_type: event.type,
              external_event_id: event.externalEventId,
              status: "duplicate",
              lead_id: null,
              stage_before: null,
              stage_after: null,
              flags_raised: [],
              summary: "Duplicate webhook event",
              received_at: new Date().toISOString(),
            },
      );
      continue;
    }

    const lead = store.findLeadByIdentity(event.identity);
    const applied = applyCanonicalEvent(lead, event);
    const flags =
      applied.lead
        ? evaluateLeadRisks(
            applied.lead,
            [...store.getActivities(applied.lead.id), ...applied.activities],
          ).map((f) => f.code)
        : applied.receipt.flags_raised;
    applied.receipt.flags_raised = flags;

    const unmatched = applied.receipt.status === "unmatched";
    store.applyIngestMutation({
      idempotencyKey: key,
      receipt: applied.receipt,
      lead: applied.lead,
      activities: applied.activities,
      sourceEvent:
        event.channel === "sources" || unmatched || applied.createdLead
          ? sourceEventFrom(
              event,
              applied.lead?.id ?? null,
              unmatched ? "unmatched" : applied.createdLead ? "created" : "matched",
            )
          : undefined,
      syncEvent: syncEventFrom(event, applied.lead?.id ?? null, !unmatched),
      scoreFactors: applied.scoreFactors,
      scoreSnapshot: applied.scoreSnapshot,
    });
    results.push(applied.receipt);
  }

  const allDup = results.every((r) => r.status === "duplicate");
  const anyApplied = results.some((r) => r.status === "applied");
  return {
    ok: anyApplied || allDup,
    httpStatus: anyApplied || allDup ? 200 : 422,
    results,
  };
}
