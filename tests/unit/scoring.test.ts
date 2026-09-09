import { describe, expect, it } from "vitest";
import { scoreLead, scoreBandLabel } from "@/lib/scoring/score-lead";

describe("lead scoring", () => {
  it("produces explainable hot score for high-intent referral", () => {
    const result = scoreLead({
      requestedStrategyCall: true,
      repliedToday: true,
      jakeReferral: true,
      lookingToStartSoon: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      multipleEngagements: true,
      activelySeekingMentorship: true,
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.band).toBe("P1");
    expect(result.factors.length).toBeGreaterThan(3);
    expect(result.factors.every((f) => f.label && typeof f.points === "number")).toBe(
      true,
    );
    expect(result.categoryTotals.intent).toBeLessThanOrEqual(40);
    expect(result.categoryTotals.engagement).toBeLessThanOrEqual(30);
    expect(result.categoryTotals.readiness).toBeLessThanOrEqual(20);
    expect(result.categoryTotals.source_quality).toBeLessThanOrEqual(10);
  });

  it("applies negative adjustments and clamps at 0", () => {
    const result = scoreLead({
      explicitLackOfInterest: true,
      invalidContactInfo: true,
      repeatedNoResponseCount: 3,
    });
    expect(result.score).toBe(0);
    expect(result.band).toBe("P4");
    expect(scoreBandLabel(result.band)).toContain("Low");
  });

  it("maps score bands correctly", () => {
    expect(scoreLead({ requestedStrategyCall: true, completeContactInfo: true }).band).toMatch(
      /P[1-4]/,
    );
  });
});
