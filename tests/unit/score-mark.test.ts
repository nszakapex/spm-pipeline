import { describe, expect, it } from "vitest";
import { scoreHeatFilled } from "@/components/leads/score-mark";

describe("score heat mark", () => {
  it("fills more ticks as the band gets hotter", () => {
    expect(scoreHeatFilled("P4")).toBe(1);
    expect(scoreHeatFilled("P3")).toBe(2);
    expect(scoreHeatFilled("P2")).toBe(3);
    expect(scoreHeatFilled("P1")).toBe(4);
  });
});
