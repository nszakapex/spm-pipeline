import { handleSignedWebhookPost, webhookChannelGetResponse } from "@/integrations/webhooks/http";
import { parseMessagingWebhookPayload } from "@/integrations/webhooks/parse";

export async function GET() {
  return webhookChannelGetResponse("messaging");
}

export async function POST(request: Request) {
  return handleSignedWebhookPost(request, parseMessagingWebhookPayload);
}
