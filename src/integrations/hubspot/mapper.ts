import type { Lead, LeadStage } from "@/types/domain";
import type { HubSpotContact } from "./types";

const STAGE_TO_HS: Partial<Record<LeadStage, string>> = {
  NEW: "lead",
  ATTEMPTING_CONTACT: "lead",
  CONNECTED: "marketingqualifiedlead",
  QUALIFIED: "salesqualifiedlead",
  JAKE_READY: "salesqualifiedlead",
  CALL_BOOKED: "opportunity",
  CALL_HELD: "opportunity",
  ENROLLMENT_PENDING: "opportunity",
  WON: "customer",
  LOST: "other",
};

export function mapLeadToHubSpotProperties(lead: Lead): Record<string, string> {
  return {
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    firstname: lead.first_name,
    lastname: lead.last_name,
    lifecyclestage: STAGE_TO_HS[lead.stage] ?? "lead",
    hs_lead_status: lead.disposition,
    spm_score: String(lead.score),
    spm_score_band: lead.score_band,
    spm_source: lead.source,
  };
}

export function mapHubSpotContactToLeadPatch(
  contact: HubSpotContact,
): Partial<Lead> {
  return {
    email: contact.email,
    phone: contact.phone,
    first_name: contact.firstname ?? "",
    last_name: contact.lastname ?? "",
    hubspot_contact_id: contact.id,
  };
}
