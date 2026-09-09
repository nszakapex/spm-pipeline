import { describe, expect, it } from "vitest";
import { heatLevelFromBand, scoreHeatFilled } from "@/components/leads/score-mark";

describe("score heat mark", () => {
  it("shows three levels and hides P3 vs P4 as the same cool mark", () => {
    expect(heatLevelFromBand("P1")).toBe("hot");
    expect(heatLevelFromBand("P2")).toBe("high");
    expect(heatLevelFromBand("P3")).toBe("cool");
    expect(heatLevelFromBand("P4")).toBe("cool");
    expect(scoreHeatFilled("P1")).toBe(3);
    expect(scoreHeatFilled("P2")).toBe(2);
    expect(scoreHeatFilled("P3")).toBe(1);
    expect(scoreHeatFilled("P4")).toBe(1);
  });
});
