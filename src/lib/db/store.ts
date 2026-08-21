import { getDemoDataset, resetDemoDatasetCache, type DemoDataset } from "@/lib/demo/seed";
import {
  findOverlayReceipt,
  getStoreOverlay,
  overlayHasEvent,
  rememberOverlayEvent,
  resetStoreOverlay,
} from "@/lib/db/overlay";
import type {
  Activity,
  AppUser,
  IngestReceipt,
  IntegrationSyncEvent,
  Lead,
  LeadScoreFactor,
  LeadScoreSnapshot,
  LeadSourceEvent,
  SourceDefinition,
} from "@/types/domain";

export interface IngestMutation {
  idempotencyKey: string;
  receipt: IngestReceipt;
  lead?: Lead;
  activities?: Activity[];
  sourceEvent?: LeadSourceEvent;
  syncEvent?: IntegrationSyncEvent;
  scoreFactors?: LeadScoreFactor[];
  scoreSnapshot?: LeadScoreSnapshot;
}

export interface DataStore {
  getUsers(): AppUser[];
  getUser(id: string): AppUser | undefined;
  getSources(): SourceDefinition[];
  getSource(id: string): SourceDefinition | undefined;
  getLeads(): Lead[];
  getLead(id: string): Lead | undefined;
  findLeadByIdentity(input: {
    leadId?: string | null;
    email?: string | null;
    phone?: string | null;
    hubspotContactId?: string | null;
  }): Lead | undefined;
  getSourceEvents(): LeadSourceEvent[];
  getSourceEvent(id: string): LeadSourceEvent | undefined;
  getScoreFactors(leadId: string): LeadScoreFactor[];
  getScoreSnapshots(leadId: string): LeadScoreSnapshot[];
  getActivities(leadId?: string): Activity[];
  getSyncEvents(): IntegrationSyncEvent[];
  getIngestReceipts(): IngestReceipt[];
  getDataset(): DemoDataset;
  applyIngestMutation(mutation: IngestMutation): IngestReceipt;
}

function normalizeEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

function mergeLeads(seed: Lead[], overlayLeads: Lead[], patches: Map<string, Lead>): Lead[] {
  const extras = overlayLeads.filter((l) => !seed.some((s) => s.id === l.id));
  return [...seed.map((l) => patches.get(l.id) ?? l), ...extras];
}

function createDemoStore(): DataStore {
  const ds = () => getDemoDataset();
  const overlay = () => getStoreOverlay();

  const getLeads = () => {
    const o = overlay();
    return mergeLeads(ds().leads, o.extraLeads, o.leadPatches);
  };

  const getLead = (id: string) => getLeads().find((l) => l.id === id);

  return {
    getUsers: () => ds().users,
    getUser: (id) => ds().users.find((u) => u.id === id),
    getSources: () => ds().sources,
    getSource: (id) => ds().sources.find((s) => s.id === id),
    getLeads,
    getLead,
    findLeadByIdentity: (input) => {
      const leads = getLeads();
      if (input.leadId) {
        const byId = leads.find((l) => l.id === input.leadId);
        if (byId) return byId;
      }
      if (input.hubspotContactId) {
        const byHs = leads.find((l) => l.hubspot_contact_id === input.hubspotContactId);
        if (byHs) return byHs;
      }
      const email = normalizeEmail(input.email);
      if (email) {
        const byEmail = leads.find((l) => normalizeEmail(l.email) === email);
        if (byEmail) return byEmail;
      }
      const phone = normalizePhone(input.phone);
      if (phone) {
        const byPhone = leads.find((l) => normalizePhone(l.phone) === phone);
        if (byPhone) return byPhone;
      }
      return undefined;
    },
    getSourceEvents: () => [...ds().sourceEvents, ...overlay().extraSourceEvents],
    getSourceEvent: (id) =>
      ds().sourceEvents.find((e) => e.id === id) ??
      overlay().extraSourceEvents.find((e) => e.id === id),
    getScoreFactors: (leadId) => {
      const replaced = overlay().scoreFactorsByLead.get(leadId);
      if (replaced) return replaced;
      return ds().scoreFactors.filter((f) => f.lead_id === leadId);
    },
    getScoreSnapshots: (leadId) => [
      ...ds().scoreSnapshots.filter((s) => s.lead_id === leadId),
      ...overlay().extraScoreSnapshots.filter((s) => s.lead_id === leadId),
    ],
    getActivities: (leadId) => {
      const all = [...ds().activities, ...overlay().extraActivities];
      return leadId ? all.filter((a) => a.lead_id === leadId) : all;
    },
    getSyncEvents: () => [...ds().syncEvents, ...overlay().extraSyncEvents],
    getIngestReceipts: () => [...overlay().ingestReceipts],
    getDataset: () => ds(),
    applyIngestMutation: (mutation) => {
      if (overlayHasEvent(mutation.idempotencyKey)) {
        const existing = findOverlayReceipt(mutation.idempotencyKey);
        if (existing) return { ...existing, status: "duplicate" };
      }
      rememberOverlayEvent(mutation.idempotencyKey);
      const o = overlay();
      o.ingestReceipts.unshift(mutation.receipt);
      if (mutation.lead) {
        const seedHas = ds().leads.some((l) => l.id === mutation.lead!.id);
        const extraIdx = o.extraLeads.findIndex((l) => l.id === mutation.lead!.id);
        if (seedHas) {
          o.leadPatches.set(mutation.lead.id, mutation.lead);
        } else if (extraIdx >= 0) {
          o.extraLeads[extraIdx] = mutation.lead;
        } else {
          o.extraLeads.push(mutation.lead);
        }
      }
      if (mutation.activities?.length) o.extraActivities.push(...mutation.activities);
      if (mutation.sourceEvent) o.extraSourceEvents.push(mutation.sourceEvent);
      if (mutation.syncEvent) o.extraSyncEvents.push(mutation.syncEvent);
      if (mutation.scoreFactors && mutation.lead) {
        o.scoreFactorsByLead.set(mutation.lead.id, mutation.scoreFactors);
      }
      if (mutation.scoreSnapshot) o.extraScoreSnapshots.push(mutation.scoreSnapshot);
      return mutation.receipt;
    },
  };
}

/**
 * Data access entry point.
 * Seeded dataset plus a process-local overlay for signed webhook ingest.
 * Does not contact Supabase or any external database.
 */
export function getStore(): DataStore {
  return createDemoStore();
}

/** Clears seed cache and webhook overlay — tests and ingest isolation. */
export function resetRuntimeStore(): void {
  resetDemoDatasetCache();
  resetStoreOverlay();
}
