export type UserRole = "admin" | "sales" | "viewer";

export type LeadStage =
  | "NEW"
  | "ATTEMPTING_CONTACT"
  | "CONNECTED"
  | "QUALIFIED"
  | "JAKE_READY"
  | "CALL_BOOKED"
  | "CALL_HELD"
  | "ENROLLMENT_PENDING"
  | "WON"
  | "LOST";

export type LeadDisposition =
  | "ACTIVE"
  | "NURTURE"
  | "NO_RESPONSE"
  | "NOT_QUALIFIED"
  | "NO_SHOW"
  | "INVALID_CONTACT";

export type ScoreBand = "P1" | "P2" | "P3" | "P4";

export type QualificationStatus =
  | "unknown"
  | "pending"
  | "qualified"
  | "not_qualified";

export type MeetingStatus =
  | "none"
  | "booked"
  | "held"
  | "no_show"
  | "canceled"
  | "rescheduled";

export type SyncStatus =
  | "not_synced"
  | "pending"
  | "synced"
  | "failed"
  | "conflict"
  | "stale";

export type NextActionType =
  | "CALL_NOW"
  | "CALL"
  | "EMAIL"
  | "TEXT"
  | "FOLLOW_UP"
  | "RESCHEDULE"
  | "QUALIFY"
  | "HANDOFF"
  | "BOOK_MEETING"
  | "REVIEW"
  | "OTHER";

export type SourceCategory =
  | "website"
  | "form"
  | "assessment"
  | "organic"
  | "paid_search"
  | "paid_social"
  | "referral_family"
  | "referral_jake"
  | "school_partner"
  | "ed_consultant"
  | "clinician_referral"
  | "tutoring_provider"
  | "community"
  | "event"
  | "inbound_phone"
  | "manual"
  | "other_campaign";

export type ReconciliationStatus =
  | "pending"
  | "matched"
  | "created"
  | "duplicate"
  | "unmatched"
  | "failed"
  | "ignored";

export type ProcessingStatus =
  | "received"
  | "normalized"
  | "processing"
  | "processed"
  | "error";

export type ActivityType =
  | "captured"
  | "assigned"
  | "call"
  | "email"
  | "sms"
  | "reply"
  | "note"
  | "stage_change"
  | "disposition_change"
  | "score_change"
  | "meeting_booked"
  | "meeting_held"
  | "no_show"
  | "followup_scheduled"
  | "sync_event";

export type ActivityDirection = "inbound" | "outbound" | "system" | "internal";

export type ScoreFactorType =
  | "intent"
  | "engagement"
  | "readiness"
  | "source_quality"
  | "negative";

export type SourceHealth = "healthy" | "warning" | "critical";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface SourceDefinition {
  id: string;
  name: string;
  category: SourceCategory;
  enabled: boolean;
  expected_sync_provider: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  owner_id: string | null;
  source: string;
  source_detail: string | null;
  source_definition_id: string | null;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  stage: LeadStage;
  disposition: LeadDisposition;
  score: number;
  score_band: ScoreBand;
  score_version: string;
  created_at: string;
  first_contact_at: string | null;
  last_contact_at: string | null;
  last_activity_at: string | null;
  next_action_at: string | null;
  next_action_type: NextActionType | null;
  next_action_note: string | null;
  qualification_status: QualificationStatus;
  qualification_reason: string | null;
  qualified_at: string | null;
  meeting_booked_at: string | null;
  meeting_status: MeetingStatus;
  nurture_reason: string | null;
  nurture_until: string | null;
  lost_reason: string | null;
  hubspot_contact_id: string | null;
  hubspot_lead_id: string | null;
  hubspot_deal_id: string | null;
  sync_status: SyncStatus;
  last_synced_at: string | null;
  updated_at: string;
}

export interface LeadSourceEvent {
  id: string;
  source_type: SourceCategory;
  source_name: string;
  source_detail: string | null;
  source_definition_id: string | null;
  external_event_id: string | null;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  received_at: string;
  raw_payload_summary_json: Record<string, unknown>;
  normalized_identity_json: {
    email?: string | null;
    phone?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
  processing_status: ProcessingStatus;
  matched_lead_id: string | null;
  hubspot_contact_id: string | null;
  hubspot_lead_id: string | null;
  reconciliation_status: ReconciliationStatus;
  reconciliation_reason: string | null;
  last_reconciliation_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadScoreFactor {
  id: string;
  lead_id: string;
  factor_type: ScoreFactorType;
  label: string;
  points: number;
  source: string;
  created_at: string;
}

export interface LeadScoreSnapshot {
  id: string;
  lead_id: string;
  score: number;
  band: ScoreBand;
  version: string;
  reason_summary: string;
  created_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  activity_type: ActivityType;
  direction: ActivityDirection;
  title: string;
  body_summary: string | null;
  occurred_at: string;
  created_by: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface IntegrationSyncEvent {
  id: string;
  provider: "hubspot";
  object_type: string;
  object_id: string | null;
  direction: "inbound" | "outbound";
  status: "success" | "failed" | "retrying" | "skipped";
  reason: string | null;
  attempted_at: string;
  completed_at: string | null;
  lead_id: string | null;
  source_event_id: string | null;
}

export interface SlaConfig {
  firstContactHours: number;
  staleStageDays: Record<LeadStage, number>;
  reconciliationHours: number;
  nurtureGraceHours: number;
}

export const TERMINAL_STAGES: LeadStage[] = ["WON", "LOST"];

export const OPEN_STAGES: LeadStage[] = [
  "NEW",
  "ATTEMPTING_CONTACT",
  "CONNECTED",
  "QUALIFIED",
  "JAKE_READY",
  "CALL_BOOKED",
  "CALL_HELD",
  "ENROLLMENT_PENDING",
];

export const STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "New",
  ATTEMPTING_CONTACT: "Attempting Contact",
  CONNECTED: "Connected",
  QUALIFIED: "Qualified",
  JAKE_READY: "Jake Ready",
  CALL_BOOKED: "Call Booked",
  CALL_HELD: "Call Held",
  ENROLLMENT_PENDING: "Enrollment Pending",
  WON: "Won",
  LOST: "Lost",
};

export const DISPOSITION_LABELS: Record<LeadDisposition, string> = {
  ACTIVE: "Active",
  NURTURE: "Nurture",
  NO_RESPONSE: "No Response",
  NOT_QUALIFIED: "Not Qualified",
  NO_SHOW: "No-Show",
  INVALID_CONTACT: "Invalid Contact",
};

export const SCORE_BAND_LABELS: Record<ScoreBand, string> = {
  P1: "P1 / Hot",
  P2: "P2 / High",
  P3: "P3 / Nurture",
  P4: "P4 / Low",
};

export const DEFAULT_SLA: SlaConfig = {
  firstContactHours: 4,
  reconciliationHours: 24,
  nurtureGraceHours: 0,
  staleStageDays: {
    NEW: 2,
    ATTEMPTING_CONTACT: 5,
    CONNECTED: 7,
    QUALIFIED: 5,
    JAKE_READY: 3,
    CALL_BOOKED: 2,
    CALL_HELD: 5,
    ENROLLMENT_PENDING: 7,
    WON: 365,
    LOST: 365,
  },
};
