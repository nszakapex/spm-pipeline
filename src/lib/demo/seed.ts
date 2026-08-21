import type {
  Activity,
  AppUser,
  IntegrationSyncEvent,
  Lead,
  LeadScoreFactor,
  LeadScoreSnapshot,
  LeadSourceEvent,
  SourceDefinition,
} from "@/types/domain";
import { scoreLead, type ScoreInput } from "@/lib/scoring/score-lead";

/** Fixed "now" anchor for deterministic demo timelines relative to runtime. */
export function demoNow(): Date {
  return new Date();
}

function hoursAgo(h: number, now = demoNow()): string {
  return new Date(now.getTime() - h * 3600_000).toISOString();
}

function daysAgo(d: number, now = demoNow()): string {
  return hoursAgo(d * 24, now);
}

function hoursFromNow(h: number, now = demoNow()): string {
  return new Date(now.getTime() + h * 3600_000).toISOString();
}

function id(prefix: string, n: number): string {
  return `${prefix}_${String(n).padStart(3, "0")}`;
}

export interface DemoDataset {
  users: AppUser[];
  sources: SourceDefinition[];
  leads: Lead[];
  sourceEvents: LeadSourceEvent[];
  scoreFactors: LeadScoreFactor[];
  scoreSnapshots: LeadScoreSnapshot[];
  activities: Activity[];
  syncEvents: IntegrationSyncEvent[];
}

const USERS: AppUser[] = [
  {
    id: "user_001",
    email: "max.sussman@example.spm-pipeline.local",
    name: "Max Sussman",
    role: "sales",
    created_at: daysAgo(120),
  },
  {
    id: "user_002",
    email: "mack.ianni@example.spm-pipeline.local",
    name: "Mack Ianni",
    role: "sales",
    created_at: daysAgo(90),
  },
  {
    id: "user_003",
    email: "nate.szakallas@example.spm-pipeline.local",
    name: "Nate Szakallas",
    role: "admin",
    created_at: daysAgo(200),
  },
];

const SOURCES: SourceDefinition[] = [
  {
    id: "src_001",
    name: "Main Website",
    category: "website",
    enabled: true,
    expected_sync_provider: "hubspot",
    created_at: daysAgo(200),
    updated_at: daysAgo(10),
  },
  {
    id: "src_002",
    name: "Find the Right Mentor",
    category: "form",
    enabled: true,
    expected_sync_provider: "hubspot",
    created_at: daysAgo(200),
    updated_at: daysAgo(2),
  },
  {
    id: "src_003",
    name: "Google Ads",
    category: "paid_search",
    enabled: true,
    expected_sync_provider: "hubspot",
    created_at: daysAgo(150),
    updated_at: daysAgo(1),
  },
  {
    id: "src_004",
    name: "Meta / Instagram",
    category: "paid_social",
    enabled: true,
    expected_sync_provider: "hubspot",
    created_at: daysAgo(150),
    updated_at: hoursAgo(6),
  },
  {
    id: "src_005",
    name: "Organic Search",
    category: "organic",
    enabled: true,
    expected_sync_provider: "hubspot",
    created_at: daysAgo(200),
    updated_at: daysAgo(3),
  },
  {
    id: "src_006",
    name: "Existing-family Referral",
    category: "referral_family",
    enabled: true,
    expected_sync_provider: "hubspot",
    created_at: daysAgo(200),
    updated_at: daysAgo(5),
  },
  {
    id: "src_007",
    name: "Jake Referral",
    category: "referral_jake",
    enabled: true,
    expected_sync_provider: "manual",
    created_at: daysAgo(200),
    updated_at: daysAgo(1),
  },
  {
    id: "src_008",
    name: "School Partner",
    category: "school_partner",
    enabled: true,
    expected_sync_provider: "hubspot",
    created_at: daysAgo(180),
    updated_at: daysAgo(8),
  },
  {
    id: "src_009",
    name: "Educational Consultant",
    category: "ed_consultant",
    enabled: true,
    expected_sync_provider: "hubspot",
    created_at: daysAgo(180),
    updated_at: daysAgo(12),
  },
  {
    id: "src_010",
    name: "Inbound Phone",
    category: "inbound_phone",
    enabled: true,
    expected_sync_provider: "manual",
    created_at: daysAgo(200),
    updated_at: daysAgo(4),
  },
  {
    id: "src_011",
    name: "Manual Entry",
    category: "manual",
    enabled: true,
    expected_sync_provider: "manual",
    created_at: daysAgo(200),
    updated_at: daysAgo(20),
  },
];

type LeadSeed = {
  n: number;
  first: string;
  last: string;
  email: string | null;
  phone: string | null;
  owner?: string | null;
  sourceId: string;
  sourceName: string;
  sourceDetail?: string | null;
  campaign?: string | null;
  utm?: { source?: string; medium?: string; campaign?: string };
  stage: Lead["stage"];
  disposition: Lead["disposition"];
  createdHoursAgo: number;
  firstContactHoursAgo?: number | null;
  lastContactHoursAgo?: number | null;
  nextActionHoursFromNow?: number | null;
  nextActionType?: Lead["next_action_type"];
  nextActionNote?: string | null;
  qualification?: Lead["qualification_status"];
  qualificationReason?: string | null;
  meetingStatus?: Lead["meeting_status"];
  meetingBookedHoursAgo?: number | null;
  nurtureReason?: string | null;
  nurtureUntilHoursFromNow?: number | null;
  lostReason?: string | null;
  hubspot?: {
    contact?: string | null;
    lead?: string | null;
    deal?: string | null;
    sync: Lead["sync_status"];
    syncedHoursAgo?: number | null;
  };
  scoreInput: ScoreInput;
  attentionWhy?: string;
};

