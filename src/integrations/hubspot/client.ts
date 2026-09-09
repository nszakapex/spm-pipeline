import { createMockHubSpotClient } from "./mock";
import type { HubSpotClient } from "./types";
import { getEnv } from "@/lib/env";

export function getHubSpotClient(): HubSpotClient {
  // getEnv() rejects HUBSPOT_MODE=live; only mock is supported in this prototype.
  getEnv();
  return createMockHubSpotClient();
}
