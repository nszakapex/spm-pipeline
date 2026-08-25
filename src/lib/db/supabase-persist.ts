import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePersistConfig } from "@/lib/env";
import {
  getStoreOverlay,
  overlayToSnapshot,
  replaceStoreOverlay,
  snapshotToOverlay,
  type OverlaySnapshot,
} from "@/lib/db/overlay";
import type {
  Activity,
  IngestReceipt,
  IntegrationSyncEvent,
  Lead,
  LeadScoreFactor,
  LeadScoreSnapshot,
  LeadSourceEvent,
} from "@/types/domain";

type PersistClient = SupabaseClient;

export interface PersistLeadStateRow {
  id: string;
  kind: "patch" | "extra";
  body: Lead;
}

export interface PersistActivityRow {
  id: string;
  lead_id: string;
  body: Activity;
}

export interface PersistJsonRow {
  id: string;
  body: LeadSourceEvent | IntegrationSyncEvent | IngestReceipt | LeadScoreSnapshot;
}

export interface PersistScoreFactorRow {
  lead_id: string;
  body: LeadScoreFactor[];
}

export interface PersistScoreSnapshotRow {
  id: string;
  lead_id: string;
  body: LeadScoreSnapshot;
}

export interface PersistReceiptRow {
  id: string;
  idempotency_key: string;
  body: IngestReceipt;
}

export interface PersistSeenRow {
  idempotency_key: string;
}

export interface PersistRows {
  leadState: PersistLeadStateRow[];
  activities: PersistActivityRow[];
  sourceEvents: PersistJsonRow[];
  syncEvents: PersistJsonRow[];
  scoreFactors: PersistScoreFactorRow[];
  scoreSnapshots: PersistScoreSnapshotRow[];
  receipts: PersistReceiptRow[];
  seenEvents: PersistSeenRow[];
}

function receiptIdempotencyKey(receipt: IngestReceipt): string {
  return `${receipt.channel}:${receipt.external_event_id}`;
}

export function persistRowsFromSnapshot(snapshot: OverlaySnapshot): PersistRows {
  return {
    leadState: [
      ...snapshot.leadPatches.map((lead) => ({
        id: lead.id,
        kind: "patch" as const,
        body: lead,
      })),
      ...snapshot.extraLeads.map((lead) => ({
        id: lead.id,
        kind: "extra" as const,
        body: lead,
      })),
    ],
    activities: snapshot.extraActivities.map((activity) => ({
      id: activity.id,
      lead_id: activity.lead_id,
      body: activity,
    })),
    sourceEvents: snapshot.extraSourceEvents.map((event) => ({
      id: event.id,
      body: event,
    })),
    syncEvents: snapshot.extraSyncEvents.map((event) => ({
      id: event.id,
      body: event,
    })),
    scoreFactors: snapshot.scoreFactors.map((row) => ({
      lead_id: row.leadId,
      body: row.factors,
    })),
    scoreSnapshots: snapshot.extraScoreSnapshots.map((snapshotRow) => ({
      id: snapshotRow.id,
      lead_id: snapshotRow.lead_id,
      body: snapshotRow,
    })),
    receipts: snapshot.ingestReceipts.map((receipt) => ({
      id: receipt.id,
      idempotency_key: receiptIdempotencyKey(receipt),
      body: receipt,
    })),
    seenEvents: snapshot.seenExternalIds.map((idempotency_key) => ({
      idempotency_key,
    })),
  };
}

