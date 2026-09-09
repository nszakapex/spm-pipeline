import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as hubspotPost, GET as hubspotGet } from "@/app/api/webhooks/hubspot/route";
import {
  signSpmWebhook,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  webhookTimestampNow,
  verifySpmWebhookSignature,
} from "@/integrations/webhooks/signature";
import { TEST_ONLY_DEMO_SESSION_SECRET } from "@/lib/env";
import { proxy } from "@/proxy";

function signedRequest(url: string, body: unknown) {
  const raw = JSON.stringify(body);
  const timestamp = webhookTimestampNow();
  const signature = signSpmWebhook(raw, timestamp, TEST_ONLY_DEMO_SESSION_SECRET);
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [WEBHOOK_SIGNATURE_HEADER]: signature,
      [WEBHOOK_TIMESTAMP_HEADER]: timestamp,
    },
    body: raw,
  });
}

describe("webhook signatures", () => {
  it("accepts a matching HMAC and rejects a tampered body", () => {
    const timestamp = webhookTimestampNow();
    const body = '{"ok":true}';
    const signature = signSpmWebhook(body, timestamp, TEST_ONLY_DEMO_SESSION_SECRET);
    expect(
      verifySpmWebhookSignature({
        rawBody: body,
        signature,
        timestamp,
        sessionSecret: TEST_ONLY_DEMO_SESSION_SECRET,
      }).ok,
    ).toBe(true);
    expect(
      verifySpmWebhookSignature({
        rawBody: '{"ok":false}',
        signature,
        timestamp,
        sessionSecret: TEST_ONLY_DEMO_SESSION_SECRET,
      }).ok,
    ).toBe(false);
  });
});

describe("webhook HTTP routes", () => {
  it("rejects unsigned HubSpot posts", async () => {
    const res = await hubspotPost(
      new Request("http://localhost/api/webhooks/hubspot", {
        method: "POST",
        body: JSON.stringify({ event: "contact.created", externalEventId: "x" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("applies a signed HubSpot contact create", async () => {
    const res = await hubspotPost(
      signedRequest("http://localhost/api/webhooks/hubspot", {
        event: "contact.created",
        externalEventId: "hs_http_1",
        email: "webhook.family@example.com",
        firstName: "Dana",
        lastName: "Ivers",
        phone: "+1-555-010-4242",
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; results: Array<{ status: string }> };
    expect(json.ok).toBe(true);
    expect(json.results[0].status).toBe("applied");
  });

  it("advertises pre-registered HubSpot subscriptions on GET", async () => {
    const res = await hubspotGet();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { subscriptions: Array<{ path: string }> };
    expect(json.subscriptions.length).toBeGreaterThan(0);
    expect(json.subscriptions[0].path).toBe("/api/webhooks/hubspot");
  });
});

describe("proxy allows unsigned webhook paths (handler still 401s)", () => {
  it("does not redirect /api/webhooks/hubspot to login", () => {
    const res = proxy(new NextRequest("http://localhost:3000/api/webhooks/hubspot"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not redirect nested source webhooks to login", () => {
    const res = proxy(
      new NextRequest("http://localhost:3000/api/webhooks/sources/meta"),
    );
    expect(res.status).toBe(200);
  });
});
