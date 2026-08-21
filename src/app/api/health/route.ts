import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getWebhookReadiness } from "@/lib/integrations/readiness";

export async function GET() {
  const env = getEnv();
  const webhooks = getWebhookReadiness();
  return NextResponse.json({
    ok: true,
    app: "spm-pipeline",
    mode: env.APP_MODE,
    hubspot: env.HUBSPOT_MODE,
    webhooks: {
      hubspotV3Ready: webhooks.hubspotV3Ready,
      jakeMeetingsUrlReady: webhooks.jakeMeetingsUrlReady,
      mockHmacReady: webhooks.mockHmacReady,
      hubspotTarget: "/api/webhooks/hubspot",
      hubspotSubscriptions: webhooks.hubspotSubscriptions,
      waitingOnYou: webhooks.waitingOnYou,
    },
  });
}
