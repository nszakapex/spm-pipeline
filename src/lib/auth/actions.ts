"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_MAX_AGE_SECONDS,
  createDemoSessionToken,
} from "@/lib/auth/session";
import { isDemoMode, shouldUseSecureCookies } from "@/lib/env";
import { getStore } from "@/lib/db/store";

async function resolveSecureFlag(): Promise<boolean> {
  const h = await headers();
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    h.get("x-forwarded-protocol")?.split(",")[0]?.trim() ??
    null;
  return shouldUseSecureCookies(proto);
}

export async function demoLoginAction(formData: FormData) {
  if (!isDemoMode()) {
    throw new Error("Demo login is only available when APP_MODE=demo");
  }
  const userId = String(formData.get("userId") ?? "");
  const user = getStore().getUser(userId);
  if (!user) {
    throw new Error("Unknown demo user");
  }
  const token = createDemoSessionToken(user.id);
  const secure = await resolveSecureFlag();
  const jar = await cookies();
  jar.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  const secure = await resolveSecureFlag();
  const jar = await cookies();
  jar.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  redirect("/login");
}
