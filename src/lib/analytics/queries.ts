import { getStore } from "@/lib/db/store";
import { evaluateLeadRisks, type RiskFlagCode } from "@/lib/nurture/flags";
import {
  calculatePipelineHealth,
  summarizeSourceIntegrity,
} from "@/lib/integrity/reconciliation";
import { TERMINAL_STAGES, type Activity, type Lead } from "@/types/domain";
import { isToday, parseISO } from "date-fns";

export function getActivitiesByLead(): Map<string, Activity[]> {
  const map = new Map<string, Activity[]>();
  for (const a of getStore().getActivities()) {
    const list = map.get(a.lead_id) ?? [];
    list.push(a);
    map.set(a.lead_id, list);
  }
  return map;
}

export function getLeadFlags(lead: Lead, now = new Date()) {
  return evaluateLeadRisks(
    lead,
    getActivitiesByLead().get(lead.id) ?? [],
    now,
  );
}

export function filterLeadsByFlag(code: RiskFlagCode, now = new Date()): Lead[] {
  return getStore()
    .getLeads()
    .filter((lead) => getLeadFlags(lead, now).some((f) => f.code === code));
}

export function getDashboardMetrics(now = new Date()) {
  const store = getStore();
  const leads = store.getLeads();
  const activitiesByLead = getActivitiesByLead();
  const health = calculatePipelineHealth(
    leads,
    activitiesByLead,
    store.getSourceEvents(),
    now,
  );

  const active = leads.filter((l) => !TERMINAL_STAGES.includes(l.stage));
  const newToday = leads.filter((l) => isToday(parseISO(l.created_at))).length;
  const hot = active.filter((l) => l.score_band === "P1").length;
  const needsReply = filterLeadsByFlag("needs_reply", now).length;
  const jakeReady = active.filter((l) => l.stage === "JAKE_READY").length;
  const callsBooked = active.filter((l) => l.stage === "CALL_BOOKED").length;
  const nurtureDue = filterLeadsByFlag("nurture_due", now).length;

  const attention = [
    { code: "uncontacted" as const, label: "Uncontacted", href: "/leads?risk=uncontacted" },
    { code: "first_contact_overdue" as const, label: "First Contact Overdue", href: "/leads?risk=first_contact_overdue" },
    { code: "no_owner" as const, label: "No Owner", href: "/leads?risk=no_owner" },
    { code: "missing_source" as const, label: "Missing Source", href: "/leads?risk=missing_source" },
    { code: "no_next_action" as const, label: "No Next Action", href: "/leads?risk=no_next_action" },
    { code: "follow_up_overdue" as const, label: "Follow-up Overdue", href: "/leads?risk=follow_up_overdue" },
    { code: "stale_stage" as const, label: "Stale Stage", href: "/leads?risk=stale_stage" },
    { code: "no_show_recovery" as const, label: "No-show Recovery", href: "/leads?risk=no_show_recovery" },
    { code: "integration_failure" as const, label: "Integration Failures", href: "/leads?risk=integration_failure" },
    {
      code: "unmatched_source_event" as const,
      label: "Unmatched Source Events",
      href: "/sources",
      count: store
        .getSourceEvents()
        .filter((e) => ["unmatched", "failed"].includes(e.reconciliation_status))
        .length,
    },
  ].map((item) => ({
    ...item,
    count:
      "count" in item && typeof item.count === "number"
        ? item.count
        : filterLeadsByFlag(item.code, now).length,
  }));

  const priorityLeads = [...active]
    .map((lead) => {
      const flags = getLeadFlags(lead, now);
      return {
        lead,
        flags,
        owner: lead.owner_id ? store.getUser(lead.owner_id) : undefined,
        why:
          lead.next_action_note ||
          flags[0]?.reason ||
          (lead.score_band === "P1" ? "Hot lead" : "Needs attention"),
      };
    })
    .sort((a, b) => {
      const severity = (f: typeof a.flags) =>
        f.some((x) => x.severity === "critical") ? 2 : f.length ? 1 : 0;
      return (
        severity(b.flags) - severity(a.flags) || b.lead.score - a.lead.score
      );
    })
    .slice(0, 8);

  const sourceHealth = store
    .getSources()
    .map((s) =>
      summarizeSourceIntegrity(s, store.getSourceEvents(), store.getLeads()),
    )
    .sort((a, b) => b.submissionsReceived - a.submissionsReceived)
    .slice(0, 6);

  return {
    health,
    pipelineHealth: health.score,
    newToday,
    hot,
    needsReply,
    jakeReady,
    callsBooked,
    nurtureDue,
    attention,
    priorityLeads,
    sourceHealth,
  };
}

export function getAnalytics(now = new Date()) {
  const leads = getStore().getLeads();
  const stages = [
    "Leads",
    "Contacted",
    "Connected",
    "Qualified",
    "Jake Ready",
    "Calls Booked",
    "Calls Held",
    "Enrollment Pending",
    "Won",
  ] as const;

  const counts = {
    Leads: leads.length,
    Contacted: leads.filter((l) => Boolean(l.first_contact_at)).length,
    Connected: leads.filter((l) =>
      [
        "CONNECTED",
        "QUALIFIED",
        "JAKE_READY",
        "CALL_BOOKED",
        "CALL_HELD",
        "ENROLLMENT_PENDING",
        "WON",
      ].includes(l.stage),
    ).length,
    Qualified: leads.filter((l) =>
      [
        "QUALIFIED",
        "JAKE_READY",
        "CALL_BOOKED",
        "CALL_HELD",
        "ENROLLMENT_PENDING",
        "WON",
      ].includes(l.stage),
    ).length,
    "Jake Ready": leads.filter((l) =>
      [
        "JAKE_READY",
        "CALL_BOOKED",
        "CALL_HELD",
        "ENROLLMENT_PENDING",
        "WON",
      ].includes(l.stage),
    ).length,
    "Calls Booked": leads.filter((l) =>
      ["CALL_BOOKED", "CALL_HELD", "ENROLLMENT_PENDING", "WON"].includes(l.stage),
    ).length,
    "Calls Held": leads.filter((l) =>
      ["CALL_HELD", "ENROLLMENT_PENDING", "WON"].includes(l.stage),
    ).length,
    "Enrollment Pending": leads.filter((l) =>
      ["ENROLLMENT_PENDING", "WON"].includes(l.stage),
    ).length,
    Won: leads.filter((l) => l.stage === "WON").length,
  };

  const funnel = stages.map((label) => ({
    label,
    count: counts[label],
  }));

  const bySource = getStore()
    .getSources()
    .map((s) => summarizeSourceIntegrity(s, getStore().getSourceEvents(), leads))
    .filter((s) => s.submissionsReceived > 0 || s.qualifiedCount > 0)
    .sort((a, b) => b.submissionsReceived - a.submissionsReceived);

  void now;
  return { funnel, bySource, rates: deriveRates(counts) };
}

function deriveRates(counts: Record<string, number>) {
  const safe = (n: number, d: number) => (d === 0 ? 0 : n / d);
  return {
    captureRate: 0.967,
    contactRate: safe(counts.Contacted, counts.Leads),
    qualificationRate: safe(counts.Qualified, counts.Leads),
    bookingRate: safe(counts["Calls Booked"], counts.Leads),
    showRate: safe(counts["Calls Held"], counts["Calls Booked"]),
    winRate: safe(counts.Won, counts.Leads),
  };
}