const LEAD_SEEDS: LeadSeed[] = [
  {
    n: 1,
    first: "Sarah",
    last: "Thompson",
    email: "sarah.thompson@example.com",
    phone: "+1-555-010-2144",
    owner: "user_001",
    sourceId: "src_007",
    sourceName: "Jake Referral",
    sourceDetail: "Referred after community talk",
    stage: "CONNECTED",
    disposition: "ACTIVE",
    createdHoursAgo: 6,
    firstContactHoursAgo: 5,
    lastContactHoursAgo: 0.3,
    nextActionHoursFromNow: -0.1,
    nextActionType: "CALL_NOW",
    nextActionNote: "Call now — replied 18 minutes ago",
    qualification: "pending",
    meetingStatus: "none",
    hubspot: { contact: "HS-C-1001", sync: "synced", syncedHoursAgo: 5.5 },
    scoreInput: {
      requestedStrategyCall: true,
      repliedToday: true,
      repliedToOutreach: true,
      jakeReferral: true,
      lookingToStartSoon: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      multipleEngagements: true,
      activelySeekingMentorship: true,
    },
    attentionWhy: "Replied 18 minutes ago",
  },
  {
    n: 2,
    first: "Michael",
    last: "Reynolds",
    email: "m.reynolds@example.com",
    phone: "+1-555-010-8831",
    owner: "user_002",
    sourceId: "src_002",
    sourceName: "Find the Right Mentor",
    campaign: "strategy_call_q3",
    utm: { source: "website", medium: "form", campaign: "find_mentor" },
    stage: "CALL_BOOKED",
    disposition: "NO_SHOW",
    createdHoursAgo: 96,
    firstContactHoursAgo: 90,
    lastContactHoursAgo: 28,
    nextActionHoursFromNow: null,
    nextActionType: null,
    meetingStatus: "no_show",
    meetingBookedHoursAgo: 48,
    qualification: "qualified",
    qualificationReason: "Fit confirmed on discovery call",
    hubspot: { contact: "HS-C-1002", deal: "HS-D-220", sync: "synced", syncedHoursAgo: 20 },
    scoreInput: {
      requestedStrategyCall: true,
      bookedMeeting: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      unrecoveredNoShow: true,
      activelySeekingMentorship: true,
    },
    attentionWhy: "No-show yesterday",
  },
  {
    n: 3,
    first: "Amanda",
    last: "Chen",
    email: "amanda.chen@example.com",
    phone: "+1-555-010-4412",
    owner: "user_001",
    sourceId: "src_006",
    sourceName: "Existing-family Referral",
    sourceDetail: "Referred by the Patel family",
    stage: "CONNECTED",
    disposition: "NURTURE",
    createdHoursAgo: 40 * 24,
    firstContactHoursAgo: 39 * 24,
    lastContactHoursAgo: 32 * 24,
    nextActionHoursFromNow: 2,
    nextActionType: "FOLLOW_UP",
    nextActionNote: "Reconnect after school starts",
    nurtureReason: "Asked to reconnect after school starts",
    nurtureUntilHoursFromNow: 1,
    qualification: "pending",
    meetingStatus: "none",
    hubspot: { contact: "HS-C-1003", sync: "synced", syncedHoursAgo: 30 * 24 },
    scoreInput: {
      existingFamilyReferral: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      longTermTiming: true,
      repliedToOutreach: true,
      requestedMoreInfo: true,
    },
    attentionWhy: "Asked to reconnect this week",
  },
  {
    n: 4,
    first: "David",
    last: "Okoro",
    email: "david.okoro@example.com",
    phone: "+1-555-010-7720",
    owner: null,
    sourceId: "src_004",
    sourceName: "Meta / Instagram",
    campaign: "ig_spring_awareness",
    utm: { source: "instagram", medium: "paid", campaign: "ig_spring" },
    stage: "NEW",
    disposition: "ACTIVE",
    createdHoursAgo: 9,
    firstContactHoursAgo: null,
    lastContactHoursAgo: null,
    nextActionHoursFromNow: -2,
    nextActionType: "CALL",
    hubspot: { contact: "HS-C-1004", sync: "synced", syncedHoursAgo: 8.5 },
    scoreInput: {
      requestedStrategyCall: true,
      completeContactInfo: true,
      activelySeekingMentorship: true,
    },
    attentionWhy: "Hot inbound — no owner",
  },
  {
    n: 5,
    first: "Priya",
    last: "Shah",
    email: "priya.shah@example.com",
    phone: "+1-555-010-3398",
    owner: "user_002",
    sourceId: "src_003",
    sourceName: "Google Ads",
    campaign: "brand_search",
    utm: { source: "google", medium: "cpc", campaign: "brand" },
    stage: "ATTEMPTING_CONTACT",
    disposition: "ACTIVE",
    createdHoursAgo: 30,
    firstContactHoursAgo: null,
    nextActionHoursFromNow: -6,
    nextActionType: "CALL",
    hubspot: { contact: null, sync: "failed", syncedHoursAgo: null },
    scoreInput: {
      requestedMoreInfo: true,
      completeContactInfo: true,
    },
    attentionWhy: "HubSpot sync failed",
  },
  {
    n: 6,
    first: "Elena",
    last: "Vargas",
    email: "elena.vargas@example.com",
    phone: "+1-555-010-5566",
    owner: "user_001",
    sourceId: "src_008",
    sourceName: "School Partner",
    sourceDetail: "Aspen Learning referral",
    stage: "JAKE_READY",
    disposition: "ACTIVE",
    createdHoursAgo: 14 * 24,
    firstContactHoursAgo: 13 * 24,
    lastContactHoursAgo: 6,
    nextActionHoursFromNow: 4,
    nextActionType: "HANDOFF",
    nextActionNote: "Send Jake-ready brief",
    qualification: "qualified",
    qualificationReason: "Strong fit; parent ready for founder call",
    meetingStatus: "none",
    hubspot: { contact: "HS-C-1006", lead: "HS-L-506", sync: "synced", syncedHoursAgo: 5 },
    scoreInput: {
      requestedStrategyCall: true,
      askedAboutEnrollment: true,
      lookingToStartSoon: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      trustedPartnerReferral: true,
      multipleEngagements: true,
      repliedToOutreach: true,
    },
    attentionWhy: "Jake-ready handoff",
  },
  {
    n: 7,
    first: "James",
    last: "Whitfield",
    email: "j.whitfield@example.com",
    phone: "+1-555-010-9012",
    owner: "user_002",
    sourceId: "src_005",
    sourceName: "Organic Search",
    utm: { source: "google", medium: "organic", campaign: "(none)" },
    stage: "QUALIFIED",
    disposition: "ACTIVE",
    createdHoursAgo: 10 * 24,
    firstContactHoursAgo: 9 * 24,
    lastContactHoursAgo: 20,
    nextActionHoursFromNow: 8,
    nextActionType: "BOOK_MEETING",
    qualification: "qualified",
    meetingStatus: "none",
    hubspot: { contact: "HS-C-1007", sync: "synced", syncedHoursAgo: 18 },
    scoreInput: {
      activelySeekingMentorship: true,
      lookingToStartSoon: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      repliedToOutreach: true,
      historicallyStrongSource: true,
    },
  },
  {
    n: 8,
    first: "Natalie",
    last: "Brooks",
    email: "natalie.brooks@example.com",
    phone: "+1-555-010-1188",
    owner: "user_001",
    sourceId: "src_002",
    sourceName: "Find the Right Mentor",
    stage: "CALL_BOOKED",
    disposition: "ACTIVE",
    createdHoursAgo: 7 * 24,
    firstContactHoursAgo: 6 * 24,
    lastContactHoursAgo: 12,
    nextActionHoursFromNow: 36,
    nextActionType: "CALL",
    nextActionNote: "Strategy call Thursday",
    qualification: "qualified",
    meetingStatus: "booked",
    meetingBookedHoursAgo: 12,
    hubspot: { contact: "HS-C-1008", deal: "HS-D-228", sync: "synced", syncedHoursAgo: 11 },
    scoreInput: {
      requestedStrategyCall: true,
      bookedMeeting: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      lookingToStartSoon: true,
    },
  },
  {
    n: 9,
    first: "Robert",
    last: "Nguyen",
    email: "robert.nguyen@example.com",
    phone: "+1-555-010-6677",
    owner: "user_002",
    sourceId: "src_003",
    sourceName: "Google Ads",
    stage: "CALL_HELD",
    disposition: "ACTIVE",
    createdHoursAgo: 18 * 24,
    firstContactHoursAgo: 17 * 24,
    lastContactHoursAgo: 48,
    nextActionHoursFromNow: 24,
    nextActionType: "FOLLOW_UP",
    qualification: "qualified",
    meetingStatus: "held",
    meetingBookedHoursAgo: 72,
    hubspot: { contact: "HS-C-1009", deal: "HS-D-231", sync: "synced", syncedHoursAgo: 40 },
    scoreInput: {
      requestedStrategyCall: true,
      bookedMeeting: true,
      askedAboutEnrollment: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      multipleEngagements: true,
    },
  },
  {
    n: 10,
    first: "Olivia",
    last: "Martinez",
    email: "olivia.martinez@example.com",
    phone: "+1-555-010-2245",
    owner: "user_001",
    sourceId: "src_006",
    sourceName: "Existing-family Referral",
    stage: "ENROLLMENT_PENDING",
    disposition: "ACTIVE",
    createdHoursAgo: 25 * 24,
    firstContactHoursAgo: 24 * 24,
    lastContactHoursAgo: 30,
    nextActionHoursFromNow: 12,
    nextActionType: "FOLLOW_UP",
    nextActionNote: "Confirm paperwork",
    qualification: "qualified",
    meetingStatus: "held",
    hubspot: { contact: "HS-C-1010", deal: "HS-D-240", sync: "synced", syncedHoursAgo: 28 },
    scoreInput: {
      existingFamilyReferral: true,
      askedAboutEnrollment: true,
      bookedMeeting: true,
      lookingToStartSoon: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      multipleEngagements: true,
    },
  },
  {
    n: 11,
    first: "Daniel",
    last: "Foster",
    email: "daniel.foster@example.com",
    phone: "+1-555-010-8890",
    owner: "user_003",
    sourceId: "src_007",
    sourceName: "Jake Referral",
    stage: "WON",
    disposition: "ACTIVE",
    createdHoursAgo: 45 * 24,
    firstContactHoursAgo: 44 * 24,
    lastContactHoursAgo: 5 * 24,
    nextActionHoursFromNow: null,
    nextActionType: null,
    qualification: "qualified",
    meetingStatus: "held",
    hubspot: { contact: "HS-C-1011", deal: "HS-D-250", sync: "synced", syncedHoursAgo: 5 * 24 },
    scoreInput: {
      jakeReferral: true,
      askedAboutEnrollment: true,
      bookedMeeting: true,
      lookingToStartSoon: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      multipleEngagements: true,
    },
  },
  {
    n: 12,
    first: "Hannah",
    last: "Klein",
    email: "hannah.klein@example.com",
    phone: "+1-555-010-3340",
    owner: "user_002",
    sourceId: "src_004",
    sourceName: "Meta / Instagram",
    stage: "LOST",
    disposition: "NOT_QUALIFIED",
    createdHoursAgo: 35 * 24,
    firstContactHoursAgo: 34 * 24,
    lastContactHoursAgo: 20 * 24,
    nextActionHoursFromNow: null,
    lostReason: "Budget timing — revisit next year",
    qualification: "not_qualified",
    hubspot: { contact: "HS-C-1012", sync: "synced", syncedHoursAgo: 20 * 24 },
    scoreInput: {
      requestedMoreInfo: true,
      explicitLackOfInterest: true,
      completeContactInfo: true,
    },
  },
  {
    n: 13,
    first: "Chris",
    last: "Patel",
    email: null,
    phone: "+1-555-010-0000",
    owner: "user_001",
    sourceId: "src_004",
    sourceName: "Meta / Instagram",
    stage: "NEW",
    disposition: "INVALID_CONTACT",
    createdHoursAgo: 50,
    nextActionHoursFromNow: null,
    hubspot: { contact: "HS-C-1013", sync: "conflict", syncedHoursAgo: 48 },
    scoreInput: {
      invalidContactInfo: true,
      requestedMoreInfo: true,
    },
  },
  {
    n: 14,
    first: "Lauren",
    last: "Bishop",
    email: "lauren.bishop@example.com",
    phone: "+1-555-010-7781",
    owner: "user_002",
    sourceId: "src_001",
    sourceName: "Main Website",
    sourceDetail: "missing",
    stage: "ATTEMPTING_CONTACT",
    disposition: "NO_RESPONSE",
    createdHoursAgo: 12 * 24,
    firstContactHoursAgo: 11 * 24,
    lastContactHoursAgo: 8 * 24,
    nextActionHoursFromNow: 72,
    nextActionType: "EMAIL",
    hubspot: { contact: "HS-C-1014", sync: "synced", syncedHoursAgo: 8 * 24 },
    scoreInput: {
      completeContactInfo: true,
      repeatedNoResponseCount: 3,
      requestedMoreInfo: true,
    },
  },
  {
    n: 15,
    first: "Marcus",
    last: "Ellison",
    email: "marcus.ellison@example.com",
    phone: "+1-555-010-4521",
    owner: "user_001",
    sourceId: "src_009",
    sourceName: "Educational Consultant",
    sourceDetail: "IECA partner intro",
    stage: "CONNECTED",
    disposition: "ACTIVE",
    createdHoursAgo: 5 * 24,
    firstContactHoursAgo: 4 * 24,
    lastContactHoursAgo: 3,
    nextActionHoursFromNow: 5,
    nextActionType: "QUALIFY",
    qualification: "pending",
    hubspot: { contact: "HS-C-1015", sync: "synced", syncedHoursAgo: 2 },
    scoreInput: {
      trustedPartnerReferral: true,
      requestedStrategyCall: true,
      completeContactInfo: true,
      decisionMakerEngaged: true,
      repliedToday: true,
    },
    attentionWhy: "High-intent consultant referral",
  },
];

