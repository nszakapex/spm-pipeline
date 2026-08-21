import { parseHubSpotWebhookPayload } from "@/integrations/webhooks/parse";

/** HubSpot inbound webhook mapping. Live signature verification is not enabled. */
export function mapHubSpotWebhookBody(json: unknown) {
  return parseHubSpotWebhookPayload(json);
}
