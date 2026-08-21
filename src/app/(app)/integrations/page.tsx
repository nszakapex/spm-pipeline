import { Badge } from "@/components/ui/badge";
import { getHubSpotFailureSummary } from "@/integrations/hubspot/sync";
import { getStore } from "@/lib/db/store";
import {
  PRE_REGISTERED_WEBHOOKS,
  STAGE_INTEGRATIONS,
  WEBHOOK_CHANNEL_PATHS,
} from "@/lib/pipeline/stage-integrations";
import { STAGE_LABELS } from "@/types/domain";
import { formatOpsDate } from "@/lib/utils";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const summary = await getHubSpotFailureSummary();
  const store = getStore();
  const unmatched = store
    .getSourceEvents()
    .filter((e) => ["unmatched", "failed"].includes(e.reconciliation_status));
  const syncEvents = store
    .getSyncEvents()
    .sort(
      (a, b) =>
        new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime(),
    );
  const failed = syncEvents.filter((e) => e.status === "failed");
  const receipts = store.getIngestReceipts();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="spm-page-title">Integrations</h1>
        <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
          HubSpot remains the CRM source of truth. Jake&apos;s calendar is HubSpot
          Meetings. Webhooks are pre-registered in mock — signed ingest only, no
          live credentials.
        </p>
      </header>

      <section className="spm-panel overflow-hidden">
        <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
            What fires at each stage
          </h2>
          <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
            Same stage machine the queues use. Events land on the timeline, then
            restage, rescore, and set the next action.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="spm-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>HubSpot</th>
                <th>Jake&apos;s calendar</th>
                <th>Sales calls</th>
                <th>Lead replies</th>
              </tr>
            </thead>
            <tbody>
              {STAGE_INTEGRATIONS.map((row) => (
                <tr key={row.stage}>
                  <td className="whitespace-nowrap font-medium text-[var(--spm-navy)]">
                    {STAGE_LABELS[row.stage]}
                  </td>
                  <td className="text-[var(--spm-text-muted)]">{row.hubspot}</td>
                  <td className="text-[var(--spm-text-muted)]">{row.jakeCalendar}</td>
                  <td className="text-[var(--spm-text-muted)]">{row.salesCalls}</td>
                  <td className="text-[var(--spm-text-muted)]">{row.leadResponses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="spm-panel overflow-hidden">
        <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
              Pre-registered webhooks
            </h2>
            <Badge tone="info">Mock · HMAC spm-v1</Badge>
          </div>
          <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
            POST to these routes with{" "}
            <code className="text-[12px]">X-SPM-Webhook-Timestamp</code> and{" "}
            <code className="text-[12px]">X-SPM-Webhook-Signature</code>. Live
            HubSpot subscription create is not enabled.
          </p>
        </div>
        <table className="spm-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Route</th>
              <th>Provider event</th>
              <th>Becomes</th>
            </tr>
          </thead>
          <tbody>
            {PRE_REGISTERED_WEBHOOKS.map((hook) => (
              <tr key={hook.id}>
                <td className="capitalize text-[var(--spm-navy)]">{hook.channel}</td>
                <td className="font-medium text-[var(--spm-navy)]">{hook.path}</td>
                <td className="text-[var(--spm-text-muted)]">{hook.providerEvent}</td>
                <td className="text-[var(--spm-text-muted)]">{hook.canonicalType}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-[rgba(7,22,74,0.08)] px-4 py-3 text-xs text-[var(--spm-text-muted)]">
          Endpoints: {Object.values(WEBHOOK_CHANNEL_PATHS).join(" · ")}
        </p>
      </section>

      <section className="spm-panel overflow-hidden">
        <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
            Recent webhook ingest
          </h2>
          <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
            Process-local overlay on the demo dataset. Cold starts clear this log.
          </p>
        </div>
        {receipts.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[var(--spm-text-muted)]">
            None yet. Signed mock POSTs append receipts here and update the matching
            lead.
          </p>
        ) : (
          <table className="spm-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Lead / stage</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {receipts.slice(0, 20).map((r) => (
                <tr key={r.id}>
                  <td>
                    <Badge tone={r.status === "applied" ? "success" : "warning"}>
                      {r.status}
                    </Badge>{" "}
                    <span className="font-medium text-[var(--spm-navy)]">
                      {r.event_type}
                    </span>
                    <p className="text-xs text-[var(--spm-text-muted)]">{r.summary}</p>
                  </td>
                  <td className="text-[var(--spm-text-muted)]">
                    {r.lead_id ?? "unmatched"}
                    {r.stage_before && r.stage_after
                      ? ` · ${STAGE_LABELS[r.stage_before]} → ${STAGE_LABELS[r.stage_after]}`
                      : null}
                  </td>
                  <td className="whitespace-nowrap text-[var(--spm-text-muted)]">
                    {formatOpsDate(r.received_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="spm-panel overflow-hidden">
        <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">HubSpot</h2>
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
