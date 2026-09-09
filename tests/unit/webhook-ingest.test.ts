import { describe, expect, it } from "vitest";
import { getStore } from "@/lib/db/store";
import { ingestCanonicalEvents } from "@/integrations/webhooks/ingest";
import { classifyReplyIntent, analyzeCallPayload } from "@/integrations/webhooks/analyze";
import {
  parseCalendarWebhookPayload,
  parseCallsWebhookPayload,
  parseHubSpotWebhookPayload,
  parseMessagingWebhookPayload,
  parseSourceWebhookPayload,
} from "@/integrations/webhooks/parse";
import { PRE_REGISTERED_WEBHOOKS, STAGE_INTEGRATIONS } from "@/lib/pipeline/stage-integrations";
import { atLeastStage } from "@/lib/pipeline/stage-order";

describe("stage integration catalog", () => {
  it("covers every canonical stage and pre-registers HubSpot + Jake calendar hooks", () => {
    expect(STAGE_INTEGRATIONS.map((r) => r.stage)).toEqual([
      "NEW",
      "ATTEMPTING_CONTACT",
      "CONNECTED",
      "QUALIFIED",
      "JAKE_READY",
      "CALL_BOOKED",
      "CALL_HELD",
      "ENROLLMENT_PENDING",
      "WON",
      "LOST",
    ]);
    const channels = new Set(PRE_REGISTERED_WEBHOOKS.map((h) => h.channel));
    expect(channels).toEqual(
      new Set(["hubspot", "calendar", "calls", "messaging", "sources"]),
    );
    expect(PRE_REGISTERED_WEBHOOKS.some((h) => h.path === "/api/webhooks/hubspot")).toBe(
      true,
    );
    expect(PRE_REGISTERED_WEBHOOKS.some((h) => h.path === "/api/webhooks/calendar")).toBe(
      true,
    );
  });

  it("only advances stages forward", () => {
    expect(atLeastStage("NEW", "CALL_BOOKED")).toBe("CALL_BOOKED");
    expect(atLeastStage("CALL_HELD", "CONNECTED")).toBe("CALL_HELD");
    expect(atLeastStage("WON", "NEW")).toBe("WON");
  });
});

describe("reply and call analysis", () => {
  it("classifies booking and enrollment language without an LLM", () => {
    expect(classifyReplyIntent("Can we book Jake this week?")).toBe("book");
    expect(classifyReplyIntent("What's tuition and start date?")).toBe("question");
    expect(classifyReplyIntent("Not interested, thanks")).toBe("not_interested");
    expect(classifyReplyIntent("Maybe next year")).toBe("timing");
  });

  it("turns a call recap into a recommended next action", () => {
    const analysis = analyzeCallPayload({
      outcome: "connected",
      recap: "Parent asked about enrollment and wants to schedule Jake.",
    });
    expect(analysis.askedAboutEnrollment).toBe(true);
    expect(analysis.requestedStrategyCall).toBe(true);
    expect(analysis.recommendedNextAction).toBe("BOOK_MEETING");
  });
});

