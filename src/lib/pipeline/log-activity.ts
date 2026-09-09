import type { CanonicalIngestEvent } from "@/integrations/webhooks/types";
import { ingestCanonicalEvents } from "@/integrations/webhooks/ingest";
import type { CallOutcome } from "@/integrations/webhooks/types";
import type { IngestReceipt } from "@/types/domain";

export type ManualActivityKind =
  | "call"
  | "inbound_reply"
  | "outbound_email"
  | "outbound_sms";

export function logManualLeadActivity(input: {
  leadId: string;
  actorId: string;
  kind: ManualActivityKind;
  outcome?: CallOutcome;
  recap?: string;
  occurredAt?: string;
}): IngestReceipt {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const recap = input.recap?.trim() || undefined;
  const externalEventId = `manual_${input.kind}_${input.leadId}_${new Date(occurredAt).getTime()}`;

  let event: CanonicalIngestEvent;
  if (input.kind === "call") {
    event = {
      channel: "calls",
      type: recap ? "call.analyzed" : "call.logged",
      externalEventId,
      occurredAt,
      identity: { leadId: input.leadId, ownerId: input.actorId },
      payloadSummary: { source: "manual", outcome: input.outcome ?? "connected" },
      call: {
        outcome: input.outcome ?? "connected",
        kind: "sales",
        recap,
      },
    };
  } else if (input.kind === "inbound_reply") {
    event = {
      channel: "messaging",
      type: "message.inbound",
      externalEventId,
      occurredAt,
      identity: { leadId: input.leadId },
      payloadSummary: { source: "manual" },
      reply: {
        channel: "sms",
        intent: "unknown",
        summary: recap ?? "Inbound reply logged by sales",
      },
    };
  } else {
    event = {
      channel: "messaging",
      type: "message.outbound",
      externalEventId,
      occurredAt,
      identity: { leadId: input.leadId, ownerId: input.actorId },
      payloadSummary: { source: "manual" },
      reply: {
        channel: input.kind === "outbound_sms" ? "sms" : "email",
        intent: "unknown",
        summary: recap ?? "Outbound message logged by sales",
      },
    };
  }

  const batch = ingestCanonicalEvents([event]);
  const receipt = batch.results[0];
  if (!receipt) {
    throw new Error("Manual activity did not produce an ingest receipt");
  }
  return receipt;
}
