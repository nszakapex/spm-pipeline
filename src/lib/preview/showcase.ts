import { getDemoDataset } from "@/lib/demo/seed";
import { evaluateLeadRisks } from "@/lib/nurture/flags";
import {
  getPrimaryWorkingReason,
  getSecondaryReasons,
  WORKING_REASON_LABEL,
  WORKING_REASON_PRIORITY,
  type WorkQueueItem,
} from "@/lib/nurture/work-queue";
import { calculatePipelineHealth } from "@/lib/integrity/reconciliation";
import { OPEN_STAGES, TERMINAL_STAGES, type Activity, type Lead } from "@/types/domain";

function activitiesByLead(activities: Activity[]): Map<string, Activity[]> {
  const map = new Map<string, Activity[]>();
  for (const activity of activities) {
    const list = map.get(activity.lead_id);
    if (list) list.push(activity);
    else map.set(activity.lead_id, [activity]);
  }
  return map;
}

function toItem(
  lead: Lead,
  now: Date,
  map: Map<string, Activity[]>,
): WorkQueueItem {
  const flags = evaluateLeadRisks(lead, map.get(lead.id) ?? [], now);
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

function compareItems(a: WorkQueueItem, b: WorkQueueItem): number {
  const byReason =
    WORKING_REASON_PRIORITY.indexOf(a.primary) -
    WORKING_REASON_PRIORITY.indexOf(b.primary);
  if (byReason !== 0) return byReason;
  const critA = a.flags.filter((flag) => flag.severity === "critical").length;
  const critB = b.flags.filter((flag) => flag.severity === "critical").length;
  if (critB !== critA) return critB - critA;
  return (Number(b.lead.score) || 0) - (Number(a.lead.score) || 0);
}

/** Seed-only board for the public hiring-manager preview. Ignores persist overlay. */
export function getPreviewShowcase(now = new Date()) {
  const ds = getDemoDataset();
  const map = activitiesByLead(ds.activities);
  const open = ds.leads.filter(
    (lead) => Boolean(lead?.id && lead.stage) && !TERMINAL_STAGES.includes(lead.stage),
  );
  const items = open.map((lead) => toItem(lead, now, map)).sort(compareItems);
  const health = calculatePipelineHealth(ds.leads, map, ds.sourceEvents, now);
  const hot = ds.leads.filter((lead) => lead.score_band === "P1").length;

  return {
    workNext: items.slice(0, 6),
    leadCount: ds.leads.length,
    openCount: open.length,
    hotCount: hot,
    pipelineHealth: health.score,
    stages: OPEN_STAGES.map((stage) => ({
      stage,
      count: open.filter((lead) => lead.stage === stage).length,
    })).filter((row) => row.count > 0),
  };
}