export function snapshotFromPersistRows(rows: PersistRows): OverlaySnapshot {
  return {
    leadPatches: rows.leadState.filter((row) => row.kind === "patch").map((row) => row.body),
    extraLeads: rows.leadState.filter((row) => row.kind === "extra").map((row) => row.body),
    extraActivities: rows.activities.map((row) => row.body),
    extraSourceEvents: rows.sourceEvents.map((row) => row.body as LeadSourceEvent),
    extraSyncEvents: rows.syncEvents.map((row) => row.body as IntegrationSyncEvent),
    scoreFactors: rows.scoreFactors.map((row) => ({
      leadId: row.lead_id,
      factors: row.body,
    })),
    extraScoreSnapshots: rows.scoreSnapshots.map((row) => row.body),
    ingestReceipts: rows.receipts.map((row) => row.body),
    seenExternalIds: [
      ...new Set([
        ...rows.seenEvents.map((row) => row.idempotency_key),
        ...rows.receipts.map((row) => row.idempotency_key),
      ]),
    ],
  };
}

function throwPersistError(action: string, error: { message?: string } | null): void {
  if (!error) return;
  throw new Error(`Pipeline persist ${action} failed`);
}

function getPersistClient(): PersistClient | null {
  const config = getSupabasePersistConfig();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export { isSupabasePersistConfigured } from "@/lib/env";

export async function hydrateStoreFromSupabase(): Promise<boolean> {
  const client = getPersistClient();
  if (!client) return false;

  const [
    leadState,
    activities,
    sourceEvents,
    syncEvents,
    scoreFactors,
    scoreSnapshots,
    receipts,
    seenEvents,
  ] = await Promise.all([
    client.from("pipeline_lead_state").select("id, kind, body"),
    client.from("pipeline_activities").select("id, lead_id, body"),
    client.from("pipeline_source_events").select("id, body"),
    client.from("pipeline_sync_events").select("id, body"),
    client.from("pipeline_score_factors").select("lead_id, body"),
    client.from("pipeline_score_snapshots").select("id, lead_id, body"),
    client.from("pipeline_ingest_receipts").select("id, idempotency_key, body"),
    client.from("pipeline_seen_events").select("idempotency_key"),
  ]);

  for (const result of [
    leadState,
    activities,
    sourceEvents,
    syncEvents,
    scoreFactors,
    scoreSnapshots,
    receipts,
    seenEvents,
  ]) {
    throwPersistError("hydrate", result.error);
  }

  const snapshot = snapshotFromPersistRows({
    leadState: (leadState.data ?? []) as PersistLeadStateRow[],
    activities: (activities.data ?? []) as PersistActivityRow[],
    sourceEvents: (sourceEvents.data ?? []) as PersistJsonRow[],
    syncEvents: (syncEvents.data ?? []) as PersistJsonRow[],
    scoreFactors: (scoreFactors.data ?? []) as PersistScoreFactorRow[],
    scoreSnapshots: (scoreSnapshots.data ?? []) as PersistScoreSnapshotRow[],
    receipts: (receipts.data ?? []) as PersistReceiptRow[],
    seenEvents: (seenEvents.data ?? []) as PersistSeenRow[],
  });

  replaceStoreOverlay(snapshotToOverlay(snapshot));
  return true;
}

async function upsertRows(
  client: PersistClient,
  table: string,
  rows: object[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await client.from(table).upsert(rows);
  throwPersistError(`upsert ${table}`, error);
}

export async function persistStoreOverlay(): Promise<void> {
  const client = getPersistClient();
  if (!client) return;

  const rows = persistRowsFromSnapshot(overlayToSnapshot(getStoreOverlay()));
  await Promise.all([
    upsertRows(client, "pipeline_lead_state", rows.leadState),
    upsertRows(client, "pipeline_activities", rows.activities),
    upsertRows(client, "pipeline_source_events", rows.sourceEvents),
    upsertRows(client, "pipeline_sync_events", rows.syncEvents),
    upsertRows(client, "pipeline_score_factors", rows.scoreFactors),
    upsertRows(client, "pipeline_score_snapshots", rows.scoreSnapshots),
    upsertRows(client, "pipeline_ingest_receipts", rows.receipts),
    upsertRows(client, "pipeline_seen_events", rows.seenEvents),
  ]);
}
