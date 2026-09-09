import { TERMINAL_STAGES, type LeadStage } from "@/types/domain";

/** Forward pipeline order. LOST is terminal and not a forward step. */
export const STAGE_ORDER: LeadStage[] = [
  "NEW",
  "ATTEMPTING_CONTACT",
  "CONNECTED",
  "QUALIFIED",
  "JAKE_READY",
  "CALL_BOOKED",
  "CALL_HELD",
  "ENROLLMENT_PENDING",
  "WON",
];

export function stageIndex(stage: LeadStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/** Advance only; never move an already-won/lost lead unless the candidate is also terminal. */
export function atLeastStage(current: LeadStage, candidate: LeadStage): LeadStage {
  if (current === "WON" || current === "LOST") {
    if (candidate === "WON" || candidate === "LOST") return candidate;
    return current;
  }
  if (candidate === "LOST") return "LOST";
  const currentIndex = stageIndex(current);
  const candidateIndex = stageIndex(candidate);
  if (candidateIndex === -1) return current;
  if (currentIndex === -1) return candidate;
  return candidateIndex > currentIndex ? candidate : current;
}

export function isForwardOrSame(from: LeadStage, to: LeadStage): boolean {
  if (from === to) return true;
  if (TERMINAL_STAGES.includes(from)) return TERMINAL_STAGES.includes(to);
  if (to === "LOST") return true;
  return stageIndex(to) >= stageIndex(from);
}
