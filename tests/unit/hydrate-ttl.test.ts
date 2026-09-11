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
          return Promise.resolve({ data: [], error: null });
        },
        upsert: () => Promise.resolve({ error: null }),
      };
    },
  }),
}));

describe("persist hydrate TTL", () => {
  afterEach(() => {
    resetRuntimeStore();
    resetHydrateClock();
    resetEnvCache();
    select.mockClear();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("skips supabase selects when a successful hydrate is still fresh", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-not-for-network";
    resetEnvCache();
    const { hydrateStoreFromSupabase } = await import("@/lib/db/supabase-persist");

    await expect(hydrateStoreFromSupabase()).resolves.toBe(true);
    const first = select.mock.calls.length;
    expect(first).toBeGreaterThan(0);
    expect(isHydrateFresh()).toBe(true);

    await expect(hydrateStoreFromSupabase()).resolves.toBe(true);
    expect(select.mock.calls.length).toBe(first);
  });
});