// Expand to 45+ leads with varied scenarios
const EXTRA_NAMES: Array<[string, string]> = [
  ["Grace", "Holloway"],
  ["Benjamin", "Cho"],
  ["Sofia", "Ramirez"],
  ["Andrew", "Peters"],
  ["Michelle", "Grant"],
  ["Kevin", "Sullivan"],
  ["Rachel", "Kim"],
  ["Thomas", "Adler"],
  ["Jessica", "Morales"],
  ["Brian", "Hale"],
  ["Stephanie", "Quinn"],
  ["Eric", "Donovan"],
  ["Catherine", "Liu"],
  ["Patrick", "O'Neill"],
  ["Megan", "Fraser"],
  ["Jonathan", "Berg"],
  ["Danielle", "Costa"],
  ["Samuel", "Wright"],
  ["Angela", "Diaz"],
  ["Peter", "Hofmann"],
  ["Christina", "Bailey"],
  ["Mark", "Jensen"],
  ["Laura", "Singh"],
  ["Timothy", "Ross"],
  ["Nicole", "Harper"],
  ["Jeffrey", "Walsh"],
  ["Rebecca", "Stone"],
  ["Steven", "Clarke"],
  ["Katherine", "Mills"],
  ["Anthony", "Reed"],
];

const EXTRA_SCENARIOS: Array<Partial<LeadSeed> & { stage: Lead["stage"]; disposition: Lead["disposition"]; sourceId: string; sourceName: string }> = [
  { stage: "NEW", disposition: "ACTIVE", sourceId: "src_004", sourceName: "Meta / Instagram", createdHoursAgo: 2, owner: "user_001", nextActionHoursFromNow: 1, nextActionType: "CALL", scoreInput: { requestedStrategyCall: true, completeContactInfo: true } },
  { stage: "NEW", disposition: "ACTIVE", sourceId: "src_003", sourceName: "Google Ads", createdHoursAgo: 14, owner: "user_002", nextActionHoursFromNow: -1, nextActionType: "CALL", firstContactHoursAgo: null, scoreInput: { requestedMoreInfo: true, completeContactInfo: true } },
  { stage: "ATTEMPTING_CONTACT", disposition: "ACTIVE", sourceId: "src_005", sourceName: "Organic Search", createdHoursAgo: 48, owner: "user_001", firstContactHoursAgo: 40, nextActionHoursFromNow: 6, nextActionType: "EMAIL", scoreInput: { completeContactInfo: true, historicallyStrongSource: true } },
  { stage: "CONNECTED", disposition: "NURTURE", sourceId: "src_001", sourceName: "Main Website", createdHoursAgo: 20 * 24, owner: "user_002", firstContactHoursAgo: 19 * 24, lastContactHoursAgo: 15 * 24, nurtureUntilHoursFromNow: -5, nurtureReason: "Budget review in fall", nextActionHoursFromNow: -5, nextActionType: "FOLLOW_UP", scoreInput: { longTermTiming: true, completeContactInfo: true, requestedMoreInfo: true } },
  { stage: "QUALIFIED", disposition: "ACTIVE", sourceId: "src_008", sourceName: "School Partner", createdHoursAgo: 9 * 24, owner: "user_001", qualification: "qualified", nextActionHoursFromNow: 10, nextActionType: "HANDOFF", scoreInput: { trustedPartnerReferral: true, lookingToStartSoon: true, completeContactInfo: true, decisionMakerEngaged: true } },
  { stage: "JAKE_READY", disposition: "ACTIVE", sourceId: "src_007", sourceName: "Jake Referral", createdHoursAgo: 6 * 24, owner: "user_003", qualification: "qualified", nextActionHoursFromNow: 2, nextActionType: "HANDOFF", scoreInput: { jakeReferral: true, requestedStrategyCall: true, lookingToStartSoon: true, completeContactInfo: true } },
  { stage: "CALL_BOOKED", disposition: "ACTIVE", sourceId: "src_002", sourceName: "Find the Right Mentor", createdHoursAgo: 4 * 24, owner: "user_001", meetingStatus: "booked", meetingBookedHoursAgo: 20, nextActionHoursFromNow: 28, nextActionType: "CALL", scoreInput: { bookedMeeting: true, requestedStrategyCall: true, completeContactInfo: true } },
  { stage: "CALL_HELD", disposition: "ACTIVE", sourceId: "src_006", sourceName: "Existing-family Referral", createdHoursAgo: 15 * 24, owner: "user_002", meetingStatus: "held", qualification: "qualified", nextActionHoursFromNow: 18, nextActionType: "FOLLOW_UP", scoreInput: { existingFamilyReferral: true, bookedMeeting: true, askedAboutEnrollment: true, completeContactInfo: true } },
  { stage: "ENROLLMENT_PENDING", disposition: "ACTIVE", sourceId: "src_009", sourceName: "Educational Consultant", createdHoursAgo: 22 * 24, owner: "user_001", meetingStatus: "held", qualification: "qualified", nextActionHoursFromNow: 8, nextActionType: "FOLLOW_UP", scoreInput: { trustedPartnerReferral: true, askedAboutEnrollment: true, bookedMeeting: true, lookingToStartSoon: true, completeContactInfo: true } },
  { stage: "WON", disposition: "ACTIVE", sourceId: "src_006", sourceName: "Existing-family Referral", createdHoursAgo: 60 * 24, owner: "user_001", meetingStatus: "held", qualification: "qualified", nextActionHoursFromNow: null, scoreInput: { existingFamilyReferral: true, bookedMeeting: true, askedAboutEnrollment: true, completeContactInfo: true } },
  { stage: "LOST", disposition: "NO_RESPONSE", sourceId: "src_003", sourceName: "Google Ads", createdHoursAgo: 50 * 24, owner: "user_002", lostReason: "Unresponsive after 6 attempts", nextActionHoursFromNow: null, scoreInput: { repeatedNoResponseCount: 3, completeContactInfo: true } },
  { stage: "CONNECTED", disposition: "ACTIVE", sourceId: "src_010", sourceName: "Inbound Phone", createdHoursAgo: 36, owner: "user_001", firstContactHoursAgo: 35, lastContactHoursAgo: 2, nextActionHoursFromNow: 3, nextActionType: "CALL_NOW", scoreInput: { requestedStrategyCall: true, repliedToday: true, completeContactInfo: true, decisionMakerEngaged: true } },
  { stage: "ATTEMPTING_CONTACT", disposition: "ACTIVE", sourceId: "src_004", sourceName: "Meta / Instagram", createdHoursAgo: 72, owner: null, nextActionHoursFromNow: null, firstContactHoursAgo: null, scoreInput: { requestedMoreInfo: true, completeContactInfo: true } },
  { stage: "NEW", disposition: "ACTIVE", sourceId: "src_011", sourceName: "Manual Entry", sourceDetail: "missing", createdHoursAgo: 8, owner: "user_002", nextActionHoursFromNow: 2, nextActionType: "REVIEW", scoreInput: { completeContactInfo: false } },
  { stage: "CONNECTED", disposition: "NURTURE", sourceId: "src_005", sourceName: "Organic Search", createdHoursAgo: 28 * 24, owner: "user_001", nurtureUntilHoursFromNow: 48, nurtureReason: "Revisit after IEP meeting", nextActionHoursFromNow: 48, nextActionType: "FOLLOW_UP", scoreInput: { longTermTiming: true, completeContactInfo: true, historicallyStrongSource: true } },
  { stage: "QUALIFIED", disposition: "ACTIVE", sourceId: "src_002", sourceName: "Find the Right Mentor", createdHoursAgo: 8 * 24, owner: "user_002", qualification: "qualified", nextActionHoursFromNow: -12, nextActionType: "BOOK_MEETING", scoreInput: { requestedStrategyCall: true, lookingToStartSoon: true, completeContactInfo: true } },
  { stage: "ATTEMPTING_CONTACT", disposition: "NO_RESPONSE", sourceId: "src_001", sourceName: "Main Website", createdHoursAgo: 16 * 24, owner: "user_001", firstContactHoursAgo: 15 * 24, nextActionHoursFromNow: 96, nextActionType: "EMAIL", scoreInput: { repeatedNoResponseCount: 2, completeContactInfo: true } },
  { stage: "CALL_BOOKED", disposition: "NO_SHOW", sourceId: "src_003", sourceName: "Google Ads", createdHoursAgo: 11 * 24, owner: "user_002", meetingStatus: "no_show", nextActionType: "RESCHEDULE", nextActionHoursFromNow: 4, scoreInput: { bookedMeeting: true, unrecoveredNoShow: false, completeContactInfo: true, requestedStrategyCall: true } },
  { stage: "NEW", disposition: "ACTIVE", sourceId: "src_004", sourceName: "Meta / Instagram", createdHoursAgo: 5, owner: "user_001", nextActionHoursFromNow: 0.5, nextActionType: "CALL", scoreInput: { requestedStrategyCall: true, completeContactInfo: true, activelySeekingMentorship: true } },
  { stage: "CONNECTED", disposition: "ACTIVE", sourceId: "src_007", sourceName: "Jake Referral", createdHoursAgo: 3 * 24, owner: "user_003", lastContactHoursAgo: 1, nextActionHoursFromNow: 6, nextActionType: "QUALIFY", scoreInput: { jakeReferral: true, repliedToOutreach: true, completeContactInfo: true, decisionMakerEngaged: true } },
  { stage: "JAKE_READY", disposition: "ACTIVE", sourceId: "src_008", sourceName: "School Partner", createdHoursAgo: 12 * 24, owner: "user_001", qualification: "qualified", nextActionHoursFromNow: 1, nextActionType: "HANDOFF", scoreInput: { trustedPartnerReferral: true, lookingToStartSoon: true, askedAboutEnrollment: true, completeContactInfo: true } },
  { stage: "WON", disposition: "ACTIVE", sourceId: "src_002", sourceName: "Find the Right Mentor", createdHoursAgo: 70 * 24, owner: "user_002", meetingStatus: "held", qualification: "qualified", nextActionHoursFromNow: null, scoreInput: { bookedMeeting: true, askedAboutEnrollment: true, completeContactInfo: true } },
  { stage: "LOST", disposition: "NOT_QUALIFIED", sourceId: "src_005", sourceName: "Organic Search", createdHoursAgo: 40 * 24, owner: "user_001", lostReason: "Seeking tutoring only", qualification: "not_qualified", nextActionHoursFromNow: null, scoreInput: { explicitLackOfInterest: true, completeContactInfo: true } },
  { stage: "ENROLLMENT_PENDING", disposition: "ACTIVE", sourceId: "src_007", sourceName: "Jake Referral", createdHoursAgo: 30 * 24, owner: "user_003", meetingStatus: "held", qualification: "qualified", nextActionHoursFromNow: 20, nextActionType: "FOLLOW_UP", scoreInput: { jakeReferral: true, askedAboutEnrollment: true, bookedMeeting: true, completeContactInfo: true } },
  { stage: "ATTEMPTING_CONTACT", disposition: "ACTIVE", sourceId: "src_004", sourceName: "Meta / Instagram", createdHoursAgo: 20, owner: "user_002", firstContactHoursAgo: 18, nextActionHoursFromNow: -3, nextActionType: "TEXT", scoreInput: { requestedMoreInfo: true, completeContactInfo: true } },
  { stage: "CONNECTED", disposition: "ACTIVE", sourceId: "src_010", sourceName: "Inbound Phone", createdHoursAgo: 60, owner: "user_001", firstContactHoursAgo: 59, lastContactHoursAgo: 0.5, nextActionHoursFromNow: 1, nextActionType: "CALL_NOW", scoreInput: { requestedStrategyCall: true, repliedToday: true, completeContactInfo: true } },
  { stage: "NEW", disposition: "ACTIVE", sourceId: "src_003", sourceName: "Google Ads", createdHoursAgo: 26, owner: "user_001", nextActionHoursFromNow: null, firstContactHoursAgo: null, scoreInput: { completeContactInfo: true, requestedMoreInfo: true } },
  { stage: "QUALIFIED", disposition: "NURTURE", sourceId: "src_009", sourceName: "Educational Consultant", createdHoursAgo: 24 * 24, owner: "user_002", qualification: "qualified", nurtureUntilHoursFromNow: 10, nurtureReason: "Traveling until next month", nextActionHoursFromNow: 10, nextActionType: "FOLLOW_UP", scoreInput: { trustedPartnerReferral: true, longTermTiming: true, completeContactInfo: true } },
  { stage: "CALL_HELD", disposition: "ACTIVE", sourceId: "src_001", sourceName: "Main Website", createdHoursAgo: 13 * 24, owner: "user_001", meetingStatus: "held", qualification: "qualified", nextActionHoursFromNow: 30, nextActionType: "FOLLOW_UP", scoreInput: { bookedMeeting: true, askedAboutEnrollment: true, completeContactInfo: true } },
  { stage: "CONNECTED", disposition: "ACTIVE", sourceId: "src_006", sourceName: "Existing-family Referral", createdHoursAgo: 2 * 24, owner: "user_002", lastContactHoursAgo: 4, nextActionHoursFromNow: 7, nextActionType: "CALL", scoreInput: { existingFamilyReferral: true, repliedToOutreach: true, completeContactInfo: true, lookingToStartSoon: true } },
];

