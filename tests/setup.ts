import { beforeEach } from "vitest";
import { resetEnvCache, TEST_ONLY_DEMO_SESSION_SECRET } from "@/lib/env";
import { resetRuntimeStore } from "@/lib/db/store";

process.env.APP_MODE = "demo";
process.env.HUBSPOT_MODE = "mock";
process.env.DEMO_SESSION_SECRET = TEST_ONLY_DEMO_SESSION_SECRET;
process.env.VITEST = "true";

beforeEach(() => {
  process.env.APP_MODE = "demo";
  process.env.HUBSPOT_MODE = "mock";
  process.env.DEMO_SESSION_SECRET = TEST_ONLY_DEMO_SESSION_SECRET;
  delete process.env.VERCEL;
  resetEnvCache();
  resetRuntimeStore();
});
