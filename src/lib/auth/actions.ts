"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEMO_SESSION_COOKIE,
  createDemoSessionToken,
} from "@/lib/auth/session";
import { getEnv, isDemoMode } from "@/lib/env";
import { getStore } from "@/lib/db/store";

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
  const jar = await cookies();
  jar.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().NEXT_PUBLIC_APP_URL.startsWith("https"),
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(DEMO_SESSION_COOKIE);
  if (!isDemoMode()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  redirect("/login");
}
