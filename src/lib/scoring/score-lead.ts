import type { Lead, LeadScoreFactor, ScoreBand, ScoreFactorType } from "@/types/domain";

export const SCORE_VERSION = "v1";

export interface ScoreInput {
  requestedStrategyCall?: boolean;
  requestedMoreInfo?: boolean;
  activelySeekingMentorship?: boolean;
  askedAboutEnrollment?: boolean;
  repliedToOutreach?: boolean;
  repliedToday?: boolean;
  bookedMeeting?: boolean;
  multipleEngagements?: boolean;
  returnedAfterEarlierContact?: boolean;
  lookingToStartSoon?: boolean;
  completeContactInfo?: boolean;
  decisionMakerEngaged?: boolean;
  existingFamilyReferral?: boolean;
  jakeReferral?: boolean;
  historicallyStrongSource?: boolean;
  trustedPartnerReferral?: boolean;
  repeatedNoResponseCount?: number;
  explicitLackOfInterest?: boolean;
  longTermTiming?: boolean;
  invalidContactInfo?: boolean;
  unrecoveredNoShow?: boolean;
}

export interface ScoreFactorDraft {
  factor_type: ScoreFactorType;
  label: string;
  points: number;
  source: string;
  code: string;
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  version: string;
  factors: ScoreFactorDraft[];
  categoryTotals: {
    intent: number;
    engagement: number;
    readiness: number;
    source_quality: number;
    negative: number;
  };
  reasonSummary: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function bandForScore(score: number): ScoreBand {
  if (score >= 80) return "P1";
  if (score >= 60) return "P2";
  if (score >= 40) return "P3";
  return "P4";
}

function takeCapped(
  candidates: ScoreFactorDraft[],
  max: number,
): ScoreFactorDraft[] {
  const sorted = [...candidates].sort((a, b) => b.points - a.points);
  const selected: ScoreFactorDraft[] = [];
  let total = 0;
  for (const c of sorted) {
    if (c.points <= 0) continue;
    const remaining = max - total;
    if (remaining <= 0) break;
    const points = Math.min(c.points, remaining);
    selected.push({ ...c, points });
    total += points;
  }
  return selected;
}

export function scoreLead(input: ScoreInput): ScoreResult {
  const intentCandidates: ScoreFactorDraft[] = [];
  if (input.requestedStrategyCall) {
    intentCandidates.push({
      factor_type: "intent",
      label: "Requested strategy call",
      points: 20,
      source: "intent.signal",
      code: "requested_strategy_call",
    });
  }
  if (input.askedAboutEnrollment) {
    intentCandidates.push({
      factor_type: "intent",
      label: "Asked about enrollment",
      points: 15,
      source: "intent.signal",
      code: "asked_enrollment",
    });
  }
  if (input.activelySeekingMentorship) {
    intentCandidates.push({
      factor_type: "intent",
      label: "Actively seeking mentorship",
      points: 10,
      source: "intent.signal",
      code: "seeking_mentorship",
    });
  }
  if (input.requestedMoreInfo) {
    intentCandidates.push({
      factor_type: "intent",
      label: "Requested more information",
      points: 10,
      source: "intent.signal",
      code: "requested_info",
    });
  }

  const engagementCandidates: ScoreFactorDraft[] = [];
  if (input.repliedToday) {
    engagementCandidates.push({
      factor_type: "engagement",
      label: "Responded today",
      points: 15,
      source: "engagement.signal",
      code: "replied_today",
    });
  } else if (input.repliedToOutreach) {
    engagementCandidates.push({
      factor_type: "engagement",
      label: "Replied to outreach",
      points: 12,
      source: "engagement.signal",
      code: "replied",
    });
  }
  if (input.bookedMeeting) {
    engagementCandidates.push({
      factor_type: "engagement",
      label: "Booked meeting",
      points: 15,
      source: "engagement.signal",
      code: "booked_meeting",
    });
  }
  if (input.multipleEngagements) {
    engagementCandidates.push({
      factor_type: "engagement",
      label: "Multiple meaningful engagements",
      points: 10,
      source: "engagement.signal",
      code: "multi_engagement",
    });
  }
  if (input.returnedAfterEarlierContact) {
    engagementCandidates.push({
      factor_type: "engagement",
      label: "Returned after earlier contact",
      points: 8,
      source: "engagement.signal",
      code: "returned",
    });
  }

  const readinessCandidates: ScoreFactorDraft[] = [];
  if (input.lookingToStartSoon) {
    readinessCandidates.push({
      factor_type: "readiness",
      label: "Looking to start soon",
      points: 15,
      source: "readiness.signal",
      code: "start_soon",
    });
  }
  if (input.completeContactInfo) {
    readinessCandidates.push({
      factor_type: "readiness",
      label: "Complete contact info",
      points: 10,
      source: "readiness.signal",
      code: "complete_contact",
    });
  }
  if (input.decisionMakerEngaged) {
    readinessCandidates.push({
      factor_type: "readiness",
      label: "Parent/guardian decision-maker engaged",
      points: 10,
      source: "readiness.signal",
      code: "decision_maker",
    });
  }

  const sourceCandidates: ScoreFactorDraft[] = [];
  if (input.jakeReferral) {
    sourceCandidates.push({
      factor_type: "source_quality",
      label: "Jake referral",
      points: 10,
      source: "source.signal",
      code: "jake_referral",
    });
  }
  if (input.existingFamilyReferral) {
    sourceCandidates.push({
      factor_type: "source_quality",
      label: "Existing-family referral",
      points: 8,
      source: "source.signal",
      code: "family_referral",
    });
  }
  if (input.trustedPartnerReferral) {
    sourceCandidates.push({
      factor_type: "source_quality",
      label: "Trusted partner referral",
      points: 7,
      source: "source.signal",
      code: "partner_referral",
    });
  }
  if (input.historicallyStrongSource) {
    sourceCandidates.push({
      factor_type: "source_quality",
      label: "Historically strong source",
      points: 6,
      source: "source.signal",
      code: "strong_source",
    });
  }

  const negative: ScoreFactorDraft[] = [];
  const noResponse = input.repeatedNoResponseCount ?? 0;
  if (noResponse > 0) {
    negative.push({
      factor_type: "negative",
      label: "Repeated no response",
      points: -clamp(noResponse * 10, 0, 25),
      source: "negative.signal",
      code: "no_response",
    });
  }
  if (input.explicitLackOfInterest) {
    negative.push({
      factor_type: "negative",
      label: "Explicit lack of interest",
      points: -30,
      source: "negative.signal",
      code: "no_interest",
    });
  }
  if (input.longTermTiming) {
    negative.push({
      factor_type: "negative",
      label: "Long-term timing",
      points: -10,
      source: "negative.signal",
      code: "long_term",
    });
  }
  if (input.invalidContactInfo) {
    negative.push({
      factor_type: "negative",
      label: "Invalid contact information",
      points: -20,
      source: "negative.signal",
      code: "invalid_contact",
    });
  }
  if (input.unrecoveredNoShow) {
    negative.push({
      factor_type: "negative",
      label: "Unrecovered no-show",
      points: -8,
      source: "negative.signal",
      code: "no_show",
    });
  }

  const intent = takeCapped(intentCandidates, 40);
  const engagement = takeCapped(engagementCandidates, 30);
  const readiness = takeCapped(readinessCandidates, 20);
  const source_quality = takeCapped(sourceCandidates, 10);

  const factors = [...intent, ...engagement, ...readiness, ...source_quality, ...negative];
  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const score = clamp(raw, 0, 100);
  const band = bandForScore(score);

  const categoryTotals = {
    intent: intent.reduce((s, f) => s + f.points, 0),
    engagement: engagement.reduce((s, f) => s + f.points, 0),
    readiness: readiness.reduce((s, f) => s + f.points, 0),
    source_quality: source_quality.reduce((s, f) => s + f.points, 0),
    negative: negative.reduce((s, f) => s + f.points, 0),
  };

  const reasonSummary = factors
    .filter((f) => f.points !== 0)
    .map((f) => `${f.points > 0 ? "+" : ""}${f.points} ${f.label}`)
    .join("; ");

  return {
    score,
    band,
    version: SCORE_VERSION,
    factors,
    categoryTotals,
    reasonSummary,
  };
}

export function scoreBandLabel(band: ScoreBand): string {
  switch (band) {
    case "P1":
      return "P1 / Hot";
    case "P2":
      return "P2 / High";
    case "P3":
      return "P3 / Nurture";
    case "P4":
      return "P4 / Low";
  }
}

/** Derive score input hints from lead + activity metadata for recompute demos. */
export function inferScoreInputFromLead(
  lead: Pick<
    Lead,
    | "email"
    | "phone"
    | "source"
    | "meeting_status"
    | "disposition"
    | "qualification_status"
    | "next_action_type"
  >,
  extras: Partial<ScoreInput> = {},
): ScoreInput {
  const source = lead.source.toLowerCase();
  return {
    completeContactInfo: Boolean(lead.email && lead.phone),
    decisionMakerEngaged: true,
    jakeReferral: source.includes("jake"),
    existingFamilyReferral: source.includes("family"),
    trustedPartnerReferral:
      source.includes("school") ||
      source.includes("consultant") ||
      source.includes("therapist") ||
      source.includes("partner"),
    historicallyStrongSource: source.includes("referral"),
    bookedMeeting: ["booked", "held", "no_show", "rescheduled"].includes(
      lead.meeting_status,
    ),
    unrecoveredNoShow: lead.disposition === "NO_SHOW" || lead.meeting_status === "no_show",
    invalidContactInfo: lead.disposition === "INVALID_CONTACT",
    longTermTiming: lead.disposition === "NURTURE",
    repeatedNoResponseCount: lead.disposition === "NO_RESPONSE" ? 2 : 0,
    explicitLackOfInterest: lead.qualification_status === "not_qualified",
    requestedStrategyCall:
      lead.next_action_type === "BOOK_MEETING" ||
      lead.next_action_type === "CALL_NOW" ||
      extras.requestedStrategyCall,
    ...extras,
  };
}

export function factorsToRecords(
  leadId: string,
  factors: ScoreFactorDraft[],
  createdAt: string,
): Omit<LeadScoreFactor, "id">[] {
  return factors.map((f) => ({
    lead_id: leadId,
    factor_type: f.factor_type,
    label: f.label,
    points: f.points,
    source: f.source,
    created_at: createdAt,
  }));
}
