import type {
  CanonicalIngestEventType,
  IngestChannel,
  MeetingStatus,
  SourceCategory,
} from "@/types/domain";
import type { CanonicalIngestEvent, ReplyChannel, ReplyIntent } from "./types";
import { analyzeCallPayload, analyzeReplyText, parseCallOutcome } from "./analyze";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asEvents(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json.filter(isRecord);
  if (isRecord(json) && Array.isArray(json.events)) {
    return json.events.filter(isRecord);
  }
  if (isRecord(json)) return [json];
  return [];
}

function occurredAt(raw: Record<string, unknown>): string {
  const iso = str(raw.occurredAt) ?? str(raw.occurred_at);
  if (iso) return iso;
  if (typeof raw.occurredAt === "number") {
    const ms = raw.occurredAt < 1e12 ? raw.occurredAt * 1000 : raw.occurredAt;
    return new Date(ms).toISOString();
  }
  return new Date().toISOString();
}

function externalId(raw: Record<string, unknown>, fallbackPrefix: string): string {
  return (
    str(raw.externalEventId) ??
    str(raw.external_event_id) ??
    (typeof raw.eventId === "number" ? String(raw.eventId) : undefined) ??
    str(raw.eventId) ??
    `${fallbackPrefix}_${JSON.stringify(raw).slice(0, 48)}`
  );
}

function meetingFromType(type: CanonicalIngestEventType): MeetingStatus | undefined {
  switch (type) {
    case "meeting.booked":
      return "booked";
    case "meeting.rescheduled":
      return "rescheduled";
    case "meeting.canceled":
      return "canceled";
    case "meeting.held":
      return "held";
    case "meeting.no_show":
      return "no_show";
    default:
      return undefined;
  }
}

const HUBSPOT_TYPE: Record<string, CanonicalIngestEventType> = {
  "contact.creation": "contact.created",
  "contact.created": "contact.created",
  "contact.propertychange": "contact.updated",
  "contact.updated": "contact.updated",
  "contact.owner_changed": "contact.owner_changed",
  "deal.creation": "deal.stage_changed",
  "deal.propertychange": "deal.stage_changed",
  "deal.stage_changed": "deal.stage_changed",
  "meeting.creation": "meeting.booked",
  "meeting.booked": "meeting.booked",
  "meeting.propertychange": "meeting.booked",
};

function hubspotType(raw: Record<string, unknown>): CanonicalIngestEventType {
  const subscription = (str(raw.subscriptionType) ?? str(raw.event) ?? "").toLowerCase();
  const property = (str(raw.propertyName) ?? "").toLowerCase();
  if (property === "hubspot_owner_id") return "contact.owner_changed";
  if (subscription.includes("meeting") && property.includes("outcome")) {
    const value = (str(raw.propertyValue) ?? "").toLowerCase();
    if (value.includes("no_show") || value.includes("noshow")) return "meeting.no_show";
    if (value.includes("complet") || value.includes("held")) return "meeting.held";
    if (value.includes("cancel")) return "meeting.canceled";
    if (value.includes("resched")) return "meeting.rescheduled";
  }
  const mapped = HUBSPOT_TYPE[subscription.replace(/\s+/g, "")];
  if (mapped) return mapped;
  if (subscription.startsWith("contact")) return "contact.updated";
  if (subscription.startsWith("deal")) return "deal.stage_changed";
  if (subscription.startsWith("meeting")) return "meeting.booked";
  return "contact.updated";
}

function qualificationOf(
  value: unknown,
): "qualified" | "not_qualified" | undefined {
  const parsed = str(value);
  if (parsed === "qualified" || parsed === "not_qualified") return parsed;
  return undefined;
}

function objectIdFor(
  raw: Record<string, unknown>,
  type: CanonicalIngestEventType,
): string | undefined {
  if (typeof raw.objectId === "number") return String(raw.objectId);
  const asString = str(raw.objectId);
  if (asString) return asString;
  if (type.startsWith("contact")) return str(raw.contactId);
  if (type.startsWith("deal")) return str(raw.dealId);
  return undefined;
}

