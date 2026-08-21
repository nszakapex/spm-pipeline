import { Badge } from "@/components/ui/badge";
import {
  Panel,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { getAnalytics } from "@/lib/analytics/queries";
import { formatPercent } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  const { funnel, bySource, rates } = getAnalytics();
  const max = Math.max(...funnel.map((f) => f.count), 1);

  const rateRows = [
    ["Capture rate", rates.captureRate],
    ["Contact rate", rates.contactRate],
    ["Qualification", rates.qualificationRate],
    ["Booking rate", rates.bookingRate],
    ["Show rate", rates.showRate],
    ["Lead → Won", rates.winRate],
  ] as const;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--spm-navy)]">
          Analytics
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--spm-text-muted)]">
          Funnel leakage and source mix — volume vs enrollments.
        </p>
      </header>

      <section className="spm-panel overflow-hidden">
        <table className="spm-table">
          <thead>
            <tr>
              <th>Rate</th>
              <th className="text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {rateRows.map(([label, value]) => (
              <tr key={label}>
                <td className="text-[var(--spm-navy)]">{label}</td>
                <td className="text-right tabular-nums font-medium">
                  {formatPercent(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Funnel</PanelTitle>
            <PanelDescription>
              Leads → Contacted → Connected → Qualified → Jake Ready → Calls
              Booked → Calls Held → Enrollment Pending → Won
            </PanelDescription>
          </div>
        </PanelHeader>
        <div className="overflow-x-auto">
          <table className="spm-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Share</th>
                <th className="text-right">Count</th>
              </tr>
            </thead>
            <tbody>
              {funnel.map((step) => (
                <tr key={step.label}>
                  <td className="whitespace-nowrap font-medium text-[var(--spm-navy)]">
                    {step.label}
                  </td>
                  <td className="w-full min-w-[8rem]">
                    <div className="h-2 overflow-hidden rounded-sm bg-[#e8eef8]">
                      <div
                        className="h-full rounded-sm bg-gradient-to-r from-[var(--spm-sky)] to-[var(--spm-blue-primary)]"
                        style={{ width: `${(step.count / max) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="text-right tabular-nums font-medium">
                    {step.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Source comparison</PanelTitle>
            <PanelDescription>
              Meta drives volume; referrals drive quality.
            </PanelDescription>
          </div>
        </PanelHeader>
        <div className="overflow-x-auto">
          <table className="spm-table">
            <thead>
              <tr>
                <th>Source</th>
                <th className="text-right">Volume</th>
                <th>Capture</th>
                <th>Qualified</th>
                <th>Meetings</th>
                <th>Won</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {bySource.map((s) => (
                <tr key={s.sourceDefinitionId}>
                  <td className="font-medium">{s.sourceName}</td>
                  <td className="text-right tabular-nums">
                    {s.submissionsReceived}
                  </td>
                  <td className="tabular-nums">{formatPercent(s.captureRate)}</td>
                  <td className="tabular-nums">
                    {s.qualifiedCount} · {formatPercent(s.qualifiedRate)}
                  </td>
                  <td className="tabular-nums">
                    {s.meetingCount} · {formatPercent(s.meetingRate)}
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
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-1.5 border-t border-[rgba(7,22,74,0.08)] px-4 py-3 text-sm text-[var(--spm-text-muted)]">
          <p>
            <span className="font-medium text-[var(--spm-navy)]">
              Meta / Instagram:
            </span>{" "}
            high volume, lower qualification — capture gaps show up here.
          </p>
          <p>
            <span className="font-medium text-[var(--spm-navy)]">
              Family referral:
            </span>{" "}
            lower volume, stronger qualification and enrollment.
          </p>
          <p>
            <span className="font-medium text-[var(--spm-navy)]">
              Jake referral:
            </span>{" "}
            high quality with some manual-ingestion risk.
          </p>
        </div>
      </Panel>
    </div>
  );
}
