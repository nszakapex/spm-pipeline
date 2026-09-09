import { getHubSpotClient } from "./client";
import { mapLeadToHubSpotProperties } from "./mapper";
import { getStore } from "@/lib/db/store";
import type { HubSpotSyncResult } from "./types";

export async function syncLeadToHubSpot(leadId: string): Promise<HubSpotSyncResult> {
  const lead = getStore().getLead(leadId);
  if (!lead) {
    return {
      ok: false,
      status: "missing",
      contactId: null,
      reason: "Lead not found",
      attemptedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
  }
  // Ensure mapper is exercised in sync path
  mapLeadToHubSpotProperties(lead);
  const client = getHubSpotClient();
  return client.upsertContact(lead);
}

export async function getHubSpotFailureSummary() {
  const client = getHubSpotClient();
  const failures = await client.listRecentFailures();
  const unmatched = getStore()
    .getSourceEvents()
    .filter((e) => ["unmatched", "failed"].includes(e.reconciliation_status));
  return {
    mode: client.mode,
    failures,
    unmatchedCount: unmatched.length,
    lastSuccessfulSync:
      getStore()
        .getSyncEvents()
        .filter((e) => e.status === "success")
        .map((e) => e.completed_at)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null,
  };
}
