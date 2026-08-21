import { cookies } from "next/headers";
import { getEnv, isDemoMode } from "@/lib/env";
import { getStore } from "@/lib/db/store";
import type { AppUser } from "@/types/domain";
import {
  DEMO_SESSION_COOKIE,
  createDemoSessionToken as createToken,
  verifyDemoSessionToken as verifyToken,
} from "@/lib/auth/demo-token";

export {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/demo-token";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AppUser["role"];
  mode: "demo";
}

export function createDemoSessionToken(userId: string): string {
  return createToken(userId, getEnv().DEMO_SESSION_SECRET);
}

export function verifyDemoSessionToken(token: string): string | null {
  return verifyToken(token, getEnv().DEMO_SESSION_SECRET);
}

/**
 * Verified session lookup — the authorization source of truth for app routes.
 * Demo mode only. APP_MODE=auth fails at getEnv().
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Ensures APP_MODE=auth / live HubSpot are rejected before any auth path runs.
  if (!isDemoMode()) return null;

  const jar = await cookies();
  const token = jar.get(DEMO_SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = verifyDemoSessionToken(token);
  if (!userId) return null;

  const user = getStore().getUser(userId);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mode: "demo",
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export const DEMO_LOGIN_OPTIONS = [
  {
    id: "user_001",
    label: "Maya Chen (Sales)",
    email: "maya.chen@example.spm-pipeline.local",
  },
  {
    id: "user_002",
    label: "Jordan Blake (Sales)",
    email: "jordan.blake@example.spm-pipeline.local",
  },
  {
    id: "user_003",
    label: "Priya Nair (Admin)",
    email: "priya.nair@example.spm-pipeline.local",
  },
] as const;
