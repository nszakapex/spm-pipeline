import { afterEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "@/lib/env";
import { isHydrateFresh, resetHydrateClock } from "@/lib/db/hydrate-clock";
import { resetRuntimeStore } from "@/lib/db/store";

const select = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from() {
      return {
        select: () => {
          select();
          return Promise.resolve({ data: null, error: { message: "down" } });
        },
        upsert: () => Promise.resolve({ error: null }),
      };
    },
  }),
}));

describe("persist hydrate TTL on failure", () => {
  afterEach(() => {
    resetRuntimeStore();
    resetHydrateClock();
    resetEnvCache();
    select.mockClear();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("does not treat a failed hydrate as fresh", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-not-for-network";
    resetEnvCache();
    const { hydrateStoreFromSupabase } = await import("@/lib/db/supabase-persist");

    await expect(hydrateStoreFromSupabase()).resolves.toBe(false);
    expect(isHydrateFresh()).toBe(false);
    const first = select.mock.calls.length;
    expect(first).toBeGreaterThan(0);

    await expect(hydrateStoreFromSupabase()).resolves.toBe(false);
    expect(select.mock.calls.length).toBeGreaterThan(first);
  });
});
