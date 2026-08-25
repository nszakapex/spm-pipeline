import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getDashboardMetrics } from "@/lib/analytics/queries";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { hydratePipelineForRequest } from "@/lib/db/hydrate-pipeline";
import { ScoreMark } from "@/components/leads/score-mark";
import { WORKING_REASON_LABEL } from "@/lib/nurture/work-queue";
import { formatNextAction } from "@/types/domain";

export const metadata = { title: "Home" };

export default async function DashboardPage() {
  await hydratePipelineForRequest();
  const session = await getSessionUser();
  const m = getDashboardMetrics();
  const healthIssues = m.health.components.filter((c) => c.violations > 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="spm-kicker">Pipeline Control</p>
        <h1 className="spm-page-title mt-2">Home</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--spm-text-muted)]">
          One list. Do the next step, then log what happened.
        </p>
      </header>

      <section className="spm-panel overflow-hidden">
        <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
            Work next{" "}
            <span className="font-medium text-[var(--spm-text-muted)]">
              ({m.workNext.length})
            </span>
          </h2>
          <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
            Each person appears once, ordered by what to do first.
          </p>
        </div>
        {m.workNext.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[var(--spm-text-muted)]">
            Nothing waiting.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="spm-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Why</th>
                  <th>Next step</th>
                  <th>Also</th>
                </tr>
              </thead>
              <tbody>
                {m.workNext.map(({ lead, why, primary, secondary }) => (
                  <tr key={lead.id}>
                    <td>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-[var(--spm-navy)] hover:underline"
                      >
                        {lead.first_name} {lead.last_name}
                      </Link>
                      <p className="mt-1.5">
                        <ScoreMark band={lead.score_band} compact />
                      </p>
                    </td>
                    <td className="max-w-xs text-[var(--spm-text-muted)]">
                      <p className="font-medium text-[var(--spm-navy)]">
                        {WORKING_REASON_LABEL[primary]}
                      </p>
                      <p>{why}</p>
                    </td>
                    <td className="whitespace-nowrap font-medium text-[var(--spm-navy)]">
                      {formatNextAction(lead.next_action_type)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {secondary.slice(0, 2).map((reason) => (
                          <Badge key={reason} tone="warning">
                            {WORKING_REASON_LABEL[reason]}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {session && isAdminRole(session.role) ? (
        <section className="spm-panel px-4 py-3">
          <p className="text-sm font-semibold text-[var(--spm-navy)]">
            Integrity
          </p>
          <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
            Pipeline health {m.pipelineHealth}%
            {healthIssues.length > 0
              ? ` · ${healthIssues
                  .map((c) => `${c.label} ${c.violations}`)
                  .join(" · ")}`
              : " · no weighted violations"}
            {m.unmatchedSourceEvents > 0
              ? ` · ${m.unmatchedSourceEvents} unmatched source event${
                  m.unmatchedSourceEvents === 1 ? "" : "s"
                }`
              : ""}
            .{" "}
            <Link
              href="/sources"
              className="font-medium text-[var(--spm-blue-secondary)] hover:underline"
            >
              Sources
            </Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}
