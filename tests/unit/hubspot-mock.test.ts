import { describe, expect, it } from "vitest";
import { syncLeadToHubSpot, getHubSpotFailureSummary } from "@/integrations/hubspot/sync";
import { resetDemoDatasetCache, getDemoDataset } from "@/lib/demo/seed";

describe("HubSpot mock integration", () => {
  it("returns failed sync for seeded failure lead", async () => {
    resetDemoDatasetCache();
    const result = await syncLeadToHubSpot("lead_005");
    expect(result.ok).toBe(false);
    expect(result.status).toBe("failed");
  });

  it("returns success for healthy lead", async () => {
    resetDemoDatasetCache();
    const healthy = getDemoDataset().leads.find((l) => l.sync_status === "synced");
    expect(healthy).toBeTruthy();
    const result = await syncLeadToHubSpot(healthy!.id);
    expect(result.ok).toBe(true);
    expect(["success", "stale"]).toContain(result.status);
  });

  it("lists mock failures and unmatched records", async () => {
    resetDemoDatasetCache();
    const summary = await getHubSpotFailureSummary();
    expect(summary.mode).toBe("mock");
    expect(summary.failures.length).toBeGreaterThan(0);
    expect(summary.unmatchedCount).toBeGreaterThan(0);
  });
});
