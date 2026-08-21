"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { logManualLeadActivity, type ManualActivityKind } from "@/lib/pipeline/log-activity";
import type { CallOutcome } from "@/integrations/webhooks/types";

const KINDS: ManualActivityKind[] = [
  "call",
  "inbound_reply",
  "outbound_email",
  "outbound_sms",
];

const OUTCOMES: CallOutcome[] = [
  "connected",
  "voicemail",
  "no_answer",
  "busy",
  "wrong_number",
  "held",
  "no_show",
];

export async function logLeadActivityAction(formData: FormData) {
  const user = await getSessionUser();
  const leadId = String(formData.get("leadId") ?? "");
  if (!user) redirect("/login");
  if (!leadId) redirect("/leads");
  if (user.role === "viewer") {
    redirect(`/leads/${leadId}?notice=view-only`);
  }

  const kind = String(formData.get("kind") ?? "") as ManualActivityKind;
  if (!KINDS.includes(kind)) {
    redirect(`/leads/${leadId}?notice=invalid`);
  }

  const outcomeRaw = String(formData.get("outcome") ?? "");
  const outcome = OUTCOMES.includes(outcomeRaw as CallOutcome)
    ? (outcomeRaw as CallOutcome)
    : undefined;
  const recap = String(formData.get("recap") ?? "");

  logManualLeadActivity({
    leadId,
    actorId: user.id,
    kind,
    outcome: kind === "call" ? outcome ?? "connected" : undefined,
    recap,
  });

  redirect(`/leads/${leadId}`);
}
