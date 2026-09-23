import { describe, expect, it } from "vitest";
import { resetRuntimeStore } from "@/lib/db/store";
import { getPreviewShowcase } from "@/lib/preview/showcase";

describe("hiring manager preview showcase", () => {
  it("shows Sarah Thompson on the seed work list without touching persist", () => {
    resetRuntimeStore();
    const board = getPreviewShowcase(new Date("2026-09-11T16:00:00.000Z"));
    expect(board.workNext.length).toBeGreaterThan(0);
    expect(board.leadCount).toBeGreaterThan(board.openCount);
    const sarah = board.workNext.find(
      (item) => item.lead.first_name === "Sarah" && item.lead.last_name === "Thompson",
    );
    expect(sarah).toBeTruthy();
    expect(sarah?.primary).toBe("needs_reply");
  });
});