function buildExtraSeeds(): LeadSeed[] {
  return EXTRA_SCENARIOS.map((scenario, idx) => {
    const [first, last] = EXTRA_NAMES[idx] ?? [`Parent${idx}`, `Family${idx}`];
    const n = 16 + idx;
    return {
      n,
      first,
      last,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
      phone: `+1-555-01${String(1000 + n).slice(-2)}-${String(2000 + n * 3).slice(-4)}`,
      owner: scenario.owner ?? "user_001",
      sourceId: scenario.sourceId,
      sourceName: scenario.sourceName,
      sourceDetail: scenario.sourceDetail ?? null,
      campaign: scenario.campaign ?? null,
      stage: scenario.stage,
      disposition: scenario.disposition,
      createdHoursAgo: scenario.createdHoursAgo ?? 48,
      firstContactHoursAgo: scenario.firstContactHoursAgo,
      lastContactHoursAgo: scenario.lastContactHoursAgo,
      nextActionHoursFromNow: scenario.nextActionHoursFromNow,
      nextActionType: scenario.nextActionType ?? null,
      nextActionNote: scenario.nextActionNote ?? null,
      qualification: scenario.qualification ?? "unknown",
      qualificationReason: scenario.qualificationReason ?? null,
      meetingStatus: scenario.meetingStatus ?? "none",
      meetingBookedHoursAgo: scenario.meetingBookedHoursAgo,
      nurtureReason: scenario.nurtureReason ?? null,
      nurtureUntilHoursFromNow: scenario.nurtureUntilHoursFromNow,
      lostReason: scenario.lostReason ?? null,
      hubspot: scenario.hubspot ?? {
        contact: `HS-C-${1100 + n}`,
        sync: "synced" as const,
        syncedHoursAgo: 12,
      },
      scoreInput: scenario.scoreInput ?? { completeContactInfo: true },
      attentionWhy: scenario.attentionWhy,
      utm: scenario.utm,
    };
  });
}

