import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { hydratePersistedActivities } from "@/lib/db/activity-persist";
import {
  WORKING_REASON_LABEL,
  getNurtureQueues,
} from "@/lib/nurture/work-queue";
import { SCORE_BAND_LABELS, formatNextAction } from "@/types/domain";
import { formatOpsDate } from "@/lib/utils";

export const metadata = { title: "Nurture" };

export default async function NurturePage() {
  await hydratePersistedActivities();
  const sections = getNurtureQueues();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="spm-page-title">Nurture queue</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--spm-text-muted)]">
          Each person has one primary reason. Extra reasons stay as flags.
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.key} className="spm-panel overflow-hidden">
          <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
              {section.title}{" "}
              <span className="font-medium text-[var(--spm-text-muted)]">
                ({section.leads.length})
              </span>
            </h2>
          </div>
          {section.leads.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--spm-text-muted)]">
              Empty.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="spm-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Why</th>
                    <th>Last touch</th>
                    <th>Due</th>
                    <th>Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {section.leads.map(({ lead, why, secondary }) => {
                    const lastTouch =
                      lead.last_contact_at ?? lead.last_activity_at ?? lead.created_at;
                    const due = lead.next_action_at ?? lead.nurture_until;
                    return (
                      <tr key={lead.id}>
                        <td>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-medium text-[var(--spm-navy)] hover:underline"
                          >
                            {lead.first_name} {lead.last_name}
                          </Link>
                          <p className="mt-0.5">
                            <Badge
                              tone={lead.score_band === "P1" ? "hot" : "neutral"}
                            >
                              {SCORE_BAND_LABELS[lead.score_band]}
                            </Badge>
                          </p>
                        </td>
                        <td className="max-w-sm text-[var(--spm-text-muted)]">
                          <p>{why}</p>
                          {secondary.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {secondary.map((reason) => (
                                <Badge key={reason} tone="warning">
                                  {WORKING_REASON_LABEL[reason]}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap text-[var(--spm-text-muted)]">
                          {formatOpsDate(lastTouch)}
                        </td>
                        <td className="whitespace-nowrap text-[var(--spm-text-muted)]">
                          {due ? formatOpsDate(due) : "—"}
                        </td>
                        <td className="whitespace-nowrap font-medium text-[var(--spm-navy)]">
                          {formatNextAction(lead.next_action_type)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
