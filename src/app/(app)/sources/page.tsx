import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getStore } from "@/lib/db/store";
import { summarizeSourceIntegrity } from "@/lib/integrity/reconciliation";
import { formatOpsDate, formatPercent } from "@/lib/utils";

export const metadata = { title: "Sources" };

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const params = await searchParams;
  const store = getStore();
  const summaries = store
    .getSources()
    .map((s) =>
      summarizeSourceIntegrity(s, store.getSourceEvents(), store.getLeads()),
    )
    .sort((a, b) => b.submissionsReceived - a.submissionsReceived);

  const selected =
    summaries.find((s) => s.sourceName === params.source) ??
    summaries.find((s) => s.missingCount > 0) ??
    summaries[0];

  const selectedEvents = store
    .getSourceEvents()
    .filter(
      (e) =>
        e.source_name === selected?.sourceName ||
        e.source_definition_id === selected?.sourceDefinitionId,
    )
    .sort(
      (a, b) =>
        new Date(b.received_at).getTime() - new Date(a.received_at).getTime(),
    );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--spm-navy)]">Sources</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--spm-text-muted)]">
          Submissions vs CRM representation. Open a source to see unmatched
          events.
        </p>
      </header>

      {selected && selected.missingCount > 0 ? (
        <div className="spm-flag px-4 py-3">
          <p className="text-sm font-medium text-[var(--spm-navy)]">
            {selected.sourceName}: {selected.submissionsReceived} submissions ·{" "}
            {selected.accountedFor} accounted · {selected.missingCount}{" "}
            potentially missing
          </p>
          <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
            Source event existed, but CRM representation is missing for at least
            one submission.
          </p>
        </div>
      ) : null}

      <section className="spm-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="spm-table">
            <thead>
              <tr>
                <th>Source</th>
                <th className="text-right">Submissions</th>
                <th className="text-right">Accounted</th>
                <th className="text-right">Unmatched</th>
                <th className="text-right">Sync fail</th>
                <th>Capture</th>
                <th>Qualified</th>
                <th>Won</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => {
                const active =
                  selected?.sourceDefinitionId === s.sourceDefinitionId;
                return (
                  <tr
                    key={s.sourceDefinitionId}
                    aria-selected={active}
                    className={active ? "bg-[color-mix(in_oklab,var(--spm-sky)_18%,white)]" : undefined}
                  >
                    <td>
                      <Link
                        href={`/sources?source=${encodeURIComponent(s.sourceName)}`}
                        className="font-medium text-[var(--spm-navy)] hover:underline"
                      >
                        {s.sourceName}
                      </Link>
                      <p className="text-xs text-[var(--spm-text-muted)]">
                        {s.category.replaceAll("_", " ")}
                      </p>
                      {s.missingCount > 0 ? (
                        <p className="mt-1 text-xs font-medium text-[var(--spm-navy)]">
                          {s.missingCount} potentially missing
                        </p>
                      ) : null}
                    </td>
                    <td className="text-right tabular-nums">
                      {s.submissionsReceived}
                    </td>
                    <td className="text-right tabular-nums">{s.accountedFor}</td>
                    <td className="text-right tabular-nums">{s.unmatched}</td>
                    <td className="text-right tabular-nums">{s.syncFailures}</td>
                    <td className="tabular-nums">
                      {formatPercent(s.captureRate)}
                    </td>
                    <td className="tabular-nums">
                      {s.qualifiedCount} · {formatPercent(s.qualifiedRate)}
                    </td>
                    <td className="tabular-nums">
                      {s.wonCount} · {formatPercent(s.wonRate)}
                    </td>
                    <td>
                      <Badge
                        tone={
                          s.health === "critical"
                            ? "danger"
                            : s.health === "warning"
                              ? "warning"
                              : "success"
                        }
                      >
                        {s.health}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <section className="spm-panel overflow-hidden">
          <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
              {selected.sourceName} — recent events
            </h2>
            <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
              Reconciliation status for this channel.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="spm-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Identity</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Lead</th>
                </tr>
              </thead>
              <tbody>
                {selectedEvents.slice(0, 25).map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-[var(--spm-text-muted)]">
                      {formatOpsDate(e.received_at)}
                    </td>
                    <td>
                      <p className="font-medium text-[var(--spm-navy)]">
                        {e.normalized_identity_json.first_name}{" "}
                        {e.normalized_identity_json.last_name}
                      </p>
                      <p className="text-xs text-[var(--spm-text-muted)]">
                        {e.normalized_identity_json.email}
                      </p>
                    </td>
                    <td>
                      <Badge
                        tone={
                          e.reconciliation_status === "unmatched" ||
                          e.reconciliation_status === "failed"
                            ? "danger"
                            : e.reconciliation_status === "duplicate"
                              ? "warning"
                              : "success"
                        }
                      >
                        {e.reconciliation_status}
                      </Badge>
                    </td>
                    <td className="max-w-xs text-[var(--spm-text-muted)]">
                      {e.reconciliation_reason}
                    </td>
                    <td>
                      {e.matched_lead_id ? (
                        <Link
                          href={`/leads/${e.matched_lead_id}`}
                          className="font-medium text-[var(--spm-blue-secondary)] hover:underline"
                        >
                          Open
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
