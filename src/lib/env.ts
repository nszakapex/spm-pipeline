import { z } from "zod";

/**
 * Environment contract for the demo/mock prototype.
 *
 * Supported deployed combination: APP_MODE=demo + HUBSPOT_MODE=mock.
 * APP_MODE=auth is intentionally unavailable until real Supabase Auth exists.
 * HUBSPOT_MODE=live is rejected.
 *
 * No Supabase variables are part of this contract.
 */

const MIN_SECRET_LENGTH = 32;

/** Deterministic secret for unit tests only — never a deployed fallback. */
export const TEST_ONLY_DEMO_SESSION_SECRET =
  "spm-pipeline-test-only-secret-do-not-deploy-0123456789abcdef";

const envSchema = z.object({
  APP_MODE: z.enum(["demo", "auth"]).default("demo"),
  HUBSPOT_MODE: z.enum(["mock", "live"]).default("mock"),
  DEMO_SESSION_SECRET: z.string().optional(),
});

export type AppEnv = {
  APP_MODE: "demo";
  HUBSPOT_MODE: "mock";
  DEMO_SESSION_SECRET: string;
};

function isTestRuntime(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.VITEST === "true" ||
    process.env.VITEST === "1"
  );
}

function isVercelOrProductionRuntime(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function resolveDemoSessionSecret(raw: string | undefined): string {
  if (isTestRuntime()) {
    const candidate = raw && raw.length >= MIN_SECRET_LENGTH ? raw : TEST_ONLY_DEMO_SESSION_SECRET;
    return candidate;
  }

  if (!raw || raw.trim().length === 0) {
    throw new Error(
      "DEMO_SESSION_SECRET is required. Generate one with: openssl rand -hex 32",
    );
  }

  if (raw.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `DEMO_SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters. Generate one with: openssl rand -hex 32`,
    );
  }

  // Reject the historical checked-in default if someone pastes it into a deploy.
  if (
    raw === "spm-pipeline-demo-dev-secret-change-me" ||
    raw.includes("change-me")
  ) {
    throw new Error(
      "DEMO_SESSION_SECRET must not use the legacy placeholder value. Generate one with: openssl rand -hex 32",
    );
  }

  if (isVercelOrProductionRuntime() && raw === TEST_ONLY_DEMO_SESSION_SECRET) {
    throw new Error(
      "DEMO_SESSION_SECRET must not use the test-only secret in Vercel or production.",
    );
  }

  return raw;
}

function readEnv(): AppEnv {
  const parsed = envSchema.safeParse({
    APP_MODE: process.env.APP_MODE ?? "demo",
    HUBSPOT_MODE: process.env.HUBSPOT_MODE ?? "mock",
    DEMO_SESSION_SECRET: process.env.DEMO_SESSION_SECRET,
  });

  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }

  const raw = parsed.data;

  if (raw.HUBSPOT_MODE === "live") {
    throw new Error(
      "HUBSPOT_MODE=live is not enabled in this prototype. Use HUBSPOT_MODE=mock only.",
    );
  }

  if (raw.APP_MODE === "auth") {
    throw new Error(
      "APP_MODE=auth is unavailable. Supabase Auth login and session refresh are not implemented. Use APP_MODE=demo with HUBSPOT_MODE=mock.",
    );
  }

  const DEMO_SESSION_SECRET = resolveDemoSessionSecret(raw.DEMO_SESSION_SECRET);

  return {
    APP_MODE: "demo",
    HUBSPOT_MODE: "mock",
    DEMO_SESSION_SECRET,
  };
}

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cached) cached = readEnv();
  return cached;
}

/** Clears cached env — for tests only. */
export function resetEnvCache(): void {
  cached = null;
}

export function isDemoMode(): boolean {
  return getEnv().APP_MODE === "demo";
}

/** Prefer Secure cookies on Vercel and HTTPS; allow HTTP localhost. */
export function shouldUseSecureCookies(protocolHint?: string | null): boolean {
  if (process.env.VERCEL === "1") return true;
  if (protocolHint === "https") return true;
  return false;
}