export function parseHubSpotWebhookPayload(json: unknown): CanonicalIngestEvent[] {
  return asEvents(json).map((raw) => {
    const type = hubspotType(raw);
    const meetingStatus = meetingFromType(type);
    const property = (str(raw.propertyName) ?? "").toLowerCase();
    const propertyValue = str(raw.propertyValue);
    return {
      channel: "hubspot" as IngestChannel,
      type,
      externalEventId: externalId(raw, "hs"),
      occurredAt: occurredAt(raw),
      identity: {
        email:
          (property === "email" ? propertyValue : undefined) ??
          str(raw.email) ??
          str(raw.contactEmail),
        phone: (property === "phone" ? propertyValue : undefined) ?? str(raw.phone),
        firstName:
          (property === "firstname" ? propertyValue : undefined) ??
          str(raw.firstName) ??
          str(raw.firstname),
        lastName:
          (property === "lastname" ? propertyValue : undefined) ??
          str(raw.lastName) ??
          str(raw.lastname),
        hubspotContactId:
          str(raw.contactId) ??
          str(raw.hubspotContactId) ??
          (type.startsWith("contact") || type.startsWith("meeting")
            ? objectIdFor(raw, type)
            : undefined),
        hubspotDealId:
          str(raw.dealId) ?? (type.startsWith("deal") ? objectIdFor(raw, type) : undefined),
        leadId: str(raw.leadId),
        ownerId:
          (property === "hubspot_owner_id" ? propertyValue : undefined) ?? str(raw.ownerId),
      },
      payloadSummary: {
        subscriptionType: str(raw.subscriptionType) ?? str(raw.event) ?? null,
        propertyName: str(raw.propertyName) ?? null,
      },
      meeting: meetingStatus
        ? { status: meetingStatus, calendar: "jake", startsAt: str(raw.startsAt) }
        : undefined,
      hubspot: {
        objectType: str(raw.objectType) ?? type.split(".")[0] ?? "contact",
        objectId: objectIdFor(raw, type) ?? str(raw.contactId) ?? null,
        propertyName: str(raw.propertyName),
        propertyValue,
        lifecycleStage:
          (property === "lifecyclestage" ? propertyValue : undefined) ??
          str(raw.lifecyclestage) ??
          str(raw.lifecycleStage),
        dealStage:
          (property === "dealstage" ? propertyValue : undefined) ??
          str(raw.dealStage) ??
          str(raw.dealstage) ??
          (type.startsWith("deal") ? propertyValue : undefined),
        leadStatus:
          (property === "hs_lead_status" ? propertyValue : undefined) ??
          str(raw.hs_lead_status) ??
          str(raw.leadStatus),
      },
      jakeReady: raw.jakeReady === true,
      qualification: qualificationOf(raw.qualification),
    };
  });
}

const CALENDAR_TYPE: Record<string, CanonicalIngestEventType> = {
  "meeting.booked": "meeting.booked",
  booked: "meeting.booked",
  "meeting.rescheduled": "meeting.rescheduled",
  rescheduled: "meeting.rescheduled",
  "meeting.canceled": "meeting.canceled",
  canceled: "meeting.canceled",
  cancelled: "meeting.canceled",
  "meeting.held": "meeting.held",
  completed: "meeting.held",
  held: "meeting.held",
  "meeting.no_show": "meeting.no_show",
  no_show: "meeting.no_show",
  noshow: "meeting.no_show",
};

export function parseCalendarWebhookPayload(json: unknown): CanonicalIngestEvent[] {
  return asEvents(json).map((raw) => {
    const type =
      CALENDAR_TYPE[(str(raw.event) ?? str(raw.status) ?? "meeting.booked").toLowerCase()] ??
      "meeting.booked";
    const status = meetingFromType(type) ?? "booked";
    return {
      channel: "calendar" as const,
      type,
      externalEventId: externalId(raw, "cal"),
      occurredAt: occurredAt(raw),
      identity: {
        email: str(raw.email) ?? str(raw.contactEmail),
        phone: str(raw.phone),
        firstName: str(raw.firstName),
        lastName: str(raw.lastName),
        hubspotContactId: str(raw.contactId) ?? str(raw.hubspotContactId),
        leadId: str(raw.leadId),
      },
      payloadSummary: { calendar: str(raw.calendar) ?? "jake" },
      meeting: {
        status,
        startsAt: str(raw.startsAt) ?? str(raw.startAt),
        calendar: raw.calendar === "sales" ? "sales" : "jake",
      },
    };
  });
}

