import { evaluateLeadRisks } from "@/lib/nurture/flags";
import { inferScoreInputFromLead, scoreLead } from "@/lib/scoring/score-lead";
import { atLeastStage } from "@/lib/pipeline/stage-order";
import type { CanonicalIngestEvent } from "@/integrations/webhooks/types";
import { recommendedActionFromCall } from "@/integrations/webhooks/analyze";
import type {
  Activity,
  IngestReceipt,
  Lead,
  LeadDisposition,
  LeadScoreFactor,
  LeadScoreSnapshot,
  LeadStage,
  NextActionType,
} from "@/types/domain";

export interface AppliedIngest {
  receipt: IngestReceipt;
  lead?: Lead;
  createdLead?: boolean;
  activities: Activity[];
  scoreFactors?: LeadScoreFactor[];
  scoreSnapshot?: LeadScoreSnapshot;
}

function hoursFromNow(hours: number, now: Date): string {
  return new Date(now.getTime() + hours * 3600_000).toISOString();
}

function nextActionDue(type: NextActionType, now: Date): string {
  const hours: Record<NextActionType, number> = {
    CALL_NOW: 0.25,
    CALL: 4,
    EMAIL: 4,
    TEXT: 4,
    FOLLOW_UP: 24,
    RESCHEDULE: 4,
    QUALIFY: 8,
    HANDOFF: 4,
    BOOK_MEETING: 24,
    REVIEW: 8,
    OTHER: 24,
  };
  return hoursFromNow(hours[type], now);
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function activity(
  leadId: string,
  partial: Omit<Activity, "id" | "lead_id" | "created_at"> & { created_at?: string },
): Activity {
  const created_at = partial.created_at ?? partial.occurred_at;
  return {
    id: newId("act"),
    lead_id: leadId,
    created_at,
    ...partial,
  };
}

function setNextAction(
  lead: Lead,
  type: NextActionType,
  note: string,
  now: Date,
): void {
  lead.next_action_type = type;
  lead.next_action_note = note;
  lead.next_action_at = nextActionDue(type, now);
}

function applyScore(lead: Lead, event: CanonicalIngestEvent, now: Date): {
  factors: LeadScoreFactor[];
  snapshot: LeadScoreSnapshot;
} {
  const extras = {
    repliedToOutreach:
      event.type === "message.inbound" || event.scoreExtras?.repliedToOutreach,
    repliedToday: event.type === "message.inbound" || event.scoreExtras?.repliedToday,
    bookedMeeting:
      event.type === "meeting.booked" ||
      event.type === "meeting.held" ||
      event.type === "meeting.rescheduled" ||
      event.call?.outcome === "held" ||
      event.scoreExtras?.bookedMeeting,
    requestedStrategyCall:
      event.reply?.requestedStrategyCall ||
      event.call?.requestedStrategyCall ||
      event.jakeReady ||
      event.scoreExtras?.requestedStrategyCall,
    askedAboutEnrollment:
      event.reply?.askedAboutEnrollment ||
      event.call?.askedAboutEnrollment ||
      event.scoreExtras?.askedAboutEnrollment,
    unrecoveredNoShow:
      event.type === "meeting.no_show" || event.call?.outcome === "no_show",
    explicitLackOfInterest:
      event.reply?.intent === "not_interested" ||
      event.call?.notInterested ||
      event.qualification === "not_qualified",
    longTermTiming: event.reply?.intent === "timing" || event.call?.timingLater,
    invalidContactInfo: event.call?.outcome === "wrong_number",
    ...event.scoreExtras,
  };
  const scored = scoreLead(inferScoreInputFromLead(lead, extras));
  lead.score = scored.score;
  lead.score_band = scored.band;
  lead.score_version = scored.version;
  const factors: LeadScoreFactor[] = scored.factors.map((f, i) => ({
    id: `${lead.id}_ing_${i}_${now.getTime()}`,
    lead_id: lead.id,
    factor_type: f.factor_type,
    label: f.label,
    points: f.points,
    source: f.source,
    created_at: now.toISOString(),
  }));
  const snapshot: LeadScoreSnapshot = {
    id: newId("ss"),
    lead_id: lead.id,
    score: scored.score,
    band: scored.band,
    version: scored.version,
    reason_summary: scored.reasonSummary,
    created_at: now.toISOString(),
  };
  return { factors, snapshot };
}

function maybeQualify(lead: Lead, event: CanonicalIngestEvent): void {
  if (event.qualification === "qualified") {
    lead.qualification_status = "qualified";
    lead.qualified_at = lead.qualified_at ?? event.occurredAt;
  }
  if (event.qualification === "not_qualified") {
    lead.qualification_status = "not_qualified";
    lead.qualification_reason = "Marked not qualified from integration event";
  }
}

function maybeJakeReady(lead: Lead, event: CanonicalIngestEvent): LeadStage {
  if (event.jakeReady || event.type === "lead.jake_ready") {
    return atLeastStage(lead.stage, "JAKE_READY");
  }
  const hotEnough = lead.score_band === "P1" || lead.score_band === "P2";
  const wantsCall =
    event.reply?.requestedStrategyCall || event.call?.requestedStrategyCall;
  if (
    (lead.qualification_status === "qualified" || lead.stage === "QUALIFIED") &&
    hotEnough &&
    wantsCall
  ) {
    return atLeastStage(lead.stage, "JAKE_READY");
  }
  return lead.stage;
}

function dispositionFromEvent(
  lead: Lead,
  event: CanonicalIngestEvent,
): LeadDisposition {
  if (event.disposition) return event.disposition;
  if (event.reply?.intent === "not_interested" || event.call?.notInterested) {
    return "NURTURE";
  }
  if (event.reply?.intent === "timing" || event.call?.timingLater) return "NURTURE";
  if (event.call?.outcome === "wrong_number") return "INVALID_CONTACT";
  if (event.type === "meeting.no_show" || event.call?.outcome === "no_show") {
    return "NO_SHOW";
  }
  if (event.qualification === "not_qualified") return "NOT_QUALIFIED";
  if (event.hubspot?.leadStatus) {
    const status = event.hubspot.leadStatus.toUpperCase();
    if (status.includes("UNQUAL") || status.includes("NOT_QUAL")) return "NOT_QUALIFIED";
    if (status.includes("NURTURE")) return "NURTURE";
    if (status.includes("INVALID")) return "INVALID_CONTACT";
  }
  if (lead.stage === "WON" || lead.stage === "LOST") return lead.disposition;
  return "ACTIVE";
}

function stageFromHubSpot(event: CanonicalIngestEvent, current: LeadStage): LeadStage {
  const lifecycle = event.hubspot?.lifecycleStage?.toLowerCase() ?? "";
  const deal = event.hubspot?.dealStage?.toLowerCase().replace(/[\s_]+/g, "") ?? "";

  if (lifecycle === "customer" || deal === "closedwon") return "WON";
  if (deal === "closedlost") return "LOST";
  if (deal.includes("contract") || deal.includes("enrollment")) {
    return atLeastStage(current, "ENROLLMENT_PENDING");
  }
  if (lifecycle === "opportunity" || deal.includes("appointment") || deal.includes("presentation")) {
    return atLeastStage(current, "JAKE_READY");
  }
  if (lifecycle === "salesqualifiedlead") return atLeastStage(current, "QUALIFIED");
  if (lifecycle === "marketingqualifiedlead") return atLeastStage(current, "CONNECTED");
  return current;
}

function applyMeeting(lead: Lead, event: CanonicalIngestEvent, now: Date, activities: Activity[]): void {
  const status = event.meeting?.status;
  if (event.type === "meeting.booked" || status === "booked") {
    lead.stage = atLeastStage(lead.stage, "CALL_BOOKED");
    lead.meeting_status = "booked";
    lead.meeting_booked_at = event.meeting?.startsAt ?? event.occurredAt;
    lead.disposition = "ACTIVE";
    setNextAction(lead, "CALL", "Prep for Jake's strategy call", now);
    activities.push(
      activity(lead.id, {
        activity_type: "meeting_booked",
        direction: "system",
        title: "Jake's calendar: call booked",
        body_summary: event.meeting?.startsAt
          ? `Strategy call starts ${event.meeting.startsAt}`
          : "Strategy call booked on Jake's HubSpot Meetings calendar",
        occurred_at: event.occurredAt,
        created_by: null,
        metadata_json: { calendar: event.meeting?.calendar ?? "jake" },
      }),
    );
    return;
  }
  if (event.type === "meeting.rescheduled" || status === "rescheduled") {
    lead.stage = atLeastStage(lead.stage, "CALL_BOOKED");
    lead.meeting_status = "rescheduled";
    lead.meeting_booked_at = event.meeting?.startsAt ?? lead.meeting_booked_at;
    lead.disposition = "ACTIVE";
    setNextAction(lead, "CALL", "Call was rescheduled — confirm the new time", now);
    activities.push(
      activity(lead.id, {
        activity_type: "meeting_booked",
        direction: "system",
        title: "Jake's calendar: call rescheduled",
        body_summary: "Strategy call moved",
        occurred_at: event.occurredAt,
        created_by: null,
        metadata_json: { calendar: event.meeting?.calendar ?? "jake" },
      }),
    );
    return;
  }
  if (event.type === "meeting.canceled" || status === "canceled") {
    if (lead.stage === "CALL_BOOKED") lead.stage = "JAKE_READY";
    lead.meeting_status = "canceled";
    lead.disposition = "ACTIVE";
    setNextAction(lead, "BOOK_MEETING", "Rebook Jake after the cancellation", now);
    activities.push(
      activity(lead.id, {
        activity_type: "note",
        direction: "system",
        title: "Jake's calendar: call canceled",
        body_summary: "Returned to Jake Ready to rebook",
        occurred_at: event.occurredAt,
        created_by: null,
        metadata_json: {},
      }),
    );
    return;
  }
  if (event.type === "meeting.held" || status === "held") {
    lead.stage = atLeastStage(lead.stage, "CALL_HELD");
    lead.meeting_status = "held";
    lead.disposition = "ACTIVE";
    setNextAction(lead, "FOLLOW_UP", "Send enrollment follow-up after Jake's call", now);
    activities.push(
      activity(lead.id, {
        activity_type: "meeting_held",
        direction: "system",
        title: "Jake's calendar: call held",
        body_summary: "Strategy call completed",
        occurred_at: event.occurredAt,
        created_by: null,
        metadata_json: {},
      }),
    );
    return;
  }
  if (event.type === "meeting.no_show" || status === "no_show") {
    lead.stage = lead.stage === "NEW" ? "CALL_BOOKED" : atLeastStage(lead.stage, "CALL_BOOKED");
    lead.meeting_status = "no_show";
    lead.disposition = "NO_SHOW";
    setNextAction(lead, "RESCHEDULE", "No-show — recover and rebook Jake", now);
    activities.push(
      activity(lead.id, {
        activity_type: "no_show",
        direction: "system",
        title: "Jake's calendar: no-show",
        body_summary: "Strategy call missed",
        occurred_at: event.occurredAt,
        created_by: null,
        metadata_json: {},
      }),
    );
  }
}

function applyCall(lead: Lead, event: CanonicalIngestEvent, now: Date, activities: Activity[]): void {
  const call = event.call;
  if (!call) return;

  lead.last_contact_at = event.occurredAt;
  if (!lead.first_contact_at) lead.first_contact_at = event.occurredAt;

  if (call.outcome === "held" || (call.kind === "strategy" && event.type === "call.analyzed")) {
    if (lead.stage === "CALL_BOOKED" || call.kind === "strategy") {
      lead.stage = atLeastStage(lead.stage, "CALL_HELD");
      lead.meeting_status = "held";
    }
  } else if (call.outcome === "no_show") {
    lead.meeting_status = "no_show";
    lead.disposition = "NO_SHOW";
  } else if (call.outcome === "connected") {
    lead.stage = atLeastStage(lead.stage, "CONNECTED");
  } else if (
    call.outcome === "voicemail" ||
    call.outcome === "no_answer" ||
    call.outcome === "busy"
  ) {
    lead.stage = atLeastStage(lead.stage, "ATTEMPTING_CONTACT");
  }

  if (call.askedAboutEnrollment && lead.qualification_status !== "not_qualified") {
    lead.qualification_status =
      lead.qualification_status === "qualified" ? "qualified" : "pending";
    lead.stage = atLeastStage(lead.stage, "CONNECTED");
  }

  const next = recommendedActionFromCall(call);
  setNextAction(lead, next, call.recap ?? `Call ${call.outcome}`, now);

  const isAnalysis = event.type === "call.analyzed";
  activities.push(
    activity(lead.id, {
      activity_type: isAnalysis ? "call_analyzed" : "call",
      direction: call.outcome === "connected" || call.outcome === "held" ? "outbound" : "outbound",
      title: isAnalysis ? "Sales call analyzed" : `Sales call — ${call.outcome.replace("_", " ")}`,
      body_summary: call.recap ?? `Outcome: ${call.outcome}`,
      occurred_at: event.occurredAt,
      created_by: lead.owner_id,
      metadata_json: {
        outcome: call.outcome,
        kind: call.kind ?? "sales",
        durationSeconds: call.durationSeconds ?? null,
        recap: call.recap ?? null,
        askedAboutEnrollment: Boolean(call.askedAboutEnrollment),
        requestedStrategyCall: Boolean(call.requestedStrategyCall),
        recommendedNextAction: next,
      },
    }),
  );
}

function applyReply(lead: Lead, event: CanonicalIngestEvent, now: Date, activities: Activity[]): void {
  const reply = event.reply;
  const inbound = event.type === "message.inbound";
  lead.last_activity_at = event.occurredAt;
  if (inbound) {
    lead.last_contact_at = event.occurredAt;
    lead.stage = atLeastStage(lead.stage, "CONNECTED");
    if (reply?.intent === "book") {
      lead.stage = atLeastStage(lead.stage, "CONNECTED");
      if (lead.qualification_status === "qualified") {
        lead.stage = atLeastStage(lead.stage, "JAKE_READY");
      }
      setNextAction(lead, "BOOK_MEETING", reply.summary ?? "Lead asked to book Jake", now);
    } else if (reply?.intent === "not_interested") {
      lead.disposition = "NURTURE";
      lead.nurture_reason = "Lead asked not to continue right now";
      lead.nurture_until = hoursFromNow(24 * 30, now);
      setNextAction(lead, "FOLLOW_UP", "Parked in nurture after opt-out tone", now);
    } else if (reply?.intent === "timing") {
      lead.disposition = "NURTURE";
      lead.nurture_reason = "Timing later";
      lead.nurture_until = hoursFromNow(24 * 21, now);
      setNextAction(lead, "FOLLOW_UP", "Nurture — family asked to wait", now);
    } else if (reply?.intent === "confirm") {
      setNextAction(lead, "CALL", reply.summary ?? "Family confirmed — keep the slot", now);
    } else {
      setNextAction(
        lead,
        reply?.channel === "sms" ? "TEXT" : "EMAIL",
        reply?.summary ?? "Inbound reply needs a response",
        now,
      );
    }
  } else {
    setNextAction(lead, "FOLLOW_UP", "Outbound message sent", now);
  }

  activities.push(
    activity(lead.id, {
      activity_type: inbound ? "reply" : reply?.channel === "sms" ? "sms" : "email",
      direction: inbound ? "inbound" : "outbound",
      title: inbound ? "Lead replied" : "Outbound message",
      body_summary: reply?.summary ?? (inbound ? "Inbound reply" : "Outbound reply"),
      occurred_at: event.occurredAt,
      created_by: inbound ? null : lead.owner_id,
      metadata_json: {
        channel: reply?.channel ?? "email",
        intent: reply?.intent ?? "unknown",
        recap: reply?.summary ?? null,
        askedAboutEnrollment: Boolean(reply?.askedAboutEnrollment),
        requestedStrategyCall: Boolean(reply?.requestedStrategyCall),
      },
    }),
  );
}

export function createLeadFromEvent(event: CanonicalIngestEvent, now: Date): Lead {
  const created = now.toISOString();
  return {
    id: event.identity.leadId ?? newId("lead_ing"),
    first_name: event.identity.firstName?.trim() || "Unknown",
    last_name: event.identity.lastName?.trim() || "Lead",
    email: event.identity.email ?? null,
    phone: event.identity.phone ?? null,
    owner_id: event.identity.ownerId ?? "user_001",
    source: event.source?.name ?? "Inbound",
    source_detail: event.source?.campaign ?? null,
    source_definition_id: null,
    campaign: event.source?.campaign ?? null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    stage: "NEW",
    disposition: "ACTIVE",
    score: 0,
    score_band: "P4",
    score_version: "v1",
    created_at: created,
    first_contact_at: null,
    last_contact_at: null,
    last_activity_at: created,
    next_action_at: nextActionDue("CALL_NOW", now),
    next_action_type: "CALL_NOW",
    next_action_note: "New inbound — first contact",
    qualification_status: "unknown",
    qualification_reason: null,
    qualified_at: null,
    meeting_booked_at: null,
    meeting_status: "none",
    nurture_reason: null,
    nurture_until: null,
    lost_reason: null,
    hubspot_contact_id: event.identity.hubspotContactId ?? null,
    hubspot_lead_id: null,
    hubspot_deal_id: event.identity.hubspotDealId ?? null,
    sync_status: event.channel === "hubspot" ? "pending" : "not_synced",
    last_synced_at: event.channel === "hubspot" ? created : null,
    updated_at: created,
  };
}

export function applyCanonicalEvent(
  existing: Lead | undefined,
  event: CanonicalIngestEvent,
  now: Date = new Date(),
): AppliedIngest {
  const receivedAt = now.toISOString();
  const createdLead = !existing;
  const stageBefore = existing?.stage ?? null;

  if (
    !existing &&
    !["contact.created", "form.submitted", "source.captured"].includes(event.type)
  ) {
    const receipt: IngestReceipt = {
      id: newId("ing"),
      channel: event.channel,
      event_type: event.type,
      external_event_id: event.externalEventId,
      status: "unmatched",
      lead_id: null,
      stage_before: null,
      stage_after: null,
      flags_raised: ["unmatched_source_event"],
      summary: "No matching lead for this webhook identity",
      received_at: receivedAt,
    };
    return { receipt, activities: [] };
  }

  const lead: Lead = existing ? { ...existing } : createLeadFromEvent(event, now);
  const activities: Activity[] = [];

  if (createdLead) {
    activities.push(
      activity(lead.id, {
        activity_type: "captured",
        direction: "system",
        title: "Lead captured from webhook",
        body_summary: `${event.channel} ${event.type}`,
        occurred_at: event.occurredAt,
        created_by: null,
        metadata_json: { externalEventId: event.externalEventId },
      }),
    );
  }

  if (event.identity.ownerId) lead.owner_id = event.identity.ownerId;
  if (event.identity.hubspotContactId) {
    lead.hubspot_contact_id = event.identity.hubspotContactId;
  }
  if (event.identity.hubspotDealId) lead.hubspot_deal_id = event.identity.hubspotDealId;
  if (event.identity.email) lead.email = event.identity.email;
  if (event.identity.phone) lead.phone = event.identity.phone;

  maybeQualify(lead, event);

  if (event.type.startsWith("meeting.") || event.meeting) {
    applyMeeting(lead, event, now, activities);
  } else if (event.type === "call.logged" || event.type === "call.analyzed") {
    applyCall(lead, event, now, activities);
  } else if (event.type === "message.inbound" || event.type === "message.outbound") {
    applyReply(lead, event, now, activities);
  } else if (event.type === "deal.stage_changed" || event.type === "contact.updated") {
    const next = event.targetStage
      ? atLeastStage(lead.stage, event.targetStage)
      : stageFromHubSpot(event, lead.stage);
    if (next !== lead.stage) {
      activities.push(
        activity(lead.id, {
          activity_type: "stage_change",
          direction: "system",
          title: `Stage → ${next}`,
          body_summary: `From ${lead.stage} via ${event.type}`,
          occurred_at: event.occurredAt,
          created_by: null,
          metadata_json: { from: lead.stage, to: next },
        }),
      );
      lead.stage = next;
    }
  } else if (event.type === "contact.owner_changed") {
    activities.push(
      activity(lead.id, {
        activity_type: "assigned",
        direction: "system",
        title: "Owner updated from HubSpot",
        body_summary: lead.owner_id ? `Owner ${lead.owner_id}` : "Owner cleared",
        occurred_at: event.occurredAt,
        created_by: null,
        metadata_json: { owner_id: lead.owner_id },
      }),
    );
  } else if (event.type === "lead.jake_ready" || event.jakeReady) {
    lead.stage = atLeastStage(lead.stage, "JAKE_READY");
    setNextAction(lead, "HANDOFF", "Ready for Jake — send the meetings link", now);
  } else if (event.targetStage) {
    lead.stage = atLeastStage(lead.stage, event.targetStage);
  }

  lead.stage = maybeJakeReady(lead, event);
  lead.disposition = dispositionFromEvent(lead, event);

  if (lead.stage === "LOST") {
    lead.lost_reason = lead.lost_reason ?? "Closed lost from integration event";
    lead.next_action_type = null;
    lead.next_action_at = null;
  }
  if (lead.stage === "WON") {
    lead.next_action_type = null;
    lead.next_action_at = null;
  }

  if (event.channel === "hubspot") {
    lead.sync_status = "synced";
    lead.last_synced_at = receivedAt;
  }

  lead.last_activity_at = event.occurredAt;
  lead.updated_at = receivedAt;

  const scored = applyScore(lead, event, now);
  activities.push(
    activity(lead.id, {
      activity_type: "score_change",
      direction: "system",
      title: "Score recomputed",
      body_summary: scored.snapshot.reason_summary,
      occurred_at: receivedAt,
      created_by: null,
      metadata_json: { score: lead.score, band: lead.score_band },
    }),
  );

  const flags = evaluateLeadRisks(lead, activities, now).map((f) => f.code);
  const receipt: IngestReceipt = {
    id: newId("ing"),
    channel: event.channel,
    event_type: event.type,
    external_event_id: event.externalEventId,
    status: "applied",
    lead_id: lead.id,
    stage_before: stageBefore,
    stage_after: lead.stage,
    flags_raised: flags,
    summary: summarize(event, stageBefore, lead.stage),
    received_at: receivedAt,
  };

  return {
    receipt,
    lead,
    createdLead,
    activities,
    scoreFactors: scored.factors,
    scoreSnapshot: scored.snapshot,
  };
}

function summarize(
  event: CanonicalIngestEvent,
  from: LeadStage | null,
  to: LeadStage,
): string {
  if (!from) return `${event.type} created lead at ${to}`;
  if (from !== to) return `${event.type}: ${from} → ${to}`;
  return `${event.type} applied; stage stayed ${to}`;
}