describe("webhook ingest by stage", () => {
  it("logs a first-touch miss as Attempting Contact", () => {
    const newbie = getStore().getLeads().find((l) => l.stage === "NEW" && l.owner_id);
    expect(newbie).toBeTruthy();
    const [event] = parseCallsWebhookPayload({
      event: "call.logged",
      externalEventId: "call_miss_1",
      leadId: newbie!.id,
      outcome: "voicemail",
      recap: "Left voicemail",
    });
    const result = ingestCanonicalEvents([event]);
    expect(result.httpStatus).toBe(200);
    expect(getStore().getLead(newbie!.id)?.stage).toBe("ATTEMPTING_CONTACT");
  });

  it("treats an inbound reply as Connected and raises needs_reply", () => {
    const attempting = getStore()
      .getLeads()
      .find((l) => l.stage === "ATTEMPTING_CONTACT" && l.owner_id && l.email);
    expect(attempting).toBeTruthy();
    const [event] = parseMessagingWebhookPayload({
      event: "message.inbound",
      externalEventId: "msg_1",
      leadId: attempting!.id,
      channel: "sms",
      text: "Hi — who is this?",
    });
    ingestCanonicalEvents([event]);
    const lead = getStore().getLead(attempting!.id)!;
    expect(lead.stage).toBe("CONNECTED");
    const receipt = getStore().getIngestReceipts()[0];
    expect(receipt.flags_raised).toContain("needs_reply");
  });

  it("books Jake's calendar onto Call Booked", () => {
    const jakeReady = getStore()
      .getLeads()
      .find((l) => l.stage === "JAKE_READY" && l.qualification_status === "qualified");
    expect(jakeReady).toBeTruthy();
    const [event] = parseCalendarWebhookPayload({
      event: "meeting.booked",
      externalEventId: "cal_1",
      leadId: jakeReady!.id,
      calendar: "jake",
      startsAt: "2026-08-22T16:00:00.000Z",
    });
    ingestCanonicalEvents([event]);
    const lead = getStore().getLead(jakeReady!.id)!;
    expect(lead.stage).toBe("CALL_BOOKED");
    expect(lead.meeting_status).toBe("booked");
    expect(lead.next_action_type).toBe("CALL");
  });

  it("marks a no-show with a reschedule action", () => {
    const booked = getStore()
      .getLeads()
      .find((l) => l.stage === "CALL_BOOKED" && l.disposition === "ACTIVE");
    expect(booked).toBeTruthy();
    const [event] = parseCalendarWebhookPayload({
      event: "meeting.no_show",
      externalEventId: "cal_noshow_1",
      leadId: booked!.id,
    });
    ingestCanonicalEvents([event]);
    const lead = getStore().getLead(booked!.id)!;
    expect(lead.disposition).toBe("NO_SHOW");
    expect(lead.next_action_type).toBe("RESCHEDULE");
  });

  it("analyzes a held strategy call into Call Held", () => {
    const booked = getStore()
      .getLeads()
      .find((l) => l.stage === "CALL_BOOKED" && l.meeting_status === "booked");
    expect(booked).toBeTruthy();
    const [event] = parseCallsWebhookPayload({
      event: "call.analyzed",
      externalEventId: "call_an_1",
      leadId: booked!.id,
      outcome: "held",
      kind: "strategy",
      recap: "Walked tuition. Family wants to enroll this fall.",
    });
    ingestCanonicalEvents([event]);
    const lead = getStore().getLead(booked!.id)!;
    expect(lead.stage).toBe("CALL_HELD");
    const analyzed = getStore()
      .getActivities(lead.id)
      .find((a) => a.activity_type === "call_analyzed");
    expect(analyzed?.metadata_json.askedAboutEnrollment).toBe(true);
  });

  it("creates a NEW lead from a source form webhook", () => {
    const [event] = parseSourceWebhookPayload(
      {
        externalEventId: "form_new_99",
        email: "new.family@example.com",
        firstName: "Priya",
        lastName: "Shah",
        phone: "+1-555-010-9999",
      },
      "forms",
    );
    ingestCanonicalEvents([event]);
    const created = getStore()
      .getLeads()
      .find((l) => l.email === "new.family@example.com");
    expect(created?.stage).toBe("NEW");
    expect(created?.next_action_type).toBe("CALL_NOW");
  });

  it("maps HubSpot SQL lifecycle to Qualified", () => {
    const connected = getStore().getLead("lead_001");
    expect(connected?.stage).toBe("CONNECTED");
    const [event] = parseHubSpotWebhookPayload({
      event: "contact.updated",
      externalEventId: "hs_sql_1",
      leadId: "lead_001",
      contactId: "HS-C-1001",
      lifecycleStage: "salesqualifiedlead",
    });
    ingestCanonicalEvents([event]);
    expect(getStore().getLead("lead_001")?.stage).toBe("QUALIFIED");
  });

  it("skips duplicate external event ids", () => {
    const [event] = parseMessagingWebhookPayload({
      event: "message.inbound",
      externalEventId: "dup_msg",
      leadId: "lead_001",
      text: "Thanks",
    });
    const first = ingestCanonicalEvents([event]);
    const second = ingestCanonicalEvents([event]);
    expect(first.results[0].status).toBe("applied");
    expect(second.results[0].status).toBe("duplicate");
  });

  it("returns unmatched when a call has no identity", () => {
    const [event] = parseCallsWebhookPayload({
      event: "call.logged",
      externalEventId: "orphan_call",
      outcome: "connected",
      recap: "Unknown number",
    });
    const result = ingestCanonicalEvents([event]);
    expect(result.results[0].status).toBe("unmatched");
  });
});
