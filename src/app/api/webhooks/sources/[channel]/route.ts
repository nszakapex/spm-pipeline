import { NextResponse } from "next/server";
import { handleSignedWebhookPost, webhookChannelGetResponse } from "@/integrations/webhooks/http";
import { parseSourceWebhookPayload } from "@/integrations/webhooks/parse";
import { isSourceWebhookChannel } from "@/lib/pipeline/stage-integrations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ channel: string }> },
) {
  const { channel } = await context.params;
  if (!isSourceWebhookChannel(channel)) {
    return NextResponse.json({ ok: false, error: "Unknown source channel" }, { status: 404 });
  }
  return webhookChannelGetResponse("sources");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ channel: string }> },
) {
  const { channel } = await context.params;
  if (!isSourceWebhookChannel(channel)) {
    return NextResponse.json({ ok: false, error: "Unknown source channel" }, { status: 404 });
  }
  return handleSignedWebhookPost(request, (json) => parseSourceWebhookPayload(json, channel));
}
