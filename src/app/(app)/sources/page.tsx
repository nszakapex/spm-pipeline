import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Panel,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { getStore } from "@/lib/db/store";
import { summarizeSourceIntegrity } from "@/lib/integrity/reconciliation";
import { formatPercent } from "@/lib/utils";

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
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--spm-blue-secondary)]">
          Lead capture & integrity
        </p>
        <h1 className="mt-1 text-[1.85rem] font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
          Sources
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--spm-text-muted)]">
          Every acquisition event is first-class. Reconciliation proves whether
          submissions became CRM leads — including the gaps.
        </p>
      </header>

      {selected && selected.missingCount > 0 ? (
        <div className="rounded-[1.25rem] border border-[rgba(194,59,74,0.25)] bg-[#fff6f7] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--spm-danger)]">
            {selected.sourceName}: {selected.submissionsReceived} submissions ·{" "}
            {selected.accountedFor} accounted for ·{" "}
            <span className="underline decoration-2 underline-offset-2">
              {selected.missingCount} potentially missing
            </span>
          </p>
          <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
            Source event existed, but CRM representation is missing for at least
            one submission.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {summaries.map((s) => (
          <Link
            key={s.sourceDefinitionId}
            href={`/sources?source=${encodeURIComponent(s.sourceName)}`}
            className={`spm-panel p-5 transition hover:-translate-y-0.5 ${
              selected?.sourceDefinitionId === s.sourceDefinitionId
                ? "ring-2 ring-[var(--spm-blue-secondary)]/30"
                : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold tracking-[-0.02em] text-[var(--spm-navy)]">
                  {s.sourceName}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.04em] text-[var(--spm-text-muted)]">
                  {s.category.replaceAll("_", " ")}
                </p>
              </div>
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
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--spm-text-muted)]">Submissions</dt>
                <dd className="font-semibold">{s.submissionsReceived}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Accounted</dt>
                <dd className="font-semibold">{s.accountedFor}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Unmatched</dt>
                <dd className="font-semibold">{s.unmatched}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Sync failures</dt>
                <dd className="font-semibold">{s.syncFailures}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Capture</dt>
                <dd className="font-semibold">{formatPercent(s.captureRate)}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Qualified</dt>
                <dd className="font-semibold">
                  {s.qualifiedCount} · {formatPercent(s.qualifiedRate)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Meetings</dt>
                <dd className="font-semibold">
                  {s.meetingCount} · {formatPercent(s.meetingRate)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Won</dt>
                <dd className="font-semibold">
                  {s.wonCount} · {formatPercent(s.wonRate)}
                </dd>
              </div>
            </dl>
            {s.missingCount > 0 ? (
              <p className="mt-4 text-sm font-bold text-[var(--spm-danger)]">
                {s.missingCount} potentially missing
              </p>
            ) : null}
          </Link>
        ))}
      </div>

      {selected ? (
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>{selected.sourceName} · reconciliation</PanelTitle>
              <PanelDescription>
                Recent source events for this channel.
              </PanelDescription>
            </div>
          </PanelHeader>
          <div className="overflow-x-auto p-2">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.04em] text-[var(--spm-text-muted)]">
                <tr>
                  <th className="px-3 py-2 font-bold">Received</th>
                  <th className="px-3 py-2 font-bold">Identity</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                  <th className="px-3 py-2 font-bold">Reason</th>
                  <th className="px-3 py-2 font-bold">Lead</th>
                </tr>
              </thead>
              <tbody>
                {selectedEvents.slice(0, 25).map((e) => (
                  <tr
                    key={e.id}
                    className="border-t border-[rgba(7,22,74,0.06)]"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-[var(--spm-text-muted)]">
                      {new Date(e.received_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[var(--spm-navy)]">
                        {e.normalized_identity_json.first_name}{" "}
                        {e.normalized_identity_json.last_name}
                      </p>
                      <p className="text-xs text-[var(--spm-text-muted)]">
                        {e.normalized_identity_json.email}
                      </p>
                    </td>
                    <td className="px-3 py-3">
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
                    <td className="max-w-xs px-3 py-3 text-[var(--spm-text-muted)]">
                      {e.reconciliation_reason}
                    </td>
                    <td className="px-3 py-3">
                      {e.matched_lead_id ? (
                        <Link
                          href={`/leads/${e.matched_lead_id}`}
                          className="font-bold text-[var(--spm-blue-secondary)] hover:underline"
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
        </Panel>
      ) : null}
    </div>
  );
}
