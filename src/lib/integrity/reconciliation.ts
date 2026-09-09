import type { Lead, LeadSourceEvent, SourceDefinition } from "@/types/domain";
import { TERMINAL_STAGES } from "@/types/domain";
import { evaluateLeadRisks, evaluateUnmatchedSourceEvent } from "@/lib/nurture/flags";
import type { Activity } from "@/types/domain";

export interface SourceIntegritySummary {
  sourceDefinitionId: string;
  sourceName: string;
  category: string;
  submissionsReceived: number;
  accountedFor: number;
  unmatched: number;
  syncFailures: number;
  duplicates: number;
  captureRate: number;
  qualifiedCount: number;
  meetingCount: number;
  wonCount: number;
  qualifiedRate: number;
  meetingRate: number;
  wonRate: number;
  lastEventAt: string | null;
  health: "healthy" | "warning" | "critical";
  missingCount: number;
}

export function summarizeSourceIntegrity(
  definition: SourceDefinition,
  events: LeadSourceEvent[],
  leads: Lead[],
): SourceIntegritySummary {
  const sourceEvents = events.filter(
    (e) =>
      e.source_definition_id === definition.id ||
      e.source_name === definition.name,
  );
  const submissionsReceived = sourceEvents.length;
  const unmatched = sourceEvents.filter((e) =>
    ["unmatched", "failed", "pending"].includes(e.reconciliation_status),
  ).length;
  const syncFailures = sourceEvents.filter(
    (e) => e.reconciliation_status === "failed",
  ).length;
  const duplicates = sourceEvents.filter(
    (e) => e.reconciliation_status === "duplicate",
  ).length;
  const accountedFor = sourceEvents.filter((e) =>
    ["matched", "created", "duplicate", "ignored"].includes(e.reconciliation_status),
  ).length;
  const missingCount = Math.max(submissionsReceived - accountedFor, 0);

  const relatedLeads = leads.filter(
    (l) =>
      l.source_definition_id === definition.id || l.source === definition.name,
  );
  const qualifiedCount = relatedLeads.filter(
    (l) =>
      l.qualification_status === "qualified" ||
      [
        "QUALIFIED",
        "JAKE_READY",
        "CALL_BOOKED",
        "CALL_HELD",
        "ENROLLMENT_PENDING",
        "WON",
      ].includes(l.stage),
  ).length;
  const meetingCount = relatedLeads.filter((l) =>
    ["CALL_BOOKED", "CALL_HELD", "ENROLLMENT_PENDING", "WON"].includes(l.stage),
  ).length;
  const wonCount = relatedLeads.filter((l) => l.stage === "WON").length;

  const captureRate =
    submissionsReceived === 0 ? 1 : accountedFor / submissionsReceived;
  const qualifiedRate =
    relatedLeads.length === 0 ? 0 : qualifiedCount / relatedLeads.length;
  const meetingRate =
    relatedLeads.length === 0 ? 0 : meetingCount / relatedLeads.length;
  const wonRate = relatedLeads.length === 0 ? 0 : wonCount / relatedLeads.length;

  const lastEventAt =
    sourceEvents
      .map((e) => e.received_at)
      .sort()
      .at(-1) ?? null;

  let health: "healthy" | "warning" | "critical" = "healthy";
  if (missingCount > 0 || syncFailures > 0) health = "critical";
  else if (captureRate < 0.98 || duplicates > 0) health = "warning";

  return {
    sourceDefinitionId: definition.id,
    sourceName: definition.name,
    category: definition.category,
    submissionsReceived,
    accountedFor,
    unmatched,
    syncFailures,
    duplicates,
    captureRate,
    qualifiedCount,
    meetingCount,
    wonCount,
    qualifiedRate,
    meetingRate,
    wonRate,
    lastEventAt,
    health,
    missingCount,
  };
}

export function findUnmatchedEvents(events: LeadSourceEvent[]): LeadSourceEvent[] {
  return events.filter((e) =>
    ["unmatched", "failed"].includes(e.reconciliation_status),
  );
}

export interface PipelineHealthBreakdown {
  score: number;
  activeCount: number;
  violationWeight: number;
  maxWeight: number;
  components: Array<{
    key: string;
    label: string;
    weight: number;
    violations: number;
    contribution: number;
  }>;
}

/**
 * Pipeline Health % = 100 - weighted violation share across active leads + source integrity.
 *
 * Weights (sum of lead-side weights = 100 contribution basis, plus source reconciliation):
 * - missing source attribution: 20
 * - no owner: 20
 * - no next action: 20
 * - first-contact SLA breach: 15
 * - stale stage: 10
 * - integration failure: 10
 * - unmatched/failed source events: 5 (global, relative to recent events)
 */
export function calculatePipelineHealth(
  leads: Lead[],
  activitiesByLead: Map<string, Activity[]>,
  sourceEvents: LeadSourceEvent[],
  now: Date = new Date(),
): PipelineHealthBreakdown {
  const active = leads.filter((l) => !TERMINAL_STAGES.includes(l.stage));
  const components = [
    { key: "missing_source", label: "Source attribution", weight: 20, violations: 0 },
    { key: "no_owner", label: "Owner assigned", weight: 20, violations: 0 },
    { key: "no_next_action", label: "Next action set", weight: 20, violations: 0 },
    { key: "first_contact_overdue", label: "First-contact SLA", weight: 15, violations: 0 },
    { key: "stale_stage", label: "Stage freshness", weight: 10, violations: 0 },
    { key: "integration_failure", label: "Integration health", weight: 10, violations: 0 },
  ] as Array<{
    key: string;
    label: string;
    weight: number;
    violations: number;
    contribution?: number;
  }>;

  for (const lead of active) {
    const flags = evaluateLeadRisks(
      lead,
      activitiesByLead.get(lead.id) ?? [],
      now,
    );
    for (const c of components) {
      if (flags.some((f) => f.code === c.key)) c.violations += 1;
    }
  }

  const denom = Math.max(active.length, 1);
  let violationWeight = 0;
  const detailed = components.map((c) => {
    const rate = c.violations / denom;
    const contribution = rate * c.weight;
    violationWeight += contribution;
    return { ...c, contribution };
  });

  const recentEvents = sourceEvents.filter((e) => {
    const ageHours =
      (now.getTime() - new Date(e.received_at).getTime()) / (1000 * 60 * 60);
    return ageHours <= 24 * 14;
  });
  const unmatched = recentEvents.filter(
    (e) => evaluateUnmatchedSourceEvent(e, now) !== null,
  ).length;
  const sourceRate =
    recentEvents.length === 0 ? 0 : unmatched / recentEvents.length;
  const sourceContribution = sourceRate * 5;
  violationWeight += sourceContribution;
  detailed.push({
    key: "unmatched_source_event",
    label: "Source reconciliation",
    weight: 5,
    violations: unmatched,
    contribution: sourceContribution,
  });

  const score = Math.max(0, Math.round(100 - violationWeight));

  return {
    score,
    activeCount: active.length,
    violationWeight,
    maxWeight: 105,
    components: detailed.map((c) => ({
      key: c.key,
      label: c.label,
      weight: c.weight,
      violations: c.violations,
      contribution: c.contribution ?? 0,
    })),
  };
}
