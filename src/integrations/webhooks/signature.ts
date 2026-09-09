import { createHmac, timingSafeEqual } from "crypto";
import { getEnv } from "@/lib/env";

export const WEBHOOK_SIGNATURE_HEADER = "x-spm-webhook-signature";
export const WEBHOOK_TIMESTAMP_HEADER = "x-spm-webhook-timestamp";
export const WEBHOOK_MAX_SKEW_SECONDS = 5 * 60;
const KEY_CONTEXT = "spm-pipeline-webhook-v1";

/** Separate HMAC key from the demo session cookie so a stolen cookie cannot sign webhooks. */
export function deriveWebhookSigningKey(sessionSecret: string): Buffer {
  return createHmac("sha256", sessionSecret).update(KEY_CONTEXT).digest();
}

export function signSpmWebhook(
  rawBody: string,
  timestamp: string,
  sessionSecret: string = getEnv().DEMO_SESSION_SECRET,
): string {
  const key = deriveWebhookSigningKey(sessionSecret);
  const hex = createHmac("sha256", key).update(`${timestamp}.${rawBody}`).digest("hex");
  return `sha256=${hex}`;
}

export type WebhookVerifyResult =
  | { ok: true; timestamp: string }
  | { ok: false; error: string };

export function verifySpmWebhookSignature(input: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  sessionSecret?: string;
  nowSeconds?: number;
}): WebhookVerifyResult {
  const signature = input.signature?.trim() ?? "";
  const timestamp = input.timestamp?.trim() ?? "";
  if (!signature || !timestamp) {
    return { ok: false, error: "Missing webhook signature or timestamp" };
  }
  if (!/^\d+$/.test(timestamp)) {
    return { ok: false, error: "Invalid webhook timestamp" };
  }

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ts = Number(timestamp);
  if (Math.abs(now - ts) > WEBHOOK_MAX_SKEW_SECONDS) {
    return { ok: false, error: "Webhook timestamp outside allowed skew" };
  }

  const expected = signSpmWebhook(
    input.rawBody,
    timestamp,
    input.sessionSecret ?? getEnv().DEMO_SESSION_SECRET,
  );

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "Invalid webhook signature" };
    }
  } catch {
    return { ok: false, error: "Invalid webhook signature" };
  }

  return { ok: true, timestamp };
}

export function webhookTimestampNow(nowMs: number = Date.now()): string {
  return String(Math.floor(nowMs / 1000));
}
