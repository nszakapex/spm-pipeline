import type { CanonicalIngestEventType, IngestChannel, LeadStage } from "@/types/domain";
import { OPEN_STAGES } from "@/types/domain";

export interface StageIntegrationRow {
  stage: LeadStage;
  hubspot: string;
  jakeCalendar: string;
  salesCalls: string;
  leadResponses: string;
}

/**
 * What each pipeline stage consumes from HubSpot, Jake's calendar
 * (HubSpot Meetings today), sales-call updates, and inbound replies.
 * Live credentials are still mock-only; this table is the wiring contract.
 */
export const STAGE_INTEGRATIONS: StageIntegrationRow[] = [
  {
    stage: "NEW",
    hubspot: "Contact create, owner, form/source association, first sync",
    jakeCalendar: "If the family already booked Jake from the site, jump to Call Booked",
    salesCalls: "First-touch attempt (connected / voicemail / no-answer)",
    leadResponses: "Inbound email/SMS → needs reply; may move to Connected",
  },
  {
    stage: "ATTEMPTING_CONTACT",
    hubspot: "Last-contacted, owner, lifecycle still lead",
    jakeCalendar: "Unexpected site booking still allowed",
    salesCalls: "Attempt log + short recap; connected conversation → Connected",
    leadResponses: "Reply is the usual path into Connected",
  },
  {
    stage: "CONNECTED",
    hubspot: "Lifecycle MQL, notes, owner",
    jakeCalendar: "Eligible to send Jake's HubSpot Meetings link",
    salesCalls: "Discovery notes; enrollment questions bump score",
    leadResponses: "Thread stays on the timeline until an outbound reply exists",
  },
  {
    stage: "QUALIFIED",
    hubspot: "SQL / qualify properties, deal create",
    jakeCalendar: "Book Jake — this is the intended handoff window",
    salesCalls: "Qual recap; recommended next step is book or handoff",
    leadResponses: "Booking intent → Jake Ready or Call Booked",
  },
  {
    stage: "JAKE_READY",
    hubspot: "Handoff note, score band, SQL",
    jakeCalendar: "Primary: HubSpot Meetings on Jake's calendar",
    salesCalls: "Founder brief / last context before the strategy call",
    leadResponses: "Confirmations and reschedule asks",
  },
  {
    stage: "CALL_BOOKED",
    hubspot: "Meeting engagement associated to the contact",
    jakeCalendar: "Booked / rescheduled / canceled / no-show",
    salesCalls: "Prep notes; held outcome can land here if sales logs it first",
    leadResponses: "Reminders and confirmations",
  },
  {
    stage: "CALL_HELD",
    hubspot: "Meeting outcome = completed",
    jakeCalendar: "Completed event on Jake's calendar",
    salesCalls: "Strategy-call analysis (structured recap, not an LLM score)",
    leadResponses: "Post-call questions, enrollment follow-up",
  },
  {
    stage: "ENROLLMENT_PENDING",
    hubspot: "Deal stage contract / enrollment",
    jakeCalendar: "Usually idle",
    salesCalls: "Close notes",
    leadResponses: "Paperwork / timing replies",
  },
  {
    stage: "WON",
    hubspot: "Deal closed-won, lifecycle customer",
    jakeCalendar: "Idle",
    salesCalls: "Win note",
    leadResponses: "Idle unless a new family member appears (new lead)",
  },
  {
    stage: "LOST",
    hubspot: "Deal closed-lost or disqualified",
    jakeCalendar: "Canceled leftover meetings",
    salesCalls: "Loss reason",
    leadResponses: "Stop-outreach signals",
  },
];

export interface WebhookSubscriptionSpec {
  id: string;
  channel: IngestChannel;
  path: string;
  providerEvent: string;
  canonicalType: CanonicalIngestEventType;
  stages: LeadStage[] | "any";
  purpose: string;
}

