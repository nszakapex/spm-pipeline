import { getStore } from "@/lib/db/store";
import { evaluateLeadRisks, type RiskFlag } from "@/lib/nurture/flags";
import { TERMINAL_STAGES, type Lead } from "@/types/domain";

export type WorkingReason =
  | "needs_reply"
  | "overdue"
  | "due_today"
  | "no_show"
  | "uncontacted"
  | "handoff"
  | "long_term"
  | "no_response"
  | "other";

export const WORKING_REASON_LABEL: Record<WorkingReason, string> = {
  needs_reply: "Needs reply",
  overdue: "Overdue",
  due_today: "Due today",
  no_show: "No-show",
  uncontacted: "Not contacted",
  handoff: "Handoff",
  long_term: "Long-term nurture",
  no_response: "No response",
  other: "Follow up",
};

/** Sales working order: reply first, then late work, then scheduled work. */
export const WORKING_REASON_PRIORITY: WorkingReason[] = [
  "needs_reply",
  "overdue",
  "due_today",
  "no_show",
  "uncontacted",
  "handoff",
  "long_term",
  "no_response",
  "other",
];

export const NURTURE_SECTION_KEYS = [
  "needs_reply",
  "overdue",
  "due_today",
  "no_show",
  "long_term",
  "no_response",
] as const;

export type NurtureSectionKey = (typeof NURTURE_SECTION_KEYS)[number];

export interface WorkQueueItem {
  lead: Lead;
  flags: RiskFlag[];
  primary: WorkingReason;
  secondary: WorkingReason[];
  why: string;
}

export function isSameCalendarDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isCalendarDueToday(lead: Lead, now: Date): boolean {
  const due = lead.next_action_at ?? lead.nurture_until;
  return Boolean(due && isSameCalendarDay(due, now));
}

export function getPrimaryWorkingReason(
  lead: Lead,
  flags: RiskFlag[],
  now: Date,
): WorkingReason {
  if (flags.some((f) => f.code === "needs_reply")) return "needs_reply";
  if (
    flags.some(
      (f) => f.code === "follow_up_overdue" || f.code === "first_contact_overdue",
    )
  ) {
    return "overdue";
  }
  if (isCalendarDueToday(lead, now)) return "due_today";
  if (flags.some((f) => f.code === "no_show_recovery") || lead.disposition === "NO_SHOW") {
    return "no_show";
  }
  if (flags.some((f) => f.code === "uncontacted")) return "uncontacted";
  if (lead.stage === "JAKE_READY") return "handoff";
  if (lead.disposition === "NURTURE") return "long_term";
  if (lead.disposition === "NO_RESPONSE") return "no_response";
  return "other";
}

export function getSecondaryReasons(
  lead: Lead,
  flags: RiskFlag[],
  primary: WorkingReason,
  now: Date,
): WorkingReason[] {
  const reasons: WorkingReason[] = [];
  if (flags.some((f) => f.code === "needs_reply")) reasons.push("needs_reply");
  if (
    flags.some(
      (f) => f.code === "follow_up_overdue" || f.code === "first_contact_overdue",
    )
  ) {
    reasons.push("overdue");
  }
  if (isCalendarDueToday(lead, now)) reasons.push("due_today");
  if (flags.some((f) => f.code === "no_show_recovery") || lead.disposition === "NO_SHOW") {
    reasons.push("no_show");
  }
  if (lead.disposition === "NURTURE") reasons.push("long_term");
  if (lead.disposition === "NO_RESPONSE") reasons.push("no_response");
  return reasons.filter((reason) => reason !== primary);
}

function toWorkItem(lead: Lead, now: Date): WorkQueueItem {
  const flags = evaluateLeadRisks(lead, getStore().getActivities(lead.id), now);
  const primary = getPrimaryWorkingReason(lead, flags, now);
  return {
    lead,
    flags,
    primary,
    secondary: getSecondaryReasons(lead, flags, primary, now),
    why:
      lead.next_action_note ||
      lead.nurture_reason ||
      flags[0]?.reason ||
      WORKING_REASON_LABEL[primary],
  };
}

function reasonRank(reason: WorkingReason): number {
  return WORKING_REASON_PRIORITY.indexOf(reason);
}

function compareWorkItems(a: WorkQueueItem, b: WorkQueueItem): number {
  const byReason = reasonRank(a.primary) - reasonRank(b.primary);
  if (byReason !== 0) return byReason;
  const critA = a.flags.filter((f) => f.severity === "critical").length;
  const critB = b.flags.filter((f) => f.severity === "critical").length;
  if (critB !== critA) return critB - critA;
  return b.lead.score - a.lead.score;
}

export function getWorkNextQueue(now = new Date(), limit = 10): WorkQueueItem[] {
  const leads = getStore()
    .getLeads()
    .filter((lead) => !TERMINAL_STAGES.includes(lead.stage));
  const items = leads.map((lead) => toWorkItem(lead, now));
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.lead.id)) return false;
    seen.add(item.lead.id);
    return true;
  });

  const actionable = unique.filter(
    (item) => item.primary !== "other" || item.flags.length > 0,
  );
  const filler = unique
    .filter((item) => !actionable.some((a) => a.lead.id === item.lead.id))
    .sort((a, b) => b.lead.score - a.lead.score);

  return [...actionable.sort(compareWorkItems), ...filler].slice(0, limit);
}

export function getNurtureQueues(now = new Date()): {
  key: NurtureSectionKey;
  title: string;
  leads: WorkQueueItem[];
}[] {
  const items = getStore()
    .getLeads()
    .filter((lead) => !TERMINAL_STAGES.includes(lead.stage))
    .map((lead) => toWorkItem(lead, now));

  return NURTURE_SECTION_KEYS.map((key) => ({
    key,
    title: WORKING_REASON_LABEL[key],
    leads: items.filter((item) => item.primary === key).sort(compareWorkItems),
  }));
}
