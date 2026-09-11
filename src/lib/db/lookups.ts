import { getOverlayRevision } from "@/lib/db/overlay";
import { getStore } from "@/lib/db/store";
import type { Activity } from "@/types/domain";

let cachedRevision = -1;
let activitiesByLead: Map<string, Activity[]> = new Map();

/** One activity map per overlay revision — list pages must not rebuild this per lead. */
export function getActivitiesByLeadMap(): Map<string, Activity[]> {
  const revision = getOverlayRevision();
  if (revision === cachedRevision) return activitiesByLead;

  const next = new Map<string, Activity[]>();
  for (const activity of getStore().getActivities()) {
    const list = next.get(activity.lead_id);
    if (list) list.push(activity);
    else next.set(activity.lead_id, [activity]);
  }
  activitiesByLead = next;
  cachedRevision = revision;
  return activitiesByLead;
}

export function getActivitiesForLead(leadId: string): Activity[] {
  return getActivitiesByLeadMap().get(leadId) ?? [];
}