function buildLead(seed: LeadSeed): {
  lead: Lead;
  factors: LeadScoreFactor[];
  snapshot: LeadScoreSnapshot;
  activities: Activity[];
} {
  const created_at = hoursAgo(seed.createdHoursAgo);
  const scored = scoreLead(seed.scoreInput);
  const leadId = id("lead", seed.n);
  const updated_at = hoursAgo(
    seed.lastContactHoursAgo ?? Math.min(seed.createdHoursAgo, 6),
  );

  // Special case: missing attribution demo
  const source =
    seed.sourceDetail === "missing" && seed.n === 14
      ? "missing"
      : seed.n === 45 || seed.sourceDetail === "missing"
        ? seed.n === 29
          ? "missing"
          : seed.sourceName
        : seed.sourceName;

  const lead: Lead = {
    id: leadId,
    first_name: seed.first,
    last_name: seed.last,
    email: seed.email,
    phone: seed.phone,
    owner_id: seed.owner === undefined ? "user_001" : seed.owner,
    source: seed.n === 29 ? "missing" : source === "missing" && seed.n !== 14 ? seed.sourceName : seed.n === 14 ? "missing" : seed.sourceName,
    source_detail: seed.sourceDetail ?? null,
    source_definition_id: seed.sourceId,
    campaign: seed.campaign ?? null,
    utm_source: seed.utm?.source ?? null,
    utm_medium: seed.utm?.medium ?? null,
    utm_campaign: seed.utm?.campaign ?? null,
    stage: seed.stage,
    disposition: seed.disposition,
    score: scored.score,
    score_band: scored.band,
    score_version: scored.version,
    created_at,
    first_contact_at:
      seed.firstContactHoursAgo === null
        ? null
        : seed.firstContactHoursAgo !== undefined
          ? hoursAgo(seed.firstContactHoursAgo)
          : seed.stage === "NEW"
            ? null
            : hoursAgo(seed.createdHoursAgo - 1),
    last_contact_at:
      seed.lastContactHoursAgo != null
        ? hoursAgo(seed.lastContactHoursAgo)
        : null,
    last_activity_at: updated_at,
    next_action_at:
      seed.nextActionHoursFromNow === null || seed.nextActionHoursFromNow === undefined
        ? null
        : seed.nextActionHoursFromNow >= 0
          ? hoursFromNow(seed.nextActionHoursFromNow)
          : hoursAgo(Math.abs(seed.nextActionHoursFromNow)),
    next_action_type: seed.nextActionType ?? null,
    next_action_note: seed.nextActionNote ?? seed.attentionWhy ?? null,
    qualification_status: seed.qualification ?? "unknown",
    qualification_reason: seed.qualificationReason ?? null,
    qualified_at:
      seed.qualification === "qualified"
        ? hoursAgo((seed.createdHoursAgo ?? 48) / 2)
        : null,
    meeting_booked_at:
      seed.meetingBookedHoursAgo != null
        ? hoursAgo(seed.meetingBookedHoursAgo)
        : null,
    meeting_status: seed.meetingStatus ?? "none",
    nurture_reason: seed.nurtureReason ?? null,
    nurture_until:
      seed.nurtureUntilHoursFromNow != null
        ? seed.nurtureUntilHoursFromNow >= 0
          ? hoursFromNow(seed.nurtureUntilHoursFromNow)
          : hoursAgo(Math.abs(seed.nurtureUntilHoursFromNow))
        : null,
    lost_reason: seed.lostReason ?? null,
    hubspot_contact_id: seed.hubspot?.contact ?? null,
    hubspot_lead_id: seed.hubspot?.lead ?? null,
    hubspot_deal_id: seed.hubspot?.deal ?? null,
    sync_status: seed.hubspot?.sync ?? "synced",
    last_synced_at:
      seed.hubspot?.syncedHoursAgo != null
        ? hoursAgo(seed.hubspot.syncedHoursAgo)
        : null,
    updated_at,
  };

  // Fix missing source for seed 29 (manual entry missing attribution)
  if (seed.n === 29) {
    lead.source = "missing";
  }

  const factors: LeadScoreFactor[] = scored.factors.map((f, i) => ({
    id: `sf_${leadId}_${i}`,
    lead_id: leadId,
    factor_type: f.factor_type,
    label: f.label,
    points: f.points,
    source: f.source,
    created_at,
  }));

  const snapshot: LeadScoreSnapshot = {
    id: `ss_${leadId}_1`,
    lead_id: leadId,
    score: scored.score,
    band: scored.band,
    version: scored.version,
    reason_summary: scored.reasonSummary,
    created_at,
  };

  const activities: Activity[] = [
    {
      id: `act_${leadId}_1`,
      lead_id: leadId,
      activity_type: "captured",
      direction: "system",
      title: "Lead captured",
      body_summary: `Captured from ${seed.sourceName}`,
      occurred_at: created_at,
      created_by: null,
      metadata_json: {},
      created_at,
    },
  ];

  if (lead.hubspot_contact_id && lead.sync_status === "synced") {
    activities.push({
      id: `act_${leadId}_2`,
      lead_id: leadId,
      activity_type: "sync_event",
      direction: "system",
      title: "HubSpot sync completed",
      body_summary: `Contact ${lead.hubspot_contact_id}`,
      occurred_at: hoursAgo(seed.createdHoursAgo - 0.05),
      created_by: null,
      metadata_json: { status: "success" },
      created_at: hoursAgo(seed.createdHoursAgo - 0.05),
    });
  }

  if (lead.sync_status === "failed") {
    activities.push({
      id: `act_${leadId}_2f`,
      lead_id: leadId,
      activity_type: "sync_event",
      direction: "system",
      title: "HubSpot sync failed",
      body_summary: "Mock connector returned 503 on contact upsert",
      occurred_at: hoursAgo(seed.createdHoursAgo - 0.1),
      created_by: null,
      metadata_json: { status: "failed" },
      created_at: hoursAgo(seed.createdHoursAgo - 0.1),
    });
  }

  if (lead.owner_id) {
    activities.push({
      id: `act_${leadId}_3`,
      lead_id: leadId,
      activity_type: "assigned",
      direction: "internal",
      title: "Assigned",
      body_summary: `Owner set`,
      occurred_at: hoursAgo(Math.max(seed.createdHoursAgo - 0.2, 0.1)),
      created_by: "user_003",
      metadata_json: { owner_id: lead.owner_id },
      created_at: hoursAgo(Math.max(seed.createdHoursAgo - 0.2, 0.1)),
    });
  }

  if (lead.first_contact_at) {
    activities.push({
      id: `act_${leadId}_4`,
      lead_id: leadId,
      activity_type: "call",
      direction: "outbound",
      title: "Call attempted",
      body_summary: "Outbound dial logged",
      occurred_at: lead.first_contact_at,
      created_by: lead.owner_id,
      metadata_json: {},
      created_at: lead.first_contact_at,
    });
  }

  if (seed.attentionWhy?.includes("Replied") || seed.scoreInput.repliedToday) {
    activities.push({
      id: `act_${leadId}_5`,
      lead_id: leadId,
      activity_type: "reply",
      direction: "inbound",
      title: "Parent replied",
      body_summary: "Inbound reply received",
      occurred_at: hoursAgo(0.3),
      created_by: null,
      metadata_json: {},
      created_at: hoursAgo(0.3),
    });
  }

  if (lead.meeting_status === "booked" || lead.meeting_status === "held" || lead.meeting_status === "no_show") {
    activities.push({
      id: `act_${leadId}_6`,
      lead_id: leadId,
      activity_type: "meeting_booked",
      direction: "internal",
      title: "Meeting booked",
      body_summary: "Strategy call scheduled",
      occurred_at: lead.meeting_booked_at ?? hoursAgo(24),
      created_by: lead.owner_id,
      metadata_json: {},
      created_at: lead.meeting_booked_at ?? hoursAgo(24),
    });
  }

  if (lead.meeting_status === "no_show") {
    activities.push({
      id: `act_${leadId}_7`,
      lead_id: leadId,
      activity_type: "no_show",
      direction: "system",
      title: "No-show recorded",
      body_summary: "Strategy call missed",
      occurred_at: hoursAgo(28),
      created_by: null,
      metadata_json: {},
      created_at: hoursAgo(28),
    });
  }

  if (lead.meeting_status === "held") {
    activities.push({
      id: `act_${leadId}_8`,
      lead_id: leadId,
      activity_type: "meeting_held",
      direction: "internal",
      title: "Call held",
      body_summary: "Strategy call completed",
      occurred_at: hoursAgo(seed.lastContactHoursAgo ?? 48),
      created_by: lead.owner_id,
      metadata_json: {},
      created_at: hoursAgo(seed.lastContactHoursAgo ?? 48),
    });
  }

  if (lead.next_action_at && lead.next_action_type) {
    activities.push({
      id: `act_${leadId}_9`,
      lead_id: leadId,
      activity_type: "followup_scheduled",
      direction: "internal",
      title: "Follow-up scheduled",
      body_summary: lead.next_action_note,
      occurred_at: hoursAgo(1),
      created_by: lead.owner_id,
      metadata_json: { type: lead.next_action_type },
      created_at: hoursAgo(1),
    });
  }

  activities.push({
    id: `act_${leadId}_10`,
    lead_id: leadId,
    activity_type: "score_change",
    direction: "system",
    title: "Score computed",
    body_summary: scored.reasonSummary,
    occurred_at: created_at,
    created_by: null,
    metadata_json: { score: scored.score, band: scored.band },
    created_at,
  });

  return { lead, factors, snapshot, activities };
}

