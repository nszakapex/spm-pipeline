import type { Lead } from "@/types/domain";

export interface HubSpotContact {
  id: string;
  email: string | null;
  phone: string | null;
  firstname: string | null;
  lastname: string | null;
  lifecyclestage: string | null;
}

export interface HubSpotSyncResult {
  ok: boolean;
  status: "success" | "failed" | "duplicate" | "missing" | "stale" | "retry_success";
  contactId: string | null;
  reason: string;
  attemptedAt: string;
  completedAt: string | null;
}

export interface HubSpotClient {
  mode: "mock" | "live";
  getContact(id: string): Promise<HubSpotContact | null>;
  upsertContact(lead: Lead): Promise<HubSpotSyncResult>;
  listRecentFailures(): Promise<HubSpotSyncResult[]>;
}
