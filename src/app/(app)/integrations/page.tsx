import { Badge } from "@/components/ui/badge";
import { getHubSpotFailureSummary } from "@/integrations/hubspot/sync";
import { getStore } from "@/lib/db/store";
import { formatOpsDate } from "@/lib/utils";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const summary = await getHubSpotFailureSummary();
  const unmatched = getStore()
    .getSourceEvents()
    .filter((e) => ["unmatched", "failed"].includes(e.reconciliation_status));
  const syncEvents = getStore()
    .getSyncEvents()
    .sort(
      (a, b) =>
        new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime(),
    );
  const failed = syncEvents.filter((e) => e.status === "failed");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--spm-navy)]">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
          HubSpot remains the CRM source of truth. This prototype uses a mock
          connector only.
        </p>
      </header>

      <section className="spm-panel overflow-hidden">
        <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
              HubSpot
            </h2>
            <Badge tone="info">Mock connector</Badge>
          </div>
        </div>
        <table className="spm-table">
          <tbody>
            <tr>
              <td className="text-[var(--spm-text-muted)]">Status</td>
              <td className="font-medium text-[var(--spm-navy)]">
                Connected — mock environment
              </td>
            </tr>
            <tr>
              <td className="text-[var(--spm-text-muted)]">Last successful sync</td>
              <td className="font-medium text-[var(--spm-navy)]">
                {summary.lastSuccessfulSync
                  ? formatOpsDate(summary.lastSuccessfulSync)
                  : "—"}
              </td>
            </tr>
            <tr>
              <td className="text-[var(--spm-text-muted)]">Unmatched records</td>
              <td className="tabular-nums font-medium text-[var(--spm-navy)]">
                {summary.unmatchedCount}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="spm-panel overflow-hidden">
        <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
            Failed sync events
          </h2>
        </div>
        {failed.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[var(--spm-text-muted)]">None.</p>
        ) : (
          <table className="spm-table">
            <thead>
              <tr>
                <th>Object</th>
                <th>Reason</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {failed.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Badge tone="danger">{e.status}</Badge>{" "}
                    <span className="font-medium text-[var(--spm-navy)]">
                      {e.object_type}
                    </span>
                    <p className="text-xs text-[var(--spm-text-muted)]">
                      {e.object_id ?? "no object id"}
                    </p>
                  </td>
                  <td className="text-[var(--spm-text-muted)]">{e.reason}</td>
                  <td className="whitespace-nowrap text-[var(--spm-text-muted)]">
                    {formatOpsDate(e.attempted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="spm-panel overflow-hidden">
        <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
            Unmatched source events
          </h2>
          <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
            Acquisition events without CRM representation.
          </p>
        </div>
        {unmatched.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[var(--spm-text-muted)]">None.</p>
        ) : (
          <table className="spm-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Source</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {unmatched.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium text-[var(--spm-navy)]">
                    {e.normalized_identity_json.first_name}{" "}
                    {e.normalized_identity_json.last_name}
                  </td>
                  <td className="text-[var(--spm-text-muted)]">{e.source_name}</td>
                  <td className="text-[var(--spm-text-muted)]">
                    {e.reconciliation_reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
