import { createHmac, timingSafeEqual } from "crypto";

export const HUBSPOT_SIGNATURE_HEADER = "x-hubspot-signature-v3";
export const HUBSPOT_TIMESTAMP_HEADER = "x-hubspot-request-timestamp";
const MAX_SKEW_MS = 5 * 60 * 1000;

const URI_DECODE: Array<[string, string]> = [
  ["%3A", ":"],
  ["%2F", "/"],
  ["%3F", "?"],
  ["%40", "@"],
  ["%21", "!"],
  ["%24", "$"],
  ["%27", "'"],
  ["%28", "("],
  ["%29", ")"],
  ["%2A", "*"],
  ["%2C", ","],
  ["%3B", ";"],
];

export function decodeHubSpotRequestUri(uri: string): string {
  let decoded = uri;
  for (const [encoded, value] of URI_DECODE) {
    decoded = decoded.split(encoded).join(value);
    decoded = decoded.split(encoded.toLowerCase()).join(value);
  }
  return decoded;
}

export function publicRequestUri(request: Request): string {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host") ??
    url.host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    url.protocol.replace(":", "");
  return decodeHubSpotRequestUri(`${proto}://${host}${url.pathname}${url.search}`);
}

export function signHubSpotWebhookV3(input: {
  method: string;
  uri: string;
  rawBody: string;
  timestamp: string;
  clientSecret: string;
}): string {
  const base = `${input.method}${input.uri}${input.rawBody}${input.timestamp}`;
  return createHmac("sha256", input.clientSecret).update(base, "utf8").digest("base64");
}

export type HubSpotVerifyResult =
  | { ok: true }
  | { ok: false; error: string };

export function verifyHubSpotWebhookV3(input: {
  method: string;
  uri: string;
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  clientSecret: string;
  nowMs?: number;
}): HubSpotVerifyResult {
  const signature = input.signature?.trim() ?? "";
  const timestamp = input.timestamp?.trim() ?? "";
  if (!signature || !timestamp) {
    return { ok: false, error: "Missing HubSpot v3 signature or timestamp" };
  }
  if (!/^\d+$/.test(timestamp)) {
    return { ok: false, error: "Invalid HubSpot timestamp" };
  }
  const ts = Number(timestamp);
  const now = input.nowMs ?? Date.now();
  if (Math.abs(now - ts) > MAX_SKEW_MS) {
    return { ok: false, error: "HubSpot timestamp outside allowed skew" };
  }

  const expected = signHubSpotWebhookV3({
    method: input.method.toUpperCase(),
    uri: decodeHubSpotRequestUri(input.uri),
    rawBody: input.rawBody,
    timestamp,
    clientSecret: input.clientSecret,
  });

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "Invalid HubSpot webhook signature" };
    }
  } catch {
    return { ok: false, error: "Invalid HubSpot webhook signature" };
  }
  return { ok: true };
}
