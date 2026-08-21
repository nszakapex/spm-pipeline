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

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
          Analytics
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--spm-text-muted)]">
          Funnel leakage and source economics — what generates volume vs what
          generates enrollments.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Capture rate", rates.captureRate],
          ["Contact rate", rates.contactRate],
          ["Qualification", rates.qualificationRate],
          ["Booking rate", rates.bookingRate],
          ["Show rate", rates.showRate],
          ["Lead → Won", rates.winRate],
        ].map(([label, value]) => (
          <div key={label as string} className="spm-panel p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--spm-text-muted)]">
              {label as string}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              {formatPercent(value as number)}
            </p>
          </div>
        ))}
      </div>

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
        <ul className="space-y-3 px-5 pb-5">
          {funnel.map((step, idx) => (
            <li key={step.label} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3">
              <span className="text-sm font-semibold text-[var(--spm-navy)]">
                {step.label}
              </span>
              <div className="h-3 overflow-hidden rounded-full bg-[#e8eef8]">
                <div
                  className="h-full rounded-full bg-[var(--spm-blue-primary)]"
                  style={{ width: `${(step.count / max) * 100}%` }}
                />
              </div>
              <span className="text-right text-sm font-bold">{step.count}</span>
              {idx < funnel.length - 1 ? null : null}
            </li>
          ))}
        </ul>
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
        <div className="overflow-x-auto p-2">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.04em] text-[var(--spm-text-muted)]">
              <tr>
                <th className="px-3 py-2 font-bold">Source</th>
                <th className="px-3 py-2 font-bold">Volume</th>
                <th className="px-3 py-2 font-bold">Capture</th>
                <th className="px-3 py-2 font-bold">Qualified</th>
                <th className="px-3 py-2 font-bold">Meetings</th>
                <th className="px-3 py-2 font-bold">Won</th>
                <th className="px-3 py-2 font-bold">Health</th>
              </tr>
            </thead>
            <tbody>
              {bySource.map((s) => (
                <tr
                  key={s.sourceDefinitionId}
                  className="border-t border-[rgba(7,22,74,0.06)]"
                >
                  <td className="px-3 py-3 font-semibold">{s.sourceName}</td>
                  <td className="px-3 py-3">{s.submissionsReceived}</td>
                  <td className="px-3 py-3">{formatPercent(s.captureRate)}</td>
                  <td className="px-3 py-3">
                    {s.qualifiedCount} · {formatPercent(s.qualifiedRate)}
                  </td>
                  <td className="px-3 py-3">
                    {s.meetingCount} · {formatPercent(s.meetingRate)}
                  </td>
                  <td className="px-3 py-3">
                    {s.wonCount} · {formatPercent(s.wonRate)}
                  </td>
                  <td className="px-3 py-3">
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
        <div className="space-y-2 px-5 pb-5 text-sm text-[var(--spm-text-muted)]">
          <p>
            <strong className="text-[var(--spm-navy)]">Meta / Instagram:</strong>{" "}
            high volume, lower qualification — and the integrity gap that proves
            capture discipline matters.
          </p>
          <p>
            <strong className="text-[var(--spm-navy)]">Family referral:</strong>{" "}
            lower volume, strong qualification and enrollment.
          </p>
          <p>
            <strong className="text-[var(--spm-navy)]">Jake referral:</strong>{" "}
            high quality with some manual-ingestion risk.
          </p>
        </div>
      </Panel>
    </div>
  );
}
