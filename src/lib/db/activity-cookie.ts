import { timingSafeEqual } from "crypto";
import { signDemoPayload } from "@/lib/auth/demo-token";
import type { CallOutcome } from "@/integrations/webhooks/types";
import {
  logManualLeadActivity,
  type ManualActivityKind,
} from "@/lib/pipeline/log-activity";

export const ACTIVITY_COOKIE = "spm_activity";
export const ACTIVITY_COOKIE_MAX_EVENTS = 16;
export const ACTIVITY_COOKIE_MAX_RECAP = 180;

const KINDS: ManualActivityKind[] = [
  "call",
  "inbound_reply",
  "outbound_email",
  "outbound_sms",
];

const OUTCOMES: CallOutcome[] = [
  "connected",
  "voicemail",
  "no_answer",
  "busy",
  "wrong_number",
  "held",
  "no_show",
];

export interface PersistedManualActivity {
  leadId: string;
  actorId: string;
  kind: ManualActivityKind;
  outcome?: CallOutcome;
  recap?: string;
  at: string;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function sanitizeEvent(value: unknown): PersistedManualActivity | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.leadId !== "string" || !raw.leadId) return null;
  if (typeof raw.actorId !== "string" || !raw.actorId) return null;
  if (typeof raw.kind !== "string" || !KINDS.includes(raw.kind as ManualActivityKind)) {
    return null;
  }
  if (!isIsoDate(raw.at)) return null;
  const outcome =
    typeof raw.outcome === "string" && OUTCOMES.includes(raw.outcome as CallOutcome)
      ? (raw.outcome as CallOutcome)
      : undefined;
  const recap =
    typeof raw.recap === "string" && raw.recap.trim()
      ? raw.recap.trim().slice(0, ACTIVITY_COOKIE_MAX_RECAP)
      : undefined;
  return {
    leadId: raw.leadId,
    actorId: raw.actorId,
    kind: raw.kind as ManualActivityKind,
    outcome,
    recap,
    at: raw.at,
  };
}

export function encodeActivityCookie(
  events: PersistedManualActivity[],
  secret: string,
): string {
  const trimmed = events.slice(-ACTIVITY_COOKIE_MAX_EVENTS).map((event) => ({
    ...event,
    recap: event.recap?.slice(0, ACTIVITY_COOKIE_MAX_RECAP),
  }));
  const payload = Buffer.from(JSON.stringify(trimmed), "utf8").toString("base64url");
  return `${payload}.${signDemoPayload(payload, secret)}`;
}

export function decodeActivityCookie(
  token: string,
  secret: string,
): PersistedManualActivity[] | null {
  const split = token.lastIndexOf(".");
  if (split <= 0) return null;
  const payload = token.slice(0, split);
  const sig = token.slice(split + 1);
  if (!payload || !sig) return null;

  const expected = signDemoPayload(payload, secret);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
    if (!Array.isArray(parsed)) return null;
    const events = parsed.map(sanitizeEvent).filter((e): e is PersistedManualActivity => e !== null);
    return events.slice(-ACTIVITY_COOKIE_MAX_EVENTS);
  } catch {
    return null;
  }
}

export function replayPersistedActivities(events: PersistedManualActivity[]): number {
  let applied = 0;
  for (const event of events) {
    const receipt = logManualLeadActivity({
      leadId: event.leadId,
      actorId: event.actorId,
      kind: event.kind,
      outcome: event.outcome,
      recap: event.recap,
      occurredAt: event.at,
    });
    if (receipt.status === "applied") applied += 1;
  }
  return applied;
}