function buildSourceEvents(leads: Lead[]): LeadSourceEvent[] {
  const events: LeadSourceEvent[] = [];
  let n = 1;

  for (const lead of leads) {
    if (lead.source === "missing") continue;
    const def = SOURCES.find((s) => s.id === lead.source_definition_id);
    events.push({
      id: id("evt", n++),
      source_type: def?.category ?? "other_campaign",
      source_name: lead.source,
      source_detail: lead.source_detail,
      source_definition_id: lead.source_definition_id,
      external_event_id: `ext_${lead.id}`,
      campaign: lead.campaign,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      received_at: lead.created_at,
      raw_payload_summary_json: {
        form: lead.source,
        fields: ["name", "email", "phone"],
      },
      normalized_identity_json: {
        email: lead.email,
        phone: lead.phone,
        first_name: lead.first_name,
        last_name: lead.last_name,
      },
      processing_status: "processed",
      matched_lead_id: lead.id,
      hubspot_contact_id: lead.hubspot_contact_id,
      hubspot_lead_id: lead.hubspot_lead_id,
      reconciliation_status: lead.sync_status === "failed" ? "failed" : "matched",
      reconciliation_reason:
        lead.sync_status === "failed"
          ? "HubSpot upsert failed in mock connector"
          : "Matched to lead and HubSpot contact",
      last_reconciliation_at: lead.last_synced_at ?? lead.created_at,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    });
  }

  // Meta deliberate mismatch: 41 submissions narrative — add unmatched extras
  // Count existing meta matched events, pad to 41 with 1 unmatched (+ maybe duplicates)
  const metaName = "Meta / Instagram";
  const metaEvents = () => events.filter((e) => e.source_name === metaName);
  while (metaEvents().length < 40) {
    const idx = metaEvents().length + 1;
    events.push({
      id: id("evt", n++),
      source_type: "paid_social",
      source_name: metaName,
      source_detail: "Lead Ads form",
      source_definition_id: "src_004",
      external_event_id: `meta_pad_${idx}`,
      campaign: "ig_spring_awareness",
      utm_source: "instagram",
      utm_medium: "paid",
      utm_campaign: "ig_spring",
      received_at: daysAgo(20 - (idx % 15)),
      raw_payload_summary_json: { form: "lead_ad", fields: ["name", "email"] },
      normalized_identity_json: {
        email: `meta.pad.${idx}@example.com`,
        phone: `+1-555-019-${String(1000 + idx).slice(-4)}`,
        first_name: "Meta",
        last_name: `Pad${idx}`,
      },
      processing_status: "processed",
      matched_lead_id: null,
      hubspot_contact_id: `HS-C-META-${idx}`,
      hubspot_lead_id: null,
      reconciliation_status: "created",
      reconciliation_reason: "Created HubSpot contact; historical pad for volume demo",
      last_reconciliation_at: daysAgo(19),
      created_at: daysAgo(20 - (idx % 15)),
      updated_at: daysAgo(19),
    });
  }

  // The critical unmatched #41
  events.push({
    id: id("evt", n++),
    source_type: "paid_social",
    source_name: metaName,
    source_detail: "Lead Ads form — missing CRM row",
    source_definition_id: "src_004",
    external_event_id: "meta_missing_41",
    campaign: "ig_spring_awareness",
    utm_source: "instagram",
    utm_medium: "paid",
    utm_campaign: "ig_spring",
    received_at: hoursAgo(11),
    raw_payload_summary_json: {
      form: "lead_ad",
      fields: ["name", "email", "phone"],
      note: "Platform reported submission; no HubSpot contact",
    },
    normalized_identity_json: {
      email: "vanessa.cole@example.com",
      phone: "+1-555-010-4199",
      first_name: "Vanessa",
      last_name: "Cole",
    },
    processing_status: "processed",
    matched_lead_id: null,
    hubspot_contact_id: null,
    hubspot_lead_id: null,
    reconciliation_status: "unmatched",
    reconciliation_reason:
      "Source event received from Meta; no matching HubSpot contact or SPM lead",
    last_reconciliation_at: hoursAgo(1),
    created_at: hoursAgo(11),
    updated_at: hoursAgo(1),
  });

  // Duplicate submission example
  events.push({
    id: id("evt", n++),
    source_type: "form",
    source_name: "Find the Right Mentor",
    source_detail: "Duplicate form submit",
    source_definition_id: "src_002",
    external_event_id: "form_dup_natalie",
    campaign: null,
    utm_source: "website",
    utm_medium: "form",
    utm_campaign: "find_mentor",
    received_at: hoursAgo(6 * 24 - 2),
    raw_payload_summary_json: { form: "find_mentor", duplicate_of: "lead_008" },
    normalized_identity_json: {
      email: "natalie.brooks@example.com",
      phone: "+1-555-010-1188",
      first_name: "Natalie",
      last_name: "Brooks",
    },
    processing_status: "processed",
    matched_lead_id: "lead_008",
    hubspot_contact_id: "HS-C-1008",
    hubspot_lead_id: null,
    reconciliation_status: "duplicate",
    reconciliation_reason: "Same email as existing lead_008 within 24h",
    last_reconciliation_at: hoursAgo(6 * 24 - 1),
    created_at: hoursAgo(6 * 24 - 2),
    updated_at: hoursAgo(6 * 24 - 1),
  });

  return events;
}

