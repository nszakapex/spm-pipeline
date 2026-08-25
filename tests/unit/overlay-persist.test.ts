import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnv, resetEnvCache } from "@/lib/env";
import { getStore, resetRuntimeStore } from "@/lib/db/store";
import {
  getStoreOverlay,
  overlayToSnapshot,
  replaceStoreOverlay,
  snapshotToOverlay,
} from "@/lib/db/overlay";
import {
  persistRowsFromSnapshot,
  persistStoreOverlay,
  snapshotFromPersistRows,
} from "@/lib/db/supabase-persist";
import { logManualLeadActivity } from "@/lib/pipeline/log-activity";

describe("overlay snapshot persist mapping", () => {
  it("round-trips overlay maps through a JSON snapshot", () => {
    const lead = getStore().getLead("lead_001");
    expect(lead).toBeTruthy();
    const overlay = getStoreOverlay();
    overlay.leadPatches.set(lead!.id, { ...lead!, stage: "CONNECTED" });
    overlay.seenExternalIds.add("hubspot:evt_roundtrip");

    const restored = snapshotToOverlay(overlayToSnapshot(overlay));
    expect(restored.leadPatches.get("lead_001")?.stage).toBe("CONNECTED");
    expect(restored.seenExternalIds.has("hubspot:evt_roundtrip")).toBe(true);
  });

  it("round-trips persist rows used by the overlay tables", () => {
    const newbie = getStore().getLeads().find((l) => l.stage === "NEW" && l.owner_id);
    expect(newbie).toBeTruthy();
    logManualLeadActivity({
      leadId: newbie!.id,
      actorId: "user_001",
      kind: "call",
      outcome: "voicemail",
      recap: "Left voicemail",
      occurredAt: "2026-08-25T15:00:00.000Z",
    });

    const rows = persistRowsFromSnapshot(overlayToSnapshot());
    expect(rows.leadState.some((row) => row.id === newbie!.id && row.kind === "patch")).toBe(true);
    expect(rows.activities.length).toBeGreaterThan(0);
    expect(rows.receipts.length).toBeGreaterThan(0);
    expect(rows.seenEvents.length).toBeGreaterThan(0);

    resetRuntimeStore();
    expect(getStore().getLead(newbie!.id)?.stage).toBe("NEW");

    replaceStoreOverlay(snapshotToOverlay(snapshotFromPersistRows(rows)));
    expect(getStore().getLead(newbie!.id)?.stage).toBe("ATTEMPTING_CONTACT");
  });

  it("no-ops persist when Supabase credentials are absent", async () => {
    await expect(persistStoreOverlay()).resolves.toBeUndefined();
  });

  it("reports persistReady only when both URL and service key are set", () => {
    expect(getEnv().persistReady).toBe(false);
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-not-for-network";
    resetEnvCache();
    expect(getEnv().persistReady).toBe(true);
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    resetEnvCache();
    expect(getEnv().persistReady).toBe(false);
  });
});

describe("webhook persist failures", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 500 when a configured persist write fails", async () => {
    const { POST: hubspotPost } = await import("@/app/api/webhooks/hubspot/route");
    const {
      signSpmWebhook,
      WEBHOOK_SIGNATURE_HEADER,
      WEBHOOK_TIMESTAMP_HEADER,
      webhookTimestampNow,
    } = await import("@/integrations/webhooks/signature");
    const { TEST_ONLY_DEMO_SESSION_SECRET } = await import("@/lib/env");
    const persist = await import("@/lib/db/supabase-persist");

    vi.spyOn(persist, "hydrateStoreFromSupabase").mockResolvedValue(true);
    vi.spyOn(persist, "persistStoreOverlay").mockRejectedValue(new Error("persist down"));

    const raw = JSON.stringify({
      event: "contact.created",
      externalEventId: "hs_persist_fail",
      email: "persist.fail@example.com",
      firstName: "Persist",
      lastName: "Fail",
    });
    const timestamp = webhookTimestampNow();
    const res = await hubspotPost(
      new Request("http://localhost/api/webhooks/hubspot", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [WEBHOOK_SIGNATURE_HEADER]: signSpmWebhook(
            raw,
            timestamp,
            TEST_ONLY_DEMO_SESSION_SECRET,
          ),
          [WEBHOOK_TIMESTAMP_HEADER]: timestamp,
        },
        body: raw,
      }),
    );
    expect(res.status).toBe(500);
    const json = (await res.json()) as { ok: boolean; error: string };
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/persist/i);
  });
});
