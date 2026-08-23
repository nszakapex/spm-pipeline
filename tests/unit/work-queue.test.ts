import { describe, expect, it } from "vitest";
import { getDemoDataset } from "@/lib/demo/seed";
import { resetRuntimeStore } from "@/lib/db/store";
import {
  getNurtureQueues,
  getPrimaryWorkingReason,
  getWorkNextQueue,
  WORKING_REASON_LABEL,
} from "@/lib/nurture/work-queue";
import { evaluateLeadRisks } from "@/lib/nurture/flags";

describe("work next and nurture de-dupe", () => {
  it("returns at most ten unique leads", () => {
    resetRuntimeStore();
    const queue = getWorkNextQueue(new Date(), 10);
    const ids = queue.map((item) => item.lead.id);
    expect(ids).toHaveLength(new Set(ids).size);
    expect(queue.length).toBeLessThanOrEqual(10);
  });

  it("puts Sarah Thompson in Needs reply once, with overdue as a flag", () => {
    resetRuntimeStore();
    const ds = getDemoDataset();
    const sarah = ds.leads.find(
      (l) => l.first_name === "Sarah" && l.last_name === "Thompson",
    );
    expect(sarah).toBeTruthy();
    const flags = evaluateLeadRisks(
      sarah!,
      ds.activities.filter((a) => a.lead_id === sarah!.id),
    );
    const primary = getPrimaryWorkingReason(sarah!, flags, new Date());
    expect(primary).toBe("needs_reply");

    const sections = getNurtureQueues();
    const appearances = sections.flatMap((section) =>
      section.leads
        .filter((item) => item.lead.id === sarah!.id)
        .map((item) => section.key),
    );
    expect(appearances).toEqual(["needs_reply"]);

    const row = sections
      .find((section) => section.key === "needs_reply")
      ?.leads.find((item) => item.lead.id === sarah!.id);
    expect(row?.secondary).toContain("overdue");
  });

  it("never repeats a lead across nurture sections", () => {
    resetRuntimeStore();
    const ids = getNurtureQueues().flatMap((section) =>
      section.leads.map((item) => item.lead.id),
    );
    expect(ids).toHaveLength(new Set(ids).size);
  });

  it("keeps the sales working-order labels", () => {
    expect(WORKING_REASON_LABEL.needs_reply).toBe("Needs reply");
    expect(WORKING_REASON_LABEL.overdue).toBe("Overdue");
    expect(WORKING_REASON_LABEL.due_today).toBe("Due today");
    expect(WORKING_REASON_LABEL.long_term).toBe("Long-term nurture");
  });
});
