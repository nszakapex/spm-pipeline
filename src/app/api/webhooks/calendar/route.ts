import { handleSignedWebhookPost, webhookChannelGetResponse } from "@/integrations/webhooks/http";
import { parseCalendarWebhookPayload } from "@/integrations/webhooks/parse";

export async function GET() {
  return webhookChannelGetResponse("calendar");
}

export async function POST(request: Request) {
  return handleSignedWebhookPost(request, parseCalendarWebhookPayload);
}
