import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEMO_SESSION_MAX_AGE_SECONDS } from "@/lib/auth/demo-token";
import { getEnv, shouldUseSecureCookies } from "@/lib/env";
import {
  ACTIVITY_COOKIE,
  decodeActivityCookie,
  encodeActivityCookie,
  replayPersistedActivities,
  type PersistedManualActivity,
} from "@/lib/db/activity-cookie";

async function resolveSecureFlag(): Promise<boolean> {
  const h = await headers();
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    h.get("x-forwarded-protocol")?.split(",")[0]?.trim() ??
    null;
  return shouldUseSecureCookies(proto);
}

function cookieOptions(secure: boolean, maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge,
  };
}

export const hydratePersistedActivities = cache(async function hydratePersistedActivities() {
  const jar = await cookies();
  const token = jar.get(ACTIVITY_COOKIE)?.value;
  if (!token) return;
  const events = decodeActivityCookie(token, getEnv().DEMO_SESSION_SECRET);
  if (!events?.length) return;
  replayPersistedActivities(events);
});

export async function appendPersistedActivity(event: PersistedManualActivity): Promise<void> {
  const jar = await cookies();
  const existing =
    decodeActivityCookie(jar.get(ACTIVITY_COOKIE)?.value ?? "", getEnv().DEMO_SESSION_SECRET) ??
    [];
  const next = [
    ...existing.filter(
      (item) => !(item.leadId === event.leadId && item.kind === event.kind && item.at === event.at),
    ),
    event,
  ];
  const secure = await resolveSecureFlag();
  jar.set(
    ACTIVITY_COOKIE,
    encodeActivityCookie(next, getEnv().DEMO_SESSION_SECRET),
    cookieOptions(secure, DEMO_SESSION_MAX_AGE_SECONDS),
  );
}

export async function clearPersistedActivities(): Promise<void> {
  const jar = await cookies();
  const secure = await resolveSecureFlag();
  jar.set(ACTIVITY_COOKIE, "", cookieOptions(secure, 0));
}
