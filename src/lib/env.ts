import { z } from "zod";

const envSchema = z.object({
  APP_MODE: z.enum(["demo", "auth"]).default("demo"),
  HUBSPOT_MODE: z.enum(["mock", "live"]).default("mock"),
  DEMO_SESSION_SECRET: z.string().min(16).default("spm-pipeline-demo-dev-secret-change-me"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(""),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
});

export type AppEnv = z.infer<typeof envSchema>;

function readEnv(): AppEnv {
  const parsed = envSchema.safeParse({
    APP_MODE: process.env.APP_MODE ?? "demo",
    HUBSPOT_MODE: process.env.HUBSPOT_MODE ?? "mock",
    DEMO_SESSION_SECRET: process.env.DEMO_SESSION_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }

  const env = parsed.data;

  if (env.HUBSPOT_MODE === "live") {
    throw new Error(
      "HUBSPOT_MODE=live is not enabled in this prototype. Use mock mode only.",
    );
  }

  if (env.APP_MODE === "auth") {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error(
        "APP_MODE=auth requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
    }
  }

  return env;
}

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cached) cached = readEnv();
  return cached;
}

export function isDemoMode(): boolean {
  return getEnv().APP_MODE === "demo";
}
