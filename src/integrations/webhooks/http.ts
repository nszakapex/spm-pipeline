import { NextResponse } from "next/server";
import {
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  verifySpmWebhookSignature,
} from "./signature";
import {
  HUBSPOT_SIGNATURE_HEADER,
  HUBSPOT_TIMESTAMP_HEADER,
  publicRequestUri,
  verifyHubSpotWebhookV3,
} from "@/integrations/hubspot/signature";
import { ingestCanonicalEvents, type IngestBatchResult } from "./ingest";
import type { CanonicalIngestEvent } from "./types";
import { PRE_REGISTERED_WEBHOOKS } from "@/lib/pipeline/stage-integrations";
import { getEnv } from "@/lib/env";
import { getWebhookReadiness } from "@/lib/integrations/readiness";
import type { IngestChannel } from "@/types/domain";

function verifyInboundSignature(request: Request, rawBody: string, allowHubSpotV3: boolean) {
  const spm = verifySpmWebhookSignature({
    rawBody,
    signature: request.headers.get(WEBHOOK_SIGNATURE_HEADER),
    timestamp: request.headers.get(WEBHOOK_TIMESTAMP_HEADER),
  });
  if (spm.ok) return spm;

  if (allowHubSpotV3) {
    const clientSecret = getEnv().HUBSPOT_CLIENT_SECRET;
    if (!clientSecret) {
      if (request.headers.get(HUBSPOT_SIGNATURE_HEADER)) {
        return {
          ok: false as const,
          error: "HubSpot v3 is not configured. Set HUBSPOT_CLIENT_SECRET.",
        };
      }
      return spm;
    }
    return verifyHubSpotWebhookV3({
      method: request.method,
      uri: publicRequestUri(request),
      rawBody,
      signature: request.headers.get(HUBSPOT_SIGNATURE_HEADER),
      timestamp: request.headers.get(HUBSPOT_TIMESTAMP_HEADER),
      clientSecret,
    });
  }

  return spm;
}

export async function handleSignedWebhookPost(
  request: Request,
  parse: (json: unknown) => CanonicalIngestEvent[],
  options: { allowHubSpotV3?: boolean } = {},
): Promise<NextResponse<IngestBatchResult | { ok: false; error: string }>> {
  const rawBody = await request.text();
  const verified = verifyInboundSignature(request, rawBody, Boolean(options.allowHubSpotV3));
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
  const ready = getWebhookReadiness();
  return NextResponse.json({
    ok: true,
    channel,
    mode: ready.hubspotMode,
    signature: {
      header: WEBHOOK_SIGNATURE_HEADER,
      timestampHeader: WEBHOOK_TIMESTAMP_HEADER,
      scheme: "spm-v1",
      hubspotV3: {
        ready: ready.hubspotV3Ready,
        header: HUBSPOT_SIGNATURE_HEADER,
        timestampHeader: HUBSPOT_TIMESTAMP_HEADER,
      },
      note: ready.hubspotV3Ready
        ? "Accepts mock spm-v1 HMAC or HubSpot X-HubSpot-Signature-v3."
        : "Mock HMAC is live. Set HUBSPOT_CLIENT_SECRET to accept HubSpot v3 signatures.",
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
