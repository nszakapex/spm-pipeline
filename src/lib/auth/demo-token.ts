import { createHmac, timingSafeEqual } from "crypto";

export const DEMO_SESSION_COOKIE = "spm_demo_session";
export const DEMO_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
/** Allow small clock skew for token issuance; reject farther-future timestamps. */
export const DEMO_SESSION_FUTURE_SKEW_MS = 5 * 60 * 1000;

export function signDemoPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createDemoSessionToken(
  userId: string,
  secret: string,
  nowMs: number = Date.now(),
): string {
  const payload = `${userId}.${nowMs}`;
  return `${payload}.${signDemoPayload(payload, secret)}`;
}

/**
 * Verify an HMAC-signed demo session token.
 * Rejects malformed, tampered, expired, and unreasonably future-dated tokens.
 */
export function verifyDemoSessionToken(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  if (!userId || !ts || !sig) return null;
  if (!/^\d+$/.test(ts)) return null;

  const payload = `${userId}.${ts}`;
  const expected = signDemoPayload(payload, secret);

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const issuedAt = Number(ts);
  if (!Number.isFinite(issuedAt)) return null;

  if (issuedAt - nowMs > DEMO_SESSION_FUTURE_SKEW_MS) return null;

  const ageMs = nowMs - issuedAt;
  if (ageMs > DEMO_SESSION_MAX_AGE_SECONDS * 1000) return null;

  return userId;
}
