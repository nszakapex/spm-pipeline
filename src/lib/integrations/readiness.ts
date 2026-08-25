import { getEnv } from "@/lib/env";
import { PRE_REGISTERED_WEBHOOKS, WEBHOOK_CHANNEL_PATHS } from "@/lib/pipeline/stage-integrations";

export function getWebhookReadiness() {
  const env = getEnv();
  return {
    hubspotMode: env.HUBSPOT_MODE,
    hubspotV3Ready: Boolean(env.HUBSPOT_CLIENT_SECRET),
    jakeMeetingsUrlReady: Boolean(env.JAKE_MEETINGS_URL),
    persistReady: env.persistReady,
    mockHmacReady: true,
    inboundRoutes: WEBHOOK_CHANNEL_PATHS,
    hubspotSubscriptions: PRE_REGISTERED_WEBHOOKS.filter((h) => h.channel === "hubspot").map(
      (h) => h.providerEvent,
    ),
    waitingOnYou: [
      ...(env.HUBSPOT_CLIENT_SECRET ? [] : ["HUBSPOT_CLIENT_SECRET (HubSpot app client secret)"]),
      ...(env.JAKE_MEETINGS_URL ? [] : ["JAKE_MEETINGS_URL (Jake's HubSpot Meetings link)"]),
    ],
  };
}
