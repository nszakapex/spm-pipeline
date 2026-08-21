import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Panel,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { getDashboardMetrics } from "@/lib/analytics/queries";
import { formatPercent } from "@/lib/utils";
import { SCORE_BAND_LABELS } from "@/types/domain";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const m = getDashboardMetrics();

  const healthCards = [
    { label: "Pipeline Health", value: `${m.pipelineHealth}%`, href: "/settings#pipeline-health" },
    { label: "New Leads Today", value: String(m.newToday), href: "/leads?scope=today" },
    { label: "Hot Leads", value: String(m.hot), href: "/leads?band=P1" },
    { label: "Needs Reply", value: String(m.needsReply), href: "/leads?risk=needs_reply" },
    { label: "Jake Ready", value: String(m.jakeReady), href: "/leads?stage=JAKE_READY" },
    { label: "Calls Booked", value: String(m.callsBooked), href: "/leads?stage=CALL_BOOKED" },
    { label: "Nurture Due Today", value: String(m.nurtureDue), href: "/nurture" },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--spm-blue-secondary)]">
          Control tower
        </p>
        <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[var(--spm-navy)] sm:text-[2.1rem]">
          What needs attention right now?
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--spm-text-muted)]">
          Pipeline health is {m.pipelineHealth}%. Click any metric to inspect the
          underlying leads. HubSpot remains the CRM source of truth — this layer
          makes leads impossible to lose between acquisition and close.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-bold text-[var(--spm-navy)]">
          Pipeline Health
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {healthCards.map((card) => (
            <Link key={card.label} href={card.href} className="spm-panel p-4 transition hover:-translate-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--spm-text-muted)]">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
                {card.value}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-3 spm-panel p-4">
          <p className="text-sm font-semibold text-[var(--spm-navy)]">
            Why health is not 100%
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {m.health.components
              .filter((c) => c.violations > 0)
              .map((c) => (
                <li
                  key={c.key}
                  className="text-sm text-[var(--spm-text-muted)]"
                >
                  <span className="font-semibold text-[var(--spm-navy)]">
                    {c.label}:
                  </span>{" "}
                  {c.violations} issue{c.violations === 1 ? "" : "s"} (−
                  {c.contribution.toFixed(1)} pts)
                </li>
              ))}
            {m.health.components.every((c) => c.violations === 0) ? (
              <li className="text-sm text-[var(--spm-text-muted)]">
                No weighted violations detected.
              </li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Needs Attention</PanelTitle>
              <PanelDescription>
                Operational risks across integrity and nurture guarantees.
              </PanelDescription>
            </div>
          </PanelHeader>
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {m.attention.map((item) => (
              <Link
                key={item.code}
                href={item.href}
                className="rounded-[1rem] border border-[rgba(7,22,74,0.08)] bg-[#f8fafd] px-3.5 py-3 transition hover:border-[rgba(47,111,196,0.35)] hover:bg-[#edf3ff]"
              >
                <p className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-[var(--spm-navy)]">
                  {item.count}
                </p>
                <p className="mt-2 text-xs font-bold text-[var(--spm-text-muted)]">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader>
            <div>
              <PanelTitle>Source Health</PanelTitle>
              <PanelDescription>Capture integrity by channel.</PanelDescription>
            </div>
          </PanelHeader>
          <ul className="space-y-2 p-4">
            {m.sourceHealth.map((s) => (
              <li key={s.sourceDefinitionId}>
                <Link
                  href={`/sources?source=${encodeURIComponent(s.sourceName)}`}
                  className="flex items-center justify-between gap-3 rounded-[1rem] border border-[rgba(7,22,74,0.08)] px-3.5 py-3 hover:bg-[#f8fafd]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--spm-navy)]">
                      {s.sourceName}
                    </p>
                    <p className="text-xs text-[var(--spm-text-muted)]">
                      {s.accountedFor}/{s.submissionsReceived} accounted ·{" "}
                      {formatPercent(s.captureRate)}
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
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Priority Leads</PanelTitle>
            <PanelDescription>
              Highest-urgency records with an explicit why.
            </PanelDescription>
          </div>
          <Link
            href="/nurture"
            className="text-sm font-bold text-[var(--spm-blue-secondary)] hover:underline"
          >
            Open nurture queue
          </Link>
        </PanelHeader>
        <ul className="divide-y divide-[rgba(7,22,74,0.06)] p-2">
          {m.priorityLeads.map(({ lead, why, flags }) => (
            <li key={lead.id}>
              <Link
                href={`/leads/${lead.id}`}
                className="flex flex-col gap-2 rounded-[1rem] px-3 py-3.5 transition hover:bg-[#f7f9ff] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold tracking-[-0.02em] text-[var(--spm-navy)]">
                      {lead.first_name} {lead.last_name}
                    </p>
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
                  <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
                    {why}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {flags.slice(0, 2).map((f) => (
                    <Badge
                      key={f.code}
                      tone={f.severity === "critical" ? "danger" : "warning"}
                    >
                      {f.label}
                    </Badge>
                  ))}
                  <Badge tone="neutral">{lead.next_action_type ?? "No action"}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
