import { handleSignedWebhookPost, webhookChannelGetResponse } from "@/integrations/webhooks/http";
import { parseCallsWebhookPayload } from "@/integrations/webhooks/parse";

export async function GET() {
  return webhookChannelGetResponse("calls");
}

export async function POST(request: Request) {
  return handleSignedWebhookPost(request, parseCallsWebhookPayload);
}
