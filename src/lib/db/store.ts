import { getDemoDataset, type DemoDataset } from "@/lib/demo/seed";
import { isDemoMode } from "@/lib/env";
import type {
  Activity,
  AppUser,
  IntegrationSyncEvent,
  Lead,
  LeadScoreFactor,
  LeadScoreSnapshot,
  LeadSourceEvent,
  SourceDefinition,
} from "@/types/domain";

export interface DataStore {
  getUsers(): AppUser[];
  getUser(id: string): AppUser | undefined;
  getSources(): SourceDefinition[];
  getSource(id: string): SourceDefinition | undefined;
  getLeads(): Lead[];
  getLead(id: string): Lead | undefined;
  getSourceEvents(): LeadSourceEvent[];
  getSourceEvent(id: string): LeadSourceEvent | undefined;
  getScoreFactors(leadId: string): LeadScoreFactor[];
  getScoreSnapshots(leadId: string): LeadScoreSnapshot[];
  getActivities(leadId?: string): Activity[];
  getSyncEvents(): IntegrationSyncEvent[];
  getDataset(): DemoDataset;
}

function createDemoStore(): DataStore {
  const ds = () => getDemoDataset();
  return {
    getUsers: () => ds().users,
    getUser: (id) => ds().users.find((u) => u.id === id),
    getSources: () => ds().sources,
    getSource: (id) => ds().sources.find((s) => s.id === id),
    getLeads: () => ds().leads,
    getLead: (id) => ds().leads.find((l) => l.id === id),
    getSourceEvents: () => ds().sourceEvents,
    getSourceEvent: (id) => ds().sourceEvents.find((e) => e.id === id),
    getScoreFactors: (leadId) =>
      ds().scoreFactors.filter((f) => f.lead_id === leadId),
    getScoreSnapshots: (leadId) =>
      ds().scoreSnapshots.filter((s) => s.lead_id === leadId),
    getActivities: (leadId) =>
      leadId
        ? ds().activities.filter((a) => a.lead_id === leadId)
        : ds().activities,
    getSyncEvents: () => ds().syncEvents,
    getDataset: () => ds(),
  };
}

/**
 * Data access entry point.
 * Demo mode uses the in-memory seeded store.
 * Auth mode will later query Supabase using the same interface.
 */
export function getStore(): DataStore {
  if (!isDemoMode()) {
    // Prototype still serves seeded data until live Supabase wiring is approved.
    // Auth mode only changes authentication — not HubSpot live mode.
    return createDemoStore();
  }
  return createDemoStore();
}