/** Subscriptions we pre-register in mock (and would create in HubSpot when live). */
export const PRE_REGISTERED_WEBHOOKS: WebhookSubscriptionSpec[] = [
  {
    id: "hs_contact_creation",
    channel: "hubspot",
    path: "/api/webhooks/hubspot",
    providerEvent: "contact.creation",
    canonicalType: "contact.created",
    stages: ["NEW"],
    purpose: "New HubSpot contact → SPM lead + first-contact SLA",
  },
  {
    id: "hs_contact_lifecycle",
    channel: "hubspot",
    path: "/api/webhooks/hubspot",
    providerEvent: "contact.propertyChange:lifecyclestage",
    canonicalType: "contact.updated",
    stages: "any",
    purpose: "Lifecycle → canonical stage floor (MQL/SQL/customer)",
  },
  {
    id: "hs_contact_owner",
    channel: "hubspot",
    path: "/api/webhooks/hubspot",
    providerEvent: "contact.propertyChange:hubspot_owner_id",
    canonicalType: "contact.owner_changed",
    stages: "any",
    purpose: "Owner changes stay visible; missing owner still flags",
  },
  {
    id: "hs_lead_status",
    channel: "hubspot",
    path: "/api/webhooks/hubspot",
    providerEvent: "contact.propertyChange:hs_lead_status",
    canonicalType: "contact.updated",
    stages: "any",
    purpose: "Disqualify / nurture side-states from HubSpot lead status",
  },
  {
    id: "hs_deal_stage",
    channel: "hubspot",
    path: "/api/webhooks/hubspot",
    providerEvent: "deal.propertyChange:dealstage",
    canonicalType: "deal.stage_changed",
    stages: ["QUALIFIED", "JAKE_READY", "CALL_BOOKED", "CALL_HELD", "ENROLLMENT_PENDING", "WON", "LOST"],
    purpose: "Deal stage → enrollment / won / lost",
  },
  {
    id: "hs_meeting_create",
    channel: "hubspot",
    path: "/api/webhooks/hubspot",
    providerEvent: "meeting.creation",
    canonicalType: "meeting.booked",
    stages: OPEN_STAGES.filter((s) => s !== "ENROLLMENT_PENDING"),
    purpose: "HubSpot meeting engagement booked (Jake or sales)",
  },
  {
    id: "cal_jake_booked",
    channel: "calendar",
    path: "/api/webhooks/calendar",
    providerEvent: "hubspot_meetings.booked",
    canonicalType: "meeting.booked",
    stages: OPEN_STAGES,
    purpose: "Jake's HubSpot Meetings link → Call Booked",
  },
  {
    id: "cal_jake_held",
    channel: "calendar",
    path: "/api/webhooks/calendar",
    providerEvent: "hubspot_meetings.completed",
    canonicalType: "meeting.held",
    stages: ["CALL_BOOKED", "CALL_HELD"],
    purpose: "Jake completed the strategy call",
  },
  {
    id: "cal_jake_noshow",
    channel: "calendar",
    path: "/api/webhooks/calendar",
    providerEvent: "hubspot_meetings.no_show",
    canonicalType: "meeting.no_show",
    stages: ["CALL_BOOKED"],
    purpose: "No-show → reschedule recovery action",
  },
  {
    id: "cal_jake_cancel",
    channel: "calendar",
    path: "/api/webhooks/calendar",
    providerEvent: "hubspot_meetings.canceled",
    canonicalType: "meeting.canceled",
    stages: ["CALL_BOOKED"],
    purpose: "Canceled meeting returns the lead to Jake Ready",
  },
  {
    id: "calls_logged",
    channel: "calls",
    path: "/api/webhooks/calls",
    providerEvent: "dialer.call.logged",
    canonicalType: "call.logged",
    stages: "any",
    purpose: "Sales call attempt/outcome on the timeline",
  },
  {
    id: "calls_analyzed",
    channel: "calls",
    path: "/api/webhooks/calls",
    providerEvent: "dialer.call.analyzed",
    canonicalType: "call.analyzed",
    stages: "any",
    purpose: "Structured call recap (enrollment ask, book intent, next step)",
  },
  {
    id: "msg_inbound",
    channel: "messaging",
    path: "/api/webhooks/messaging",
    providerEvent: "email_or_sms.inbound",
    canonicalType: "message.inbound",
    stages: "any",
    purpose: "Lead reply → needs_reply until sales responds",
  },
  {
    id: "msg_outbound",
    channel: "messaging",
    path: "/api/webhooks/messaging",
    providerEvent: "email_or_sms.outbound",
    canonicalType: "message.outbound",
    stages: "any",
    purpose: "Outbound reply clears needs_reply",
  },
  {
    id: "src_meta",
    channel: "sources",
    path: "/api/webhooks/sources/meta",
    providerEvent: "meta.leadgen",
    canonicalType: "source.captured",
    stages: ["NEW"],
    purpose: "Meta lead form → source event + reconcile",
  },
  {
    id: "src_forms",
    channel: "sources",
    path: "/api/webhooks/sources/forms",
    providerEvent: "website.form",
    canonicalType: "form.submitted",
    stages: ["NEW"],
    purpose: "Find the Right Mentor / site forms",
  },
];

export const WEBHOOK_CHANNEL_PATHS: Record<IngestChannel, string> = {
  hubspot: "/api/webhooks/hubspot",
  calendar: "/api/webhooks/calendar",
  calls: "/api/webhooks/calls",
  messaging: "/api/webhooks/messaging",
  sources: "/api/webhooks/sources/:channel",
};

export const SOURCE_WEBHOOK_CHANNELS = [
  "meta",
  "forms",
  "website",
  "typeform",
  "google_ads",
] as const;

export type SourceWebhookChannel = (typeof SOURCE_WEBHOOK_CHANNELS)[number];

export function isSourceWebhookChannel(value: string): value is SourceWebhookChannel {
  return (SOURCE_WEBHOOK_CHANNELS as readonly string[]).includes(value);
}

export function integrationsForStage(stage: LeadStage): StageIntegrationRow {
  return (
    STAGE_INTEGRATIONS.find((row) => row.stage === stage) ?? {
      stage,
      hubspot: "—",
      jakeCalendar: "—",
      salesCalls: "—",
      leadResponses: "—",
    }
  );
}
