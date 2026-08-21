import { createMockHubSpotClient } from "./mock";
import type { HubSpotClient } from "./types";
import { getEnv } from "@/lib/env";

export function getHubSpotClient(): HubSpotClient {
  const mode = getEnv().HUBSPOT_MODE;
  if (mode === "live") {
    throw new Error("Live HubSpot mode is disabled in this prototype");
  }
  return createMockHubSpotClient();
}
