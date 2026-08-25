import { beforeEach } from "vitest";
import { resetEnvCache, TEST_ONLY_DEMO_SESSION_SECRET } from "@/lib/env";
import { resetRuntimeStore } from "@/lib/db/store";

process.env.APP_MODE = "demo";
process.env.HUBSPOT_MODE = "mock";
process.env.DEMO_SESSION_SECRET = TEST_ONLY_DEMO_SESSION_SECRET;
process.env.VITEST = "true";
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.SUPABASE_SECRET_KEY;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;

beforeEach(() => {
  process.env.APP_MODE = "demo";
  process.env.HUBSPOT_MODE = "mock";
  process.env.DEMO_SESSION_SECRET = TEST_ONLY_DEMO_SESSION_SECRET;
  delete process.env.VERCEL;
  delete process.env.HUBSPOT_CLIENT_SECRET;
  delete process.env.JAKE_MEETINGS_URL;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  resetEnvCache();
  resetRuntimeStore();
});
