import type {
  Activity,
  IngestReceipt,
  IntegrationSyncEvent,
  Lead,
  LeadScoreFactor,
  LeadScoreSnapshot,
  LeadSourceEvent,
} from "@/types/domain";

export interface StoreOverlay {
  leadPatches: Map<string, Lead>;
  extraLeads: Lead[];
  extraActivities: Activity[];
  extraSourceEvents: LeadSourceEvent[];
  extraSyncEvents: IntegrationSyncEvent[];
  scoreFactorsByLead: Map<string, LeadScoreFactor[]>;
  extraScoreSnapshots: LeadScoreSnapshot[];
  ingestReceipts: IngestReceipt[];
  seenExternalIds: Set<string>;
}

function emptyOverlay(): StoreOverlay {
  return {
    leadPatches: new Map(),
    extraLeads: [],
    extraActivities: [],
    extraSourceEvents: [],
    extraSyncEvents: [],
    scoreFactorsByLead: new Map(),
    extraScoreSnapshots: [],
    ingestReceipts: [],
    seenExternalIds: new Set(),
  };
}

let overlay: StoreOverlay = emptyOverlay();

export function getStoreOverlay(): StoreOverlay {
  return overlay;
}

export function resetStoreOverlay(): void {
  overlay = emptyOverlay();
}

export function overlayHasEvent(idempotencyKey: string): boolean {
  return overlay.seenExternalIds.has(idempotencyKey);
}

export function rememberOverlayEvent(idempotencyKey: string): void {
  overlay.seenExternalIds.add(idempotencyKey);
}

export function findOverlayReceipt(idempotencyKey: string): IngestReceipt | undefined {
  const externalId = idempotencyKey.includes(":")
    ? idempotencyKey.slice(idempotencyKey.indexOf(":") + 1)
    : idempotencyKey;
  return overlay.ingestReceipts.find(
    (r) => r.external_event_id === externalId && idempotencyKey.startsWith(`${r.channel}:`),
  );
}
