import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { getEnv, isDemoMode } from "@/lib/env";
import { getStore } from "@/lib/db/store";
import type { AppUser } from "@/types/domain";

export const DEMO_SESSION_COOKIE = "spm_demo_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AppUser["role"];
  mode: "demo" | "auth";
}

function sign(value: string): string {
  const secret = getEnv().DEMO_SESSION_SECRET;
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createDemoSessionToken(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyDemoSessionToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  if (!userId || !ts || !sig) return null;
  const payload = `${userId}.${ts}`;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const ageMs = Date.now() - Number(ts);
  if (!Number.isFinite(ageMs) || ageMs > 1000 * 60 * 60 * 24 * 14) return null;
  return userId;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isDemoMode()) {
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

  // Auth mode: Supabase session (wired; requires env). Soft-fail to null if unset.
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const storeUser =
      getStore().getUsers().find((u) => u.email === data.user.email) ?? null;
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      name:
        storeUser?.name ??
        (data.user.user_metadata?.full_name as string | undefined) ??
        data.user.email ??
        "User",
      role: storeUser?.role ?? "sales",
      mode: "auth",
    };
  } catch {
    return null;
  }
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