function buildSyncEvents(
  leads: Lead[],
  sourceEvents: LeadSourceEvent[],
): IntegrationSyncEvent[] {
  const events: IntegrationSyncEvent[] = [];
  let i = 1;
  for (const lead of leads.slice(0, 20)) {
    events.push({
      id: id("sync", i++),
      provider: "hubspot",
      object_type: "contact",
      object_id: lead.hubspot_contact_id,
      direction: "outbound",
      status: lead.sync_status === "failed" ? "failed" : "success",
      reason:
        lead.sync_status === "failed"
          ? "Mock 503 from HubSpot contacts API"
          : "Upsert ok",
      attempted_at: lead.last_synced_at ?? lead.created_at,
      completed_at: lead.sync_status === "failed" ? null : lead.last_synced_at,
      lead_id: lead.id,
      source_event_id: null,
    });
  }
  const unmatched = sourceEvents.find((e) => e.external_event_id === "meta_missing_41");
  if (unmatched) {
    events.push({
      id: id("sync", i++),
      provider: "hubspot",
      object_type: "contact",
      object_id: null,
      direction: "inbound",
      status: "failed",
      reason: "No HubSpot contact found for Meta submission meta_missing_41",
      attempted_at: hoursAgo(1),
      completed_at: hoursAgo(1),
      lead_id: null,
      source_event_id: unmatched.id,
    });
  }
  return events;
}

let cachedDataset: DemoDataset | null = null;

export function getDemoDataset(): DemoDataset {
  if (cachedDataset) return cachedDataset;

  const allSeeds = [...LEAD_SEEDS, ...buildExtraSeeds()];
  const leads: Lead[] = [];
  const scoreFactors: LeadScoreFactor[] = [];
  const scoreSnapshots: LeadScoreSnapshot[] = [];
  const activities: Activity[] = [];

  for (const seed of allSeeds) {
    const built = buildLead(seed);
    leads.push(built.lead);
    scoreFactors.push(...built.factors);
    scoreSnapshots.push(built.snapshot);
    activities.push(...built.activities);
  }

  const sourceEvents = buildSourceEvents(leads);
  const syncEvents = buildSyncEvents(leads, sourceEvents);

  cachedDataset = {
    users: USERS,
    sources: SOURCES,
    leads,
    sourceEvents,
    scoreFactors,
    scoreSnapshots,
    activities,
    syncEvents,
  };

  return cachedDataset;
}

export function resetDemoDatasetCache(): void {
  cachedDataset = null;
}
