import { getStore } from "@/lib/db/store";
import { evaluateLeadRisks, type RiskFlagCode } from "@/lib/nurture/flags";
import {
  calculatePipelineHealth,
  summarizeSourceIntegrity,
} from "@/lib/integrity/reconciliation";
import { getWorkNextQueue } from "@/lib/nurture/work-queue";
import type { Activity, Lead } from "@/types/domain";

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

  const unmatchedSourceEvents = store
    .getSourceEvents()
    .filter((e) => ["unmatched", "failed"].includes(e.reconciliation_status)).length;

  return {
    health,
    pipelineHealth: health.score,
    unmatchedSourceEvents,
    workNext: getWorkNextQueue(now, 10),
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
