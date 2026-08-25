import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreMark } from "@/components/leads/score-mark";
import { Badge } from "@/components/ui/badge";
import {
  Panel,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { LogActivityForm } from "@/components/leads/log-activity-form";
import { getLeadFlags } from "@/lib/analytics/queries";
import { isAdminRole } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";
import { hydratePipelineForRequest } from "@/lib/db/hydrate-pipeline";
import { getStore } from "@/lib/db/store";
import { getEnv } from "@/lib/env";
import {
  DISPOSITION_LABELS,
  STAGE_LABELS,
  formatNextAction,
} from "@/types/domain";
import { formatOpsDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await hydratePipelineForRequest();
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
  await hydratePipelineForRequest();
  const { id } = await params;
  const store = getStore();
  const lead = store.getLead(id);
  if (!lead) notFound();
  const session = await getSessionUser();
  const admin = isAdminRole(session?.role);
  const jakeMeetingsUrl = getEnv().JAKE_MEETINGS_URL;

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
    <div className="space-y-5">
      <Link
        href="/leads"
        className="text-sm font-medium text-[var(--spm-blue-secondary)] hover:underline"
      >
        ← Back to leads
      </Link>

      <header className="spm-panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-[var(--spm-navy)]">
                {lead.first_name} {lead.last_name}
              </h1>
              <ScoreMark band={lead.score_band} score={lead.score} />
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
        </div>
      </header>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Next Action</PanelTitle>
            <PanelDescription>
              Do this first, then log the result below.
            </PanelDescription>
          </div>
        </PanelHeader>
        <div className="px-5 pb-5">
          <p className="text-base font-semibold text-[var(--spm-navy)]">
            {formatNextAction(lead.next_action_type)}
          </p>
          <p className="mt-2 text-sm text-[var(--spm-text-muted)]">
            {lead.next_action_note ?? "Schedule a follow-up to keep this lead visible."}
          </p>
          {lead.next_action_at ? (
            <p className="mt-3 text-sm font-medium text-[var(--spm-navy)]">
              Due {formatOpsDate(lead.next_action_at)}
            </p>
          ) : (
            <p className="mt-3 text-sm font-medium text-[var(--spm-navy)]">
              Missing next action timestamp
            </p>
          )}
          <p className="mt-4 text-sm text-[var(--spm-text-muted)]">
            Owner:{" "}
            <span className="font-medium text-[var(--spm-navy)]">
              {owner?.name ?? "Unassigned"}
            </span>
          </p>
          {jakeMeetingsUrl ? (
            <p className="mt-4">
              <a
                href={jakeMeetingsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[var(--spm-blue-primary)] hover:underline"
              >
                Open Jake&apos;s meetings link
              </a>
            </p>
          ) : admin ? (
            <p className="mt-4 text-sm text-[var(--spm-text-muted)]">
              Jake&apos;s meetings link is not set yet. Add it from Integrations.
            </p>
          ) : null}
        </div>
      </Panel>

      <LogActivityForm
        leadId={lead.id}
        canWrite={session?.role !== "viewer"}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Score factors</PanelTitle>
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
                  className={`font-medium ${
                    f.points >= 0
                      ? "text-[var(--spm-blue-primary)]"
                      : "text-[var(--spm-navy)]"
                  }`}
                >
                  {f.points > 0 ? `+${f.points}` : f.points}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Timeline</PanelTitle>
              <PanelDescription>Activity on this lead</PanelDescription>
            </div>
          </PanelHeader>
          <ol className="space-y-3 px-5 pb-5">
            {activities.map((a) => (
              <li key={a.id} className="relative border-l-2 border-[var(--spm-gold)] pl-4">
                <p className="text-xs text-[var(--spm-text-muted)]">
                  {formatOpsDate(a.occurred_at)}
                </p>
                <p className="font-medium text-[var(--spm-navy)]">{a.title}</p>
                {a.body_summary ? (
                  <p className="text-sm text-[var(--spm-text-muted)]">
                    {a.body_summary}
                  </p>
                ) : null}
                {typeof a.metadata_json.intent === "string" ? (
                  <p className="text-xs text-[var(--spm-text-muted)]">
                    Intent: {a.metadata_json.intent.replace(/_/g, " ")}
                  </p>
                ) : null}
                {typeof a.metadata_json.recommendedNextAction === "string" ? (
                  <p className="text-xs text-[var(--spm-text-muted)]">
                    Recommended:{" "}
                    {String(a.metadata_json.recommendedNextAction).replace(/_/g, " ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Source / Attribution</PanelTitle>
            </div>
          </PanelHeader>
          <dl className="grid grid-cols-2 gap-3 px-5 pb-5 text-sm">
            <div>
              <dt className="text-[var(--spm-text-muted)]">Source</dt>
              <dd className="font-medium">{lead.source}</dd>
            </div>
            <div>
              <dt className="text-[var(--spm-text-muted)]">Campaign</dt>
              <dd className="font-medium">{lead.campaign ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--spm-text-muted)]">UTM</dt>
              <dd className="font-medium">
                {[lead.utm_source, lead.utm_medium, lead.utm_campaign]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--spm-text-muted)]">Source event</dt>
              <dd className="font-medium">
                {sourceEvent ? sourceEvent.reconciliation_status : "—"}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>HubSpot</PanelTitle>
              <PanelDescription>
                {admin
                  ? "CRM record. Inbound signatures and routes stay on Integrations."
                  : "CRM record. HubSpot stays the source of truth."}
              </PanelDescription>
            </div>
          </PanelHeader>
          <dl className="grid grid-cols-2 gap-3 px-5 pb-5 text-sm">
            <div>
              <dt className="text-[var(--spm-text-muted)]">Contact</dt>
              <dd className="font-medium">
                {lead.hubspot_contact_id ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--spm-text-muted)]">Lead</dt>
              <dd className="font-medium">{lead.hubspot_lead_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--spm-text-muted)]">Deal</dt>
              <dd className="font-medium">{lead.hubspot_deal_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--spm-text-muted)]">Last synced</dt>
              <dd className="font-medium">
                {lead.last_synced_at
                  ? formatOpsDate(lead.last_synced_at)
                  : "—"}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
