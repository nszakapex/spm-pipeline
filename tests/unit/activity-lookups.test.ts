import { describe, expect, it } from "vitest";
import { getActivitiesByLeadMap } from "@/lib/db/lookups";
import { resetRuntimeStore } from "@/lib/db/store";
import { logManualLeadActivity } from "@/lib/pipeline/log-activity";
import { getDemoDataset } from "@/lib/demo/seed";

describe("activity lookup cache", () => {
  it("reuses the same map until the overlay changes", () => {
    resetRuntimeStore();
    const first = getActivitiesByLeadMap();
    const second = getActivitiesByLeadMap();
    expect(second).toBe(first);

    const sarah = getDemoDataset().leads.find(
      (lead) => lead.first_name === "Sarah" && lead.last_name === "Thompson",
    );
    expect(sarah).toBeTruthy();
    logManualLeadActivity({
      leadId: sarah!.id,
      actorId: "user_001",
      kind: "call",
      outcome: "voicemail",
      recap: "Left a note",
      occurredAt: "2026-09-11T15:00:00.000Z",
    });

    const third = getActivitiesByLeadMap();
    expect(third).not.toBe(first);
    expect((third.get(sarah!.id) ?? []).length).toBeGreaterThan(
      (first.get(sarah!.id) ?? []).length,
    );
  });
});
