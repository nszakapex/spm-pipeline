import { handleSignedWebhookPost, webhookChannelGetResponse } from "@/integrations/webhooks/http";
import { mapHubSpotWebhookBody } from "@/integrations/hubspot/webhooks";

export async function GET() {
  return webhookChannelGetResponse("hubspot");
}

export async function POST(request: Request) {
  return handleSignedWebhookPost(request, mapHubSpotWebhookBody);
}
