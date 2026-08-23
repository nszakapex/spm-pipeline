import { describe, expect, it } from "vitest";
import { TEST_ONLY_DEMO_SESSION_SECRET } from "@/lib/env";
import { getStore, resetRuntimeStore } from "@/lib/db/store";
import {
  decodeActivityCookie,
  encodeActivityCookie,
  replayPersistedActivities,
} from "@/lib/db/activity-cookie";
import { logManualLeadActivity } from "@/lib/pipeline/log-activity";

describe("manual activity cookie persist", () => {
  it("round-trips a signed activity cookie", () => {
    const events = [
      {
        leadId: "lead_001",
        actorId: "user_001",
        kind: "inbound_reply" as const,
        recap: "Called back",
        at: "2026-08-23T12:00:00.000Z",
      },
    ];
    const token = encodeActivityCookie(events, TEST_ONLY_DEMO_SESSION_SECRET);
    expect(decodeActivityCookie(token, TEST_ONLY_DEMO_SESSION_SECRET)).toEqual(events);
    expect(decodeActivityCookie(token, "wrong-secret-wrong-secret-wrong-secret")).toBeNull();
  });

  it("replays a persisted log after the overlay is cleared", () => {
    resetRuntimeStore();
    const newbie = getStore().getLeads().find((l) => l.stage === "NEW" && l.owner_id);
    expect(newbie).toBeTruthy();
    const at = "2026-08-23T15:00:00.000Z";
    const first = logManualLeadActivity({
      leadId: newbie!.id,
      actorId: "user_001",
      kind: "call",
      outcome: "voicemail",
      recap: "Left voicemail",
      occurredAt: at,
    });
    expect(first.status).toBe("applied");
    expect(getStore().getLead(newbie!.id)?.stage).toBe("ATTEMPTING_CONTACT");

    resetRuntimeStore();
    expect(getStore().getLead(newbie!.id)?.stage).toBe("NEW");

    const applied = replayPersistedActivities([
      {
        leadId: newbie!.id,
        actorId: "user_001",
        kind: "call",
        outcome: "voicemail",
        recap: "Left voicemail",
        at,
      },
    ]);
    expect(applied).toBe(1);
    expect(getStore().getLead(newbie!.id)?.stage).toBe("ATTEMPTING_CONTACT");

    const duplicate = replayPersistedActivities([
      {
        leadId: newbie!.id,
        actorId: "user_001",
        kind: "call",
        outcome: "voicemail",
        recap: "Left voicemail",
        at,
      },
    ]);
    expect(duplicate).toBe(0);
  });
});
