import { describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/lib/env";

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from() {
      return {
        select: () => Promise.reject(new Error("supabase down")),
        upsert: () => Promise.reject(new Error("supabase down")),
      };
    },
  }),
}));

describe("persist hydrate fail-soft", () => {
  it("returns false instead of throwing when persist queries fail", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-not-for-network";
    resetEnvCache();
    const { hydrateStoreFromSupabase } = await import("@/lib/db/supabase-persist");
    await expect(hydrateStoreFromSupabase()).resolves.toBe(false);
  });

  it("lets Home hydrate finish when persist and the activity cookie both fail", async () => {
    const persist = await import("@/lib/db/supabase-persist");
    const activity = await import("@/lib/db/activity-persist");
    vi.spyOn(persist, "hydrateStoreFromSupabase").mockRejectedValue(new Error("persist down"));
    vi.spyOn(activity, "hydratePersistedActivities").mockRejectedValue(new Error("cookie down"));
    const { hydratePipelineForRequest } = await import("@/lib/db/hydrate-pipeline");
    await expect(hydratePipelineForRequest()).resolves.toBeUndefined();
  });
});
