import type { Lead } from "@/types/domain";
import type { HubSpotClient, HubSpotContact, HubSpotSyncResult } from "./types";
import { getStore } from "@/lib/db/store";

const failureLeadIds = new Set(["lead_005"]);

export function createMockHubSpotClient(): HubSpotClient {
  return {
    mode: "mock",
    async getContact(id: string) {
      const lead = getStore()
        .getLeads()
        .find((l) => l.hubspot_contact_id === id);
      if (!lead) return null;
      return mapLeadToContact(lead);
    },
    async upsertContact(lead: Lead) {
      const attemptedAt = new Date().toISOString();
      if (failureLeadIds.has(lead.id) || lead.sync_status === "failed") {
        return {
          ok: false,
          status: "failed",
          contactId: lead.hubspot_contact_id,
          reason: "Mock HubSpot contacts API returned 503",
          attemptedAt,
          completedAt: null,
        } satisfies HubSpotSyncResult;
      }
      if (lead.sync_status === "stale") {
        return {
          ok: true,
          status: "stale",
          contactId: lead.hubspot_contact_id,
          reason: "Remote record newer than local projection",
          attemptedAt,
          completedAt: attemptedAt,
        };
      }
      if (!lead.email && !lead.phone) {
        return {
          ok: false,
          status: "missing",
          contactId: null,
          reason: "Insufficient identity to upsert contact",
          attemptedAt,
          completedAt: attemptedAt,
        };
      }
      return {
        ok: true,
        status: "success",
        contactId: lead.hubspot_contact_id ?? `HS-C-MOCK-${lead.id}`,
        reason: "Upsert succeeded (mock)",
        attemptedAt,
        completedAt: attemptedAt,
      };
    },
    async listRecentFailures() {
      return getStore()
        .getSyncEvents()
        .filter((e) => e.status === "failed")
        .map((e) => ({
          ok: false,
          status: "failed" as const,
          contactId: e.object_id,
          reason: e.reason ?? "Unknown failure",
          attemptedAt: e.attempted_at,
          completedAt: e.completed_at,
        }));
    },
  };
}

function mapLeadToContact(lead: Lead): HubSpotContact {
  return {
    id: lead.hubspot_contact_id ?? "unknown",
    email: lead.email,
    phone: lead.phone,
    firstname: lead.first_name,
    lastname: lead.last_name,
    lifecyclestage: lead.stage.toLowerCase(),
  };
}
