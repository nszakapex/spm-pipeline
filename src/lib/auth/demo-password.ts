import { timingSafeEqual } from "crypto";

/** Shared demo password after a profile is chosen. Not a HubSpot or session secret. */
export const DEMO_LOGIN_PASSWORD = "SPMPIPELINE";

export function isValidDemoLoginPassword(candidate: string): boolean {
  const expected = Buffer.from(DEMO_LOGIN_PASSWORD);
  const given = Buffer.from(candidate);
  if (given.length !== expected.length) {
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(given, expected);
}

export function resolveDemoLogin(input: {
  userId: string;
  password: string;
}): { ok: true; userId: string } | { ok: false; reason: "unknown-user" | "bad-password" } {
  if (!input.userId) return { ok: false, reason: "unknown-user" };
  if (!isValidDemoLoginPassword(input.password)) {
    return { ok: false, reason: "bad-password" };
  }
  return { ok: true, userId: input.userId };
}
