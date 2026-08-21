import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { getLeadFlags } from "@/lib/analytics/queries";
import { getStore } from "@/lib/db/store";
import {
  DISPOSITION_LABELS,
  SCORE_BAND_LABELS,
  STAGE_LABELS,
} from "@/types/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = getStore().getLead(id);
  return {
    title: lead ? `${lead.first_name} ${lead.last_name}` : "Lead",
  };
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getStore();
  const lead = store.getLead(id);
  if (!lead) notFound();

  const owner = lead.owner_id ? store.getUser(lead.owner_id) : undefined;
  const factors = store
    .getScoreFactors(lead.id)
    .sort((a, b) => b.points - a.points);
  const activities = store
    .getActivities(lead.id)
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    );
  const sourceEvent = store
    .getSourceEvents()
    .find((e) => e.matched_lead_id === lead.id);
  const flags = getLeadFlags(lead);

  return (
    <div className="space-y-5 animate-fade-up">
      <Link
        href="/leads"
        className="text-sm font-bold text-[var(--spm-blue-secondary)] hover:underline"
      >
        ← Back to leads
      </Link>

      <header className="spm-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.9rem] font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
                {lead.first_name} {lead.last_name}
              </h1>
              <Badge
                tone={
                  lead.score_band === "P1"
                    ? "hot"
                    : lead.score_band === "P2"
                      ? "high"
                      : lead.score_band === "P3"
                        ? "nurture"
                        : "low"
                }
              >
                {SCORE_BAND_LABELS[lead.score_band]} · {lead.score}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-[var(--spm-text-muted)]">
              {lead.email ?? "No email"} · {lead.phone ?? "No phone"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="info">{lead.source}</Badge>
              <Badge tone="neutral">{STAGE_LABELS[lead.stage]}</Badge>
              <Badge tone="neutral">
                {DISPOSITION_LABELS[lead.disposition]}
              </Badge>
              <Badge
                tone={
                  lead.sync_status === "failed"
                    ? "danger"
                    : lead.sync_status === "synced"
                      ? "success"
                      : "warning"
                }
              >
                HubSpot {lead.sync_status}
              </Badge>
              {flags.map((f) => (
                <Badge
                  key={f.code}
                  tone={f.severity === "critical" ? "danger" : "warning"}
                >
                  {f.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {["Call", "Email", "Text", "Book", "Add Note", "Schedule Follow-up"].map(
              (label) => (
                <Button
                  key={label}
                  type="button"
                  variant={label === "Call" ? "primary" : "secondary"}
                  size="sm"
                  className="min-h-11"
                  disabled
                  title="Mock action — live outreach not enabled"
                >
                  {label}
                </Button>
              ),
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel className="border-[rgba(28,72,230,0.18)] bg-gradient-to-br from-white to-[#eef5ff]">
          <PanelHeader>
            <div>
              <PanelTitle>Next Action</PanelTitle>
              <PanelDescription>
                Every active lead must have a clear next step.
              </PanelDescription>
            </div>
          </PanelHeader>
          <div className="px-5 pb-5">
            <p className="text-2xl font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
              {lead.next_action_type ?? "No next action"}
            </p>
            <p className="mt-2 text-sm text-[var(--spm-text-muted)]">
              {lead.next_action_note ?? "Schedule a follow-up to keep this lead visible."}
            </p>
            {lead.next_action_at ? (
              <p className="mt-3 text-sm font-semibold text-[var(--spm-blue-secondary)]">
                Due {new Date(lead.next_action_at).toLocaleString()}
              </p>
            ) : (
              <p className="mt-3 text-sm font-semibold text-[var(--spm-danger)]">
                Missing next action timestamp
              </p>
            )}
            <p className="mt-4 text-sm text-[var(--spm-text-muted)]">
              Owner:{" "}
              <span className="font-semibold text-[var(--spm-navy)]">
                {owner?.name ?? "Unassigned"}
              </span>
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Why this score?</PanelTitle>
              <PanelDescription>
                Deterministic factors · {lead.score_version}
              </PanelDescription>
            </div>
          </PanelHeader>
          <ul className="space-y-2 px-5 pb-5">
            {factors.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-[var(--spm-navy)]">{f.label}</span>
                <span
                  className={`font-bold ${
                    f.points >= 0
                      ? "text-[var(--spm-success)]"
                      : "text-[var(--spm-danger)]"
                  }`}
                >
                  {f.points > 0 ? `+${f.points}` : f.points}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Timeline</PanelTitle>
              <PanelDescription>Chronological activity history</PanelDescription>
            </div>
          </PanelHeader>
          <ol className="space-y-3 px-5 pb-5">
            {activities.map((a) => (
              <li key={a.id} className="relative border-l-2 border-[#dbe7f7] pl-4">
                <p className="text-xs font-bold text-[var(--spm-text-muted)]">
                  {new Date(a.occurred_at).toLocaleString()}
                </p>
                <p className="font-semibold text-[var(--spm-navy)]">{a.title}</p>
                {a.body_summary ? (
                  <p className="text-sm text-[var(--spm-text-muted)]">
                    {a.body_summary}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Source / Attribution</PanelTitle>
              </div>
            </PanelHeader>
            <dl className="grid grid-cols-2 gap-3 px-5 pb-5 text-sm">
              <div>
                <dt className="text-[var(--spm-text-muted)]">Source</dt>
                <dd className="font-semibold">{lead.source}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Campaign</dt>
                <dd className="font-semibold">{lead.campaign ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">UTM</dt>
                <dd className="font-semibold">
                  {[lead.utm_source, lead.utm_medium, lead.utm_campaign]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Source event</dt>
                <dd className="font-semibold">
                  {sourceEvent ? sourceEvent.reconciliation_status : "—"}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>HubSpot</PanelTitle>
                <PanelDescription>Mock connector projection</PanelDescription>
              </div>
            </PanelHeader>
            <dl className="grid grid-cols-2 gap-3 px-5 pb-5 text-sm">
              <div>
                <dt className="text-[var(--spm-text-muted)]">Contact</dt>
                <dd className="font-semibold">
                  {lead.hubspot_contact_id ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Lead</dt>
                <dd className="font-semibold">{lead.hubspot_lead_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Deal</dt>
                <dd className="font-semibold">{lead.hubspot_deal_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Last synced</dt>
                <dd className="font-semibold">
                  {lead.last_synced_at
                    ? new Date(lead.last_synced_at).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
