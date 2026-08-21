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
import { SCORE_BAND_LABELS, formatNextAction } from "@/types/domain";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const m = getDashboardMetrics();
  const healthIssues = m.health.components.filter((c) => c.violations > 0);

  const snapshot = [
    {
      label: "Pipeline health",
      value: `${m.pipelineHealth}%`,
      href: "/settings#pipeline-health",
      dest: "Settings",
    },
    {
      label: "New leads today",
      value: String(m.newToday),
      href: "/leads?scope=today",
      dest: "Leads",
    },
    {
      label: "Hot leads",
      value: String(m.hot),
      href: "/leads?band=P1",
      dest: "Leads",
    },
    {
      label: "Needs reply",
      value: String(m.needsReply),
      href: "/leads?risk=needs_reply",
      dest: "Leads",
    },
    {
      label: "Jake ready",
      value: String(m.jakeReady),
      href: "/leads?stage=JAKE_READY",
      dest: "Leads",
    },
    {
      label: "Calls booked",
      value: String(m.callsBooked),
      href: "/leads?stage=CALL_BOOKED",
      dest: "Leads",
    },
    {
      label: "Nurture due today",
      value: String(m.nurtureDue),
      href: "/nurture",
      dest: "Nurture",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="spm-kicker">Pipeline Control</p>
        <h1 className="spm-page-title mt-2">Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--spm-text-muted)]">
          Queue load and assignment gaps. HubSpot stays the CRM; this page shows
          what still needs a next step.
        </p>
      </header>

      <section className="spm-panel overflow-hidden">
        <table className="spm-table">
          <thead>
            <tr>
              <th>Snapshot</th>
              <th className="text-right">Count</th>
              <th>Open in</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.map((row) => (
              <tr key={row.label}>
                <td className="text-[var(--spm-navy)]">{row.label}</td>
                <td className="text-right tabular-nums font-medium text-[var(--spm-navy)]">
                  {row.value}
                </td>
                <td>
                  <Link
                    href={row.href}
                    className="text-[var(--spm-blue-secondary)] hover:underline"
                  >
                    {row.dest}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-[rgba(7,22,74,0.08)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--spm-navy)]">
            Why health is not 100%
          </p>
          <ul className="mt-1.5 space-y-1">
            {healthIssues.length === 0 ? (
              <li className="text-sm text-[var(--spm-text-muted)]">
                No weighted violations detected.
              </li>
            ) : (
              healthIssues.map((c) => (
                <li key={c.key} className="text-sm text-[var(--spm-text-muted)]">
                  <span className="font-medium text-[var(--spm-navy)]">
                    {c.label}:
                  </span>{" "}
                  {c.violations} issue{c.violations === 1 ? "" : "s"} (−
                  {c.contribution.toFixed(1)} pts)
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="spm-panel overflow-hidden">
          <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
              Needs attention
            </h2>
            <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
              Integrity and nurture queues with a count.
            </p>
          </div>
          <table className="spm-table">
            <thead>
              <tr>
                <th>Queue</th>
                <th className="text-right">Count</th>
                <th>Open in</th>
              </tr>
            </thead>
            <tbody>
              {m.attention.map((item) => (
                <tr key={item.code}>
                  <td className="text-[var(--spm-navy)]">{item.label}</td>
                  <td className="text-right tabular-nums font-medium text-[var(--spm-navy)]">
                    {item.count}
                  </td>
                  <td>
                    <Link
                      href={item.href}
                      className="text-[var(--spm-blue-secondary)] hover:underline"
                    >
                      {item.href.startsWith("/sources") ? "Sources" : "Leads"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="spm-panel overflow-hidden">
          <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
              Source health
            </h2>
            <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
              Capture integrity by channel.
            </p>
          </div>
          <table className="spm-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Accounted</th>
                <th>Capture</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {m.sourceHealth.map((s) => (
                <tr key={s.sourceDefinitionId}>
                  <td>
                    <Link
                      href={`/sources?source=${encodeURIComponent(s.sourceName)}`}
                      className="font-medium text-[var(--spm-navy)] hover:underline"
                    >
                      {s.sourceName}
                    </Link>
                  </td>
                  <td className="tabular-nums text-[var(--spm-text-muted)]">
                    {s.accountedFor}/{s.submissionsReceived}
                  </td>
                  <td className="tabular-nums text-[var(--spm-text-muted)]">
                    {formatPercent(s.captureRate)}
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
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Priority leads</PanelTitle>
            <PanelDescription>
              Highest-urgency records, why they sit here, and the next step.
            </PanelDescription>
          </div>
          <Link
            href="/nurture"
            className="text-sm font-medium text-[var(--spm-blue-secondary)] hover:underline"
          >
            Nurture queue
          </Link>
        </PanelHeader>
        <div className="overflow-x-auto">
          <table className="spm-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Why</th>
                <th>Next step</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {m.priorityLeads.map(({ lead, why, flags }) => (
                <tr key={lead.id}>
                  <td>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-[var(--spm-navy)] hover:underline"
                    >
                      {lead.first_name} {lead.last_name}
                    </Link>
                    <p className="text-xs text-[var(--spm-text-muted)]">
                      {SCORE_BAND_LABELS[lead.score_band]} · {lead.score}
                    </p>
                  </td>
                  <td className="max-w-xs text-[var(--spm-text-muted)]">{why}</td>
                  <td className="whitespace-nowrap font-medium text-[var(--spm-navy)]">
                    {formatNextAction(lead.next_action_type)}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {flags.slice(0, 2).map((f) => (
                        <Badge
                          key={f.code}
                          tone={f.severity === "critical" ? "danger" : "warning"}
                        >
                          {f.label}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
