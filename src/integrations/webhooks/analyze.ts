import type { NextActionType } from "@/types/domain";
import type { CallAnalysis, CallOutcome, ReplyAnalysis, ReplyIntent } from "./types";

const BOOK_RE = /\b(book|schedule|jake|strategy call|available|set up a call)\b/i;
const ENROLL_RE = /\b(enroll\w*|tuition|start date|how much|pricing|cost)\b/i;
const NO_RE = /\b(not interested|no thanks|unsubscribe|stop texting|remove me)\b/i;
const LATER_RE = /\b(next year|later|not now|too busy|in the fall|maybe later)\b/i;
const CONFIRM_RE = /\b(confirm|see you|we'?ll be there|on my calendar)\b/i;

export function classifyReplyIntent(text: string | null | undefined): ReplyIntent {
  if (!text) return "unknown";
  if (NO_RE.test(text)) return "not_interested";
  if (LATER_RE.test(text)) return "timing";
  if (BOOK_RE.test(text)) return "book";
  if (CONFIRM_RE.test(text)) return "confirm";
  if (ENROLL_RE.test(text) || /\?/.test(text)) return "question";
  return "unknown";
}

export function analyzeReplyText(
  text: string | null | undefined,
  channel: ReplyAnalysis["channel"] = "email",
): ReplyAnalysis {
  const intent = classifyReplyIntent(text);
  return {
    channel,
    intent,
    askedAboutEnrollment: Boolean(text && ENROLL_RE.test(text)),
    requestedStrategyCall: intent === "book" || Boolean(text && BOOK_RE.test(text)),
    summary: text?.trim() ? text.trim().slice(0, 280) : undefined,
  };
}

const OUTCOME_MAP: Record<string, CallOutcome> = {
  connected: "connected",
  voicemail: "voicemail",
  no_answer: "no_answer",
  noanswer: "no_answer",
  busy: "busy",
  wrong_number: "wrong_number",
  wrongnumber: "wrong_number",
  held: "held",
  completed: "held",
  no_show: "no_show",
  noshow: "no_show",
};

export function parseCallOutcome(value: unknown): CallOutcome | undefined {
  if (typeof value !== "string") return undefined;
  return OUTCOME_MAP[value.trim().toLowerCase().replace(/[\s-]+/g, "_")];
}

export function recommendedActionFromCall(analysis: CallAnalysis): NextActionType {
  if (analysis.recommendedNextAction) return analysis.recommendedNextAction;
  if (analysis.notInterested) return "FOLLOW_UP";
  if (analysis.outcome === "wrong_number") return "REVIEW";
  if (analysis.outcome === "no_show") return "RESCHEDULE";
  if (analysis.outcome === "held") return "FOLLOW_UP";
  if (analysis.requestedStrategyCall || analysis.askedAboutEnrollment) return "BOOK_MEETING";
  if (analysis.outcome === "connected") return "QUALIFY";
  return "CALL";
}

export function analyzeCallPayload(input: {
  outcome?: unknown;
  recap?: unknown;
  text?: unknown;
  durationSeconds?: unknown;
  kind?: unknown;
  askedAboutEnrollment?: unknown;
  requestedStrategyCall?: unknown;
  notInterested?: unknown;
  timingLater?: unknown;
  recommendedNextAction?: unknown;
}): CallAnalysis {
  const recap =
    typeof input.recap === "string"
      ? input.recap
      : typeof input.text === "string"
        ? input.text
        : undefined;
  const outcome = parseCallOutcome(input.outcome) ?? "connected";
  const askedAboutEnrollment =
    input.askedAboutEnrollment === true || Boolean(recap && ENROLL_RE.test(recap));
  const requestedStrategyCall =
    input.requestedStrategyCall === true || Boolean(recap && BOOK_RE.test(recap));
  const notInterested = input.notInterested === true || Boolean(recap && NO_RE.test(recap));
  const timingLater = input.timingLater === true || Boolean(recap && LATER_RE.test(recap));

  const analysis: CallAnalysis = {
    outcome,
    kind: input.kind === "strategy" ? "strategy" : "sales",
    durationSeconds:
      typeof input.durationSeconds === "number" ? input.durationSeconds : undefined,
    askedAboutEnrollment,
    requestedStrategyCall,
    notInterested,
    timingLater,
    recap: recap?.trim().slice(0, 400),
  };
  analysis.recommendedNextAction = recommendedActionFromCall(analysis);
  return analysis;
}
