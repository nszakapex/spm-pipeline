import {
  DEFAULT_SLA,
  TERMINAL_STAGES,
  type Activity,
  type Lead,
  type LeadSourceEvent,
  type SlaConfig,
} from "@/types/domain";

export type RiskFlagCode =
  | "uncontacted"
  | "first_contact_overdue"
  | "no_owner"
  | "missing_source"
  | "no_next_action"
  | "follow_up_overdue"
  | "stale_stage"
  | "nurture_due"
  | "no_show_recovery"
  | "needs_reply"
  | "integration_failure"
  | "unmatched_source_event";

export interface RiskFlag {
  code: RiskFlagCode;
  label: string;
  severity: "critical" | "warning" | "info";
  reason: string;
}

function isActiveLead(lead: Lead): boolean {
  return !TERMINAL_STAGES.includes(lead.stage);
}

function hoursBetween(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / (1000 * 60 * 60);
}

function daysBetween(later: Date, earlier: Date): number {
  return hoursBetween(later, earlier) / 24;
}

export function evaluateLeadRisks(
  lead: Lead,
  activities: Activity[],
  now: Date = new Date(),
  sla: SlaConfig = DEFAULT_SLA,
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const active = isActiveLead(lead);

  if (active && !lead.owner_id) {
    flags.push({
      code: "no_owner",
      label: "No Owner",
      severity: "critical",
      reason: "Active lead has no owner assigned",
    });
  }

  if (active && (!lead.source || lead.source === "unknown" || lead.source === "missing")) {
    flags.push({
      code: "missing_source",
      label: "Missing Source",
      severity: "critical",
      reason: "Active lead is missing source attribution",
    });
  }

  if (active && (!lead.next_action_at || !lead.next_action_type)) {
    flags.push({
      code: "no_next_action",
      label: "No Next Action",
      severity: "critical",
      reason: "Active lead has no scheduled next action",
    });
  }

  if (
    active &&
    lead.next_action_at &&
    new Date(lead.next_action_at).getTime() < now.getTime()
  ) {
    flags.push({
      code: "follow_up_overdue",
      label: "Follow-up Overdue",
      severity: "warning",
      reason: `Next action was due ${lead.next_action_at}`,
    });
  }

  const outbound = activities.filter(
    (a) =>
      a.direction === "outbound" &&
      ["call", "email", "sms", "note"].includes(a.activity_type),
  );
  const hasOutbound = outbound.length > 0 || Boolean(lead.first_contact_at);

  if (active && !hasOutbound) {
    flags.push({
      code: "uncontacted",
      label: "Uncontacted",
      severity: "warning",
      reason: "No outbound contact activity logged",
    });
  }

  if (
    active &&
    !lead.first_contact_at &&
    hoursBetween(now, new Date(lead.created_at)) > sla.firstContactHours
  ) {
    flags.push({
      code: "first_contact_overdue",
      label: "First Contact Overdue",
      severity: "critical",
      reason: `No first contact within ${sla.firstContactHours}h SLA`,
    });
  }

  const stageThreshold = sla.staleStageDays[lead.stage];
  const lastMeaningful = lead.last_activity_at ?? lead.updated_at ?? lead.created_at;
  if (
    active &&
    daysBetween(now, new Date(lastMeaningful)) > stageThreshold
  ) {
    flags.push({
      code: "stale_stage",
      label: "Stale Stage",
      severity: "warning",
      reason: `No meaningful activity for more than ${stageThreshold} days in ${lead.stage}`,
    });
  }

  if (
    active &&
    lead.disposition === "NURTURE" &&
    lead.nurture_until &&
    new Date(lead.nurture_until).getTime() <= now.getTime()
  ) {
    flags.push({
      code: "nurture_due",
      label: "Nurture Due",
      severity: "warning",
      reason: "Nurture follow-up date has arrived",
    });
  }

  if (
    active &&
    (lead.disposition === "NO_SHOW" || lead.meeting_status === "no_show") &&
    lead.next_action_type !== "RESCHEDULE"
  ) {
    flags.push({
      code: "no_show_recovery",
      label: "No-show Recovery",
      severity: "critical",
      reason: "Meeting no-show without a reschedule recovery action",
    });
  }

  const chronological = [...activities].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );
  const latestComm = chronological.find((a) =>
    ["call", "email", "sms", "reply"].includes(a.activity_type),
  );
  if (
    active &&
    latestComm &&
    (latestComm.direction === "inbound" || latestComm.activity_type === "reply")
  ) {
    const laterOutbound = chronological.find(
      (a) =>
        a.direction === "outbound" &&
        new Date(a.occurred_at).getTime() > new Date(latestComm.occurred_at).getTime(),
    );
    if (!laterOutbound) {
      flags.push({
        code: "needs_reply",
        label: "Needs Reply",
        severity: "critical",
        reason: "Latest meaningful communication is inbound without an outbound response",
      });
    }
  }

  if (active && lead.sync_status === "failed") {
    flags.push({
      code: "integration_failure",
      label: "Integration Failure",
      severity: "critical",
      reason: "Latest required HubSpot synchronization attempt failed",
    });
  }

  return flags;
}

export function evaluateUnmatchedSourceEvent(
  event: LeadSourceEvent,
  now: Date = new Date(),
  sla: SlaConfig = DEFAULT_SLA,
): RiskFlag | null {
  if (!["unmatched", "failed", "pending"].includes(event.reconciliation_status)) {
    return null;
  }
  if (
    event.reconciliation_status === "pending" &&
    hoursBetween(now, new Date(event.received_at)) < sla.reconciliationHours
  ) {
    return null;
  }
  return {
    code: "unmatched_source_event",
    label: "Unmatched Source Event",
    severity: event.reconciliation_status === "failed" ? "critical" : "warning",
    reason:
      event.reconciliation_reason ??
      `Source event remains ${event.reconciliation_status}`,
  };
}

export function leadHasFlag(flags: RiskFlag[], code: RiskFlagCode): boolean {
  return flags.some((f) => f.code === code);
}
