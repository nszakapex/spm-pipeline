import { NextResponse } from "next/server";
import {
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  verifySpmWebhookSignature,
} from "./signature";
import { ingestCanonicalEvents, type IngestBatchResult } from "./ingest";
import type { CanonicalIngestEvent } from "./types";
import { PRE_REGISTERED_WEBHOOKS } from "@/lib/pipeline/stage-integrations";
import type { IngestChannel } from "@/types/domain";

export async function handleSignedWebhookPost(
  request: Request,
  parse: (json: unknown) => CanonicalIngestEvent[],
): Promise<NextResponse<IngestBatchResult | { ok: false; error: string }>> {
  const rawBody = await request.text();
  const verified = verifySpmWebhookSignature({
    rawBody,
    signature: request.headers.get(WEBHOOK_SIGNATURE_HEADER),
    timestamp: request.headers.get(WEBHOOK_TIMESTAMP_HEADER),
  });
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: verified.error }, { status: 401 });
  }

  let json: unknown;
  try {
    json = rawBody.length ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const events = parse(json);
  if (events.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No ingest events in payload" },
      { status: 400 },
    );
  }

  const result = ingestCanonicalEvents(events);
  return NextResponse.json(result, { status: result.httpStatus });
}

export function webhookChannelGetResponse(channel: IngestChannel) {
  return NextResponse.json({
    ok: true,
    channel,
    mode: "mock",
    signature: {
      header: WEBHOOK_SIGNATURE_HEADER,
      timestampHeader: WEBHOOK_TIMESTAMP_HEADER,
      scheme: "spm-v1",
      note: "HMAC-SHA256 of `{timestamp}.{rawBody}` with a key derived from DEMO_SESSION_SECRET. Live HubSpot signatures are not enabled.",
    },
    subscriptions: PRE_REGISTERED_WEBHOOKS.filter((s) => s.channel === channel).map((s) => ({
      id: s.id,
      providerEvent: s.providerEvent,
      canonicalType: s.canonicalType,
      path: s.path,
      purpose: s.purpose,
    })),
  });
}
