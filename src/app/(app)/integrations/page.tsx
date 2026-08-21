import { Badge } from "@/components/ui/badge";
import {
  Panel,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { getHubSpotFailureSummary } from "@/integrations/hubspot/sync";
import { getStore } from "@/lib/db/store";

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

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
          HubSpot remains the CRM source of truth. This prototype uses a mock
          connector only.
        </p>
      </header>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>HubSpot</PanelTitle>
            <PanelDescription>CRM sync adapter</PanelDescription>
          </div>
          <Badge tone="info">Mock connector</Badge>
        </PanelHeader>
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-3">
          <div className="rounded-[1rem] border border-[rgba(7,22,74,0.08)] bg-[#f8fafd] p-4">
            <p className="text-xs font-bold uppercase text-[var(--spm-text-muted)]">
              Status
            </p>
            <p className="mt-2 font-semibold text-[var(--spm-navy)]">
              Connected — Mock Environment
            </p>
          </div>
          <div className="rounded-[1rem] border border-[rgba(7,22,74,0.08)] bg-[#f8fafd] p-4">
            <p className="text-xs font-bold uppercase text-[var(--spm-text-muted)]">
              Last successful sync
            </p>
            <p className="mt-2 font-semibold text-[var(--spm-navy)]">
              {summary.lastSuccessfulSync
                ? new Date(summary.lastSuccessfulSync).toLocaleString()
                : "—"}
            </p>
          </div>
          <div className="rounded-[1rem] border border-[rgba(7,22,74,0.08)] bg-[#f8fafd] p-4">
            <p className="text-xs font-bold uppercase text-[var(--spm-text-muted)]">
              Unmatched records
            </p>
            <p className="mt-2 font-semibold text-[var(--spm-navy)]">
              {summary.unmatchedCount}
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Failed sync events</PanelTitle>
          </div>
        </PanelHeader>
        <ul className="divide-y divide-[rgba(7,22,74,0.06)] px-2 pb-2">
          {syncEvents
            .filter((e) => e.status === "failed")
            .map((e) => (
              <li key={e.id} className="px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="danger">{e.status}</Badge>
                  <span className="font-semibold text-[var(--spm-navy)]">
                    {e.object_type}
                  </span>
                  <span className="text-[var(--spm-text-muted)]">
                    {e.object_id ?? "no object id"}
                  </span>
                </div>
                <p className="mt-1 text-[var(--spm-text-muted)]">{e.reason}</p>
                <p className="mt-1 text-xs text-[var(--spm-text-muted)]">
                  {new Date(e.attempted_at).toLocaleString()}
                </p>
              </li>
            ))}
        </ul>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Unmatched source events</PanelTitle>
            <PanelDescription>
              Acquisition events without CRM representation
            </PanelDescription>
          </div>
        </PanelHeader>
        <ul className="divide-y divide-[rgba(7,22,74,0.06)] px-2 pb-2">
          {unmatched.map((e) => (
            <li key={e.id} className="px-3 py-3 text-sm">
              <p className="font-semibold text-[var(--spm-navy)]">
                {e.normalized_identity_json.first_name}{" "}
                {e.normalized_identity_json.last_name} · {e.source_name}
              </p>
              <p className="text-[var(--spm-text-muted)]">
                {e.reconciliation_reason}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
