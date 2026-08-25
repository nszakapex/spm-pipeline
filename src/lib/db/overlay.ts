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

export function replaceStoreOverlay(next: StoreOverlay): void {
  overlay = next;
}

export interface OverlaySnapshot {
  leadPatches: Lead[];
  extraLeads: Lead[];
  extraActivities: Activity[];
  extraSourceEvents: LeadSourceEvent[];
  extraSyncEvents: IntegrationSyncEvent[];
  scoreFactors: { leadId: string; factors: LeadScoreFactor[] }[];
  extraScoreSnapshots: LeadScoreSnapshot[];
  ingestReceipts: IngestReceipt[];
  seenExternalIds: string[];
}

export function overlayToSnapshot(source: StoreOverlay = overlay): OverlaySnapshot {
  return {
    leadPatches: [...source.leadPatches.values()],
    extraLeads: [...source.extraLeads],
    extraActivities: [...source.extraActivities],
    extraSourceEvents: [...source.extraSourceEvents],
    extraSyncEvents: [...source.extraSyncEvents],
    scoreFactors: [...source.scoreFactorsByLead.entries()].map(([leadId, factors]) => ({
      leadId,
      factors,
    })),
    extraScoreSnapshots: [...source.extraScoreSnapshots],
    ingestReceipts: [...source.ingestReceipts],
    seenExternalIds: [...source.seenExternalIds],
  };
}

export function snapshotToOverlay(snapshot: OverlaySnapshot): StoreOverlay {
  return {
    leadPatches: new Map(snapshot.leadPatches.map((lead) => [lead.id, lead])),
    extraLeads: [...snapshot.extraLeads],
    extraActivities: [...snapshot.extraActivities],
    extraSourceEvents: [...snapshot.extraSourceEvents],
    extraSyncEvents: [...snapshot.extraSyncEvents],
    scoreFactorsByLead: new Map(
      snapshot.scoreFactors.map((row) => [row.leadId, row.factors]),
    ),
    extraScoreSnapshots: [...snapshot.extraScoreSnapshots],
    ingestReceipts: [...snapshot.ingestReceipts],
    seenExternalIds: new Set(snapshot.seenExternalIds),
  };
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
