import { describe, expect, it } from "vitest";
import {
  evaluateLeadRisks,
  evaluateUnmatchedSourceEvent,
} from "@/lib/nurture/flags";
import {
  calculatePipelineHealth,
  summarizeSourceIntegrity,
} from "@/lib/integrity/reconciliation";
import { getDemoDataset, resetDemoDatasetCache } from "@/lib/demo/seed";
import type { Activity, Lead, LeadSourceEvent } from "@/types/domain";

function baseLead(over: Partial<Lead> = {}): Lead {
  return {
    id: "lead_test",
    first_name: "Test",
    last_name: "Parent",
    email: "parent@example.com",
    phone: "+1-555-010-1111",
    owner_id: "user_001",
    source: "Main Website",
    source_detail: null,
    source_definition_id: "src_001",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    stage: "NEW",
    disposition: "ACTIVE",
    score: 50,
    score_band: "P3",
    score_version: "v1",
    created_at: new Date(Date.now() - 10 * 3600_000).toISOString(),
    first_contact_at: null,
    last_contact_at: null,
    last_activity_at: null,
    next_action_at: null,
    next_action_type: null,
    next_action_note: null,
    qualification_status: "unknown",
    qualification_reason: null,
    qualified_at: null,
    meeting_booked_at: null,
    meeting_status: "none",
    nurture_reason: null,
    nurture_until: null,
    lost_reason: null,
    hubspot_contact_id: null,
    hubspot_lead_id: null,
    hubspot_deal_id: null,
    sync_status: "synced",
    last_synced_at: null,
    updated_at: new Date().toISOString(),
    ...over,
  };
}

describe("SLA / at-risk flags", () => {
  it("detects no owner, no next action, missing source, uncontacted, overdue first contact", () => {
    const lead = baseLead({
      owner_id: null,
      source: "missing",
      next_action_at: null,
      next_action_type: null,
    });
    const flags = evaluateLeadRisks(lead, []);
    const codes = flags.map((f) => f.code);
    expect(codes).toContain("no_owner");
    expect(codes).toContain("no_next_action");
    expect(codes).toContain("missing_source");
    expect(codes).toContain("uncontacted");
    expect(codes).toContain("first_contact_overdue");
  });

  it("detects overdue follow-up", () => {
    const lead = baseLead({
      next_action_at: new Date(Date.now() - 3600_000).toISOString(),
      next_action_type: "CALL",
      first_contact_at: new Date().toISOString(),
    });
    const flags = evaluateLeadRisks(lead, [
      {
        id: "a1",
        lead_id: lead.id,
        activity_type: "call",
        direction: "outbound",
        title: "Called",
        body_summary: null,
        occurred_at: lead.first_contact_at!,
        created_by: "user_001",
        metadata_json: {},
        created_at: lead.first_contact_at!,
      },
    ]);
    expect(flags.map((f) => f.code)).toContain("follow_up_overdue");
  });

  it("detects nurture due and no-show recovery", () => {
    const nurture = baseLead({
      disposition: "NURTURE",
      nurture_until: new Date(Date.now() - 1000).toISOString(),
      next_action_at: new Date(Date.now() + 3600_000).toISOString(),
      next_action_type: "FOLLOW_UP",
      first_contact_at: new Date().toISOString(),
      stage: "CONNECTED",
    });
    expect(evaluateLeadRisks(nurture, []).map((f) => f.code)).toContain(
      "nurture_due",
    );

    const noShow = baseLead({
      disposition: "NO_SHOW",
      meeting_status: "no_show",
      next_action_type: "CALL",
      next_action_at: new Date(Date.now() + 3600_000).toISOString(),
      first_contact_at: new Date().toISOString(),
      stage: "CALL_BOOKED",
    });
    expect(evaluateLeadRisks(noShow, []).map((f) => f.code)).toContain(
      "no_show_recovery",
    );
  });

  it("detects needs reply when latest comm is inbound", () => {
    const lead = baseLead({
      stage: "CONNECTED",
      next_action_at: new Date(Date.now() + 3600_000).toISOString(),
      next_action_type: "CALL_NOW",
      first_contact_at: new Date(Date.now() - 7200_000).toISOString(),
    });
    const activities: Activity[] = [
      {
        id: "a1",
        lead_id: lead.id,
        activity_type: "call",
        direction: "outbound",
        title: "Called",
        body_summary: null,
        occurred_at: new Date(Date.now() - 7200_000).toISOString(),
        created_by: "user_001",
        metadata_json: {},
        created_at: new Date(Date.now() - 7200_000).toISOString(),
      },
      {
        id: "a2",
        lead_id: lead.id,
        activity_type: "reply",
        direction: "inbound",
        title: "Replied",
        body_summary: null,
        occurred_at: new Date(Date.now() - 600_000).toISOString(),
        created_by: null,
        metadata_json: {},
        created_at: new Date(Date.now() - 600_000).toISOString(),
      },
    ];
    expect(evaluateLeadRisks(lead, activities).map((f) => f.code)).toContain(
      "needs_reply",
    );
  });

  it("flags unmatched source events", () => {
    const event = {
      id: "evt",
      reconciliation_status: "unmatched",
      received_at: new Date(Date.now() - 48 * 3600_000).toISOString(),
      reconciliation_reason: "missing",
    } as LeadSourceEvent;
    expect(evaluateUnmatchedSourceEvent(event)?.code).toBe(
      "unmatched_source_event",
    );
  });
});

describe("source reconciliation + pipeline health", () => {
  it("shows Meta mismatch with potentially missing submissions", () => {
    resetDemoDatasetCache();
    const ds = getDemoDataset();
    const meta = ds.sources.find((s) => s.name === "Meta / Instagram")!;
    const summary = summarizeSourceIntegrity(meta, ds.sourceEvents, ds.leads);
    expect(summary.submissionsReceived).toBeGreaterThanOrEqual(41);
    expect(summary.missingCount).toBeGreaterThanOrEqual(1);
    expect(summary.health).toBe("critical");
  });

  it("detects duplicate reconciliation", () => {
    resetDemoDatasetCache();
    const dup = getDemoDataset().sourceEvents.find(
      (e) => e.reconciliation_status === "duplicate",
    );
    expect(dup).toBeTruthy();
  });

  it("calculates transparent pipeline health under 100 when violations exist", () => {
    resetDemoDatasetCache();
    const ds = getDemoDataset();
    const map = new Map<string, Activity[]>();
    for (const a of ds.activities) {
      const list = map.get(a.lead_id) ?? [];
      list.push(a);
      map.set(a.lead_id, list);
    }
    const health = calculatePipelineHealth(ds.leads, map, ds.sourceEvents);
    expect(health.score).toBeLessThan(100);
    expect(health.components.length).toBeGreaterThan(0);
    expect(health.activeCount).toBeGreaterThan(0);
  });
});