export function parseCallsWebhookPayload(json: unknown): CanonicalIngestEvent[] {
  return asEvents(json).map((raw) => {
    const type: CanonicalIngestEventType =
      (str(raw.event) ?? "").includes("analy") || raw.analyzed === true
        ? "call.analyzed"
        : "call.logged";
    const call = analyzeCallPayload({
      outcome: raw.outcome ?? parseCallOutcome(raw.status),
      recap: raw.recap,
      text: raw.text ?? raw.body,
      durationSeconds: raw.durationSeconds ?? raw.duration,
      kind: raw.kind,
      askedAboutEnrollment: raw.askedAboutEnrollment,
      requestedStrategyCall: raw.requestedStrategyCall,
      notInterested: raw.notInterested,
      timingLater: raw.timingLater,
      recommendedNextAction: raw.recommendedNextAction,
    });
    return {
      channel: "calls" as const,
      type,
      externalEventId: externalId(raw, "call"),
      occurredAt: occurredAt(raw),
      identity: {
        email: str(raw.email),
        phone: str(raw.phone),
        firstName: str(raw.firstName),
        lastName: str(raw.lastName),
        hubspotContactId: str(raw.contactId),
        leadId: str(raw.leadId),
      },
      payloadSummary: { outcome: call.outcome, kind: call.kind ?? "sales" },
      call,
    };
  });
}

const REPLY_INTENTS: ReplyIntent[] = [
  "question",
  "book",
  "not_interested",
  "timing",
  "confirm",
  "unknown",
];

function parseReplyIntent(value: unknown): ReplyIntent | undefined {
  return typeof value === "string" && REPLY_INTENTS.includes(value as ReplyIntent)
    ? (value as ReplyIntent)
    : undefined;
}

export function parseMessagingWebhookPayload(json: unknown): CanonicalIngestEvent[] {
  return asEvents(json).map((raw) => {
    const eventName = str(raw.event) ?? "message.inbound";
    const inbound =
      eventName.includes("inbound") ||
      str(raw.direction) === "inbound" ||
      eventName === "reply";
    const channel: ReplyChannel = str(raw.channel) === "sms" ? "sms" : "email";
    const text = str(raw.text) ?? str(raw.body) ?? str(raw.summary);
    const classified = analyzeReplyText(text, channel);
    return {
      channel: "messaging" as const,
      type: inbound ? ("message.inbound" as const) : ("message.outbound" as const),
      externalEventId: externalId(raw, "msg"),
      occurredAt: occurredAt(raw),
      identity: {
        email: str(raw.email),
        phone: str(raw.phone),
        firstName: str(raw.firstName),
        lastName: str(raw.lastName),
        hubspotContactId: str(raw.contactId),
        leadId: str(raw.leadId),
      },
      payloadSummary: { channel, inbound },
      reply: {
        channel,
        intent: parseReplyIntent(raw.intent) ?? classified.intent,
        askedAboutEnrollment: raw.askedAboutEnrollment === true || classified.askedAboutEnrollment,
        requestedStrategyCall:
          raw.requestedStrategyCall === true || classified.requestedStrategyCall,
        summary: classified.summary ?? text,
      },
    };
  });
}

const SOURCE_META: Record<string, { name: string; category: SourceCategory }> = {
  meta: { name: "Meta / Instagram", category: "paid_social" },
  forms: { name: "Find the Right Mentor", category: "form" },
  website: { name: "Main Website", category: "website" },
  typeform: { name: "Find the Right Mentor", category: "form" },
  google_ads: { name: "Google Ads", category: "paid_search" },
};

export function parseSourceWebhookPayload(
  json: unknown,
  sourceChannel: string,
): CanonicalIngestEvent[] {
  const source = SOURCE_META[sourceChannel] ?? {
    name: "Inbound",
    category: "other_campaign" as const,
  };
  const formLike = sourceChannel === "forms" || sourceChannel === "typeform" || sourceChannel === "website";

  return asEvents(json).map((raw) => ({
    channel: "sources" as const,
    type: formLike ? ("form.submitted" as const) : ("source.captured" as const),
    externalEventId: externalId(raw, sourceChannel),
    occurredAt: occurredAt(raw),
    identity: {
      email: str(raw.email),
      phone: str(raw.phone),
      firstName: str(raw.firstName) ?? str(raw.firstname),
      lastName: str(raw.lastName) ?? str(raw.lastname),
      hubspotContactId: str(raw.contactId),
      leadId: str(raw.leadId),
    },
    payloadSummary: { sourceChannel },
    source: {
      category: source.category,
      name: source.name,
      campaign: str(raw.campaign) ?? null,
    },
  }));
}
