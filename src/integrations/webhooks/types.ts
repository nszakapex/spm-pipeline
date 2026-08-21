import type {
  CanonicalIngestEventType,
  IngestChannel,
  LeadDisposition,
  LeadStage,
  MeetingStatus,
  NextActionType,
  SourceCategory,
} from "@/types/domain";
import type { ScoreInput } from "@/lib/scoring/score-lead";

export type CallOutcome =
  | "connected"
  | "voicemail"
  | "no_answer"
  | "busy"
  | "wrong_number"
  | "held"
  | "no_show";

export type ReplyChannel = "email" | "sms";

export type ReplyIntent =
  | "question"
  | "book"
  | "not_interested"
  | "timing"
  | "confirm"
  | "unknown";

export interface CallAnalysis {
  outcome: CallOutcome;
  kind?: "sales" | "strategy";
  durationSeconds?: number;
  askedAboutEnrollment?: boolean;
  requestedStrategyCall?: boolean;
  notInterested?: boolean;
  timingLater?: boolean;
  recap?: string;
  recommendedNextAction?: NextActionType;
}

export interface ReplyAnalysis {
  channel: ReplyChannel;
  intent: ReplyIntent;
  askedAboutEnrollment?: boolean;
  requestedStrategyCall?: boolean;
  summary?: string;
}

export interface MeetingAnalysis {
  status: MeetingStatus;
  startsAt?: string;
  calendar?: "jake" | "sales";
}

export interface CanonicalIngestEvent {
  channel: IngestChannel;
  type: CanonicalIngestEventType;
  externalEventId: string;
  occurredAt: string;
  identity: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    hubspotContactId?: string | null;
    hubspotDealId?: string | null;
    leadId?: string | null;
    ownerId?: string | null;
  };
  payloadSummary: Record<string, unknown>;
  call?: CallAnalysis;
  reply?: ReplyAnalysis;
  meeting?: MeetingAnalysis;
  source?: {
    category: SourceCategory;
    name: string;
    campaign?: string | null;
  };
  hubspot?: {
    objectType: string;
    objectId: string | null;
    propertyName?: string;
    propertyValue?: string;
    lifecycleStage?: string;
    dealStage?: string;
    leadStatus?: string;
  };
  qualification?: "qualified" | "not_qualified";
  jakeReady?: boolean;
  disposition?: LeadDisposition;
  targetStage?: LeadStage;
  scoreExtras?: Partial<ScoreInput>;
}
