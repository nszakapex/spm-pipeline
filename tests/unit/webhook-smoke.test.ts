import { describe, expect, it } from "vitest";
import { ingestCanonicalEvents } from "@/integrations/webhooks/ingest";
import { parseHubSpotWebhookPayload } from "@/integrations/webhooks/parse";
import { logManualLeadActivity } from "@/lib/pipeline/log-activity";
import { getStore } from "@/lib/db/store";
import { GET as healthGet } from "@/app/api/health/route";
import { POST as hubspotPost } from "@/app/api/webhooks/hubspot/route";
import {
  signHubSpotWebhookV3,
  publicRequestUri,
} from "@/integrations/hubspot/signature";
import { resetEnvCache } from "@/lib/env";

const CONTACT_ID = 880015;

function hubspotBatch(events: unknown[]) {
  return parseHubSpotWebhookPayload(events);
}

describe("go-live smoke — HubSpot-shaped payloads", () => {
  it("creates a lead from contact.creation then fills identity on propertyChange", () => {
    const created = ingestCanonicalEvents(
      hubspotBatch([
        {
          eventId: 101,
          subscriptionType: "contact.creation",
          objectId: CONTACT_ID,
          occurredAt: Date.now(),
        },
      ]),
    );
    expect(created.results[0]?.status).toBe("applied");
    const lead = getStore()
      .getLeads()
      .find((l) => l.hubspot_contact_id === String(CONTACT_ID));
    expect(lead).toBeTruthy();
    expect(lead?.stage).toBe("NEW");

    ingestCanonicalEvents(
      hubspotBatch([
        {
          eventId: 102,
          subscriptionType: "contact.propertyChange",
          objectId: CONTACT_ID,
          propertyName: "email",
          propertyValue: "smoke.family@example.com",
        },
        {
          eventId: 103,
          subscriptionType: "contact.propertyChange",
          objectId: CONTACT_ID,
          propertyName: "firstname",
          propertyValue: "Smoke",
        },
        {
          eventId: 104,
          subscriptionType: "contact.propertyChange",
          objectId: CONTACT_ID,
          propertyName: "lastname",
          propertyValue: "Family",
        },
      ]),
    );

    const updated = getStore().getLead(lead!.id)!;
    expect(updated.email).toBe("smoke.family@example.com");
    expect(updated.first_name).toBe("Smoke");
    expect(updated.last_name).toBe("Family");
  });

  it("maps HubSpot SQL lifecycle onto Qualified", () => {
    const connected = getStore().getLead("lead_001")!;
    ingestCanonicalEvents(
      hubspotBatch([
        {
          eventId: 201,
          subscriptionType: "contact.propertyChange",
          objectId: Number(connected.hubspot_contact_id?.replace(/\D/g, "") || 1001),
          leadId: "lead_001",
          propertyName: "lifecyclestage",
          propertyValue: "salesqualifiedlead",
        },
      ]),
    );
    expect(getStore().getLead("lead_001")?.stage).toBe("QUALIFIED");
  });

  it("books and completes Jake via HubSpot meeting events", () => {
    const jakeReady = getStore()
      .getLeads()
      .find((l) => l.stage === "JAKE_READY");
    expect(jakeReady).toBeTruthy();
    ingestCanonicalEvents(
      hubspotBatch([
        {
          eventId: 301,
          subscriptionType: "meeting.creation",
          leadId: jakeReady!.id,
          objectId: 9001,
        },
      ]),
    );
    expect(getStore().getLead(jakeReady!.id)?.stage).toBe("CALL_BOOKED");
    ingestCanonicalEvents(
      hubspotBatch([
        {
          eventId: 302,
          subscriptionType: "meeting.propertyChange",
          leadId: jakeReady!.id,
          propertyName: "hs_meeting_outcome",
          propertyValue: "COMPLETED",
        },
      ]),
    );
    expect(getStore().getLead(jakeReady!.id)?.stage).toBe("CALL_HELD");
  });
});

describe("go-live smoke — manual logs", () => {
  it("moves a New lead after a typed voicemail", () => {
    const newbie = getStore().getLeads().find((l) => l.stage === "NEW" && l.owner_id);
    expect(newbie).toBeTruthy();
    const receipt = logManualLeadActivity({
      leadId: newbie!.id,
      actorId: "user_001",
      kind: "call",
      outcome: "voicemail",
      recap: "Left voicemail after showing the product",
    });
    expect(receipt.status).toBe("applied");
    expect(getStore().getLead(newbie!.id)?.stage).toBe("ATTEMPTING_CONTACT");
  });

  it("flags Needs reply after a typed inbound message", () => {
    const attempting = getStore()
      .getLeads()
      .find((l) => l.stage === "ATTEMPTING_CONTACT" && l.owner_id);
    expect(attempting).toBeTruthy();
    const receipt = logManualLeadActivity({
      leadId: attempting!.id,
      actorId: "user_001",
      kind: "inbound_reply",
      recap: "Can we talk tomorrow?",
    });
    expect(receipt.flags_raised).toContain("needs_reply");
    expect(getStore().getLead(attempting!.id)?.stage).toBe("CONNECTED");
  });
});

describe("go-live smoke — health and HubSpot v3 HTTP", () => {
  it("reports HubSpot v3 waiting when the client secret is absent", async () => {
    const res = await healthGet();
    const json = (await res.json()) as {
      webhooks: { hubspotV3Ready: boolean; waitingOnYou: string[] };
    };
    expect(json.webhooks.hubspotV3Ready).toBe(false);
    expect(json.webhooks.waitingOnYou.some((item) => item.includes("HUBSPOT_CLIENT_SECRET"))).toBe(
      true,
    );
  });

  it("accepts a HubSpot v3 signed POST when the client secret is set", async () => {
    const secret = "hubspot-test-client-secret-not-for-deploy";
    process.env.HUBSPOT_CLIENT_SECRET = secret;
    resetEnvCache();

    const url = "http://localhost/api/webhooks/hubspot";
    const raw = JSON.stringify({
      eventId: 401,
      subscriptionType: "contact.creation",
      objectId: 880099,
      email: "v3.family@example.com",
      firstName: "V3",
      lastName: "Hook",
    });
    const timestamp = String(Date.now());
    const request = new Request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hubspot-signature-v3": "pending",
        "x-hubspot-request-timestamp": timestamp,
      },
      body: raw,
    });
    const uri = publicRequestUri(request);
    const signature = signHubSpotWebhookV3({
      method: "POST",
      uri,
      rawBody: raw,
      timestamp,
      clientSecret: secret,
    });

    const signed = new Request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hubspot-signature-v3": signature,
        "x-hubspot-request-timestamp": timestamp,
      },
      body: raw,
    });
    const res = await hubspotPost(signed);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; results: Array<{ status: string }> };
    expect(json.results[0]?.status).toBe("applied");
  });
});
