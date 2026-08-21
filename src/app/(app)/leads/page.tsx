import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getLeadFlags, filterLeadsByFlag } from "@/lib/analytics/queries";
import { getStore } from "@/lib/db/store";
import {
  DISPOSITION_LABELS,
  SCORE_BAND_LABELS,
  STAGE_LABELS,
  formatNextAction,
  type Lead,
} from "@/types/domain";
import { formatOpsDate } from "@/lib/utils";
import type { RiskFlagCode as FlagCode } from "@/lib/nurture/flags";

export const metadata = { title: "Leads" };

function applyFilters(
  leads: Lead[],
  params: Record<string, string | undefined>,
): Lead[] {
  let result = [...leads];
  if (params.band) result = result.filter((l) => l.score_band === params.band);
  if (params.stage) result = result.filter((l) => l.stage === params.stage);
  if (params.disposition)
    result = result.filter((l) => l.disposition === params.disposition);
  if (params.source)
    result = result.filter((l) =>
      l.source.toLowerCase().includes(params.source!.toLowerCase()),
    );
  if (params.owner)
    result = result.filter((l) => l.owner_id === params.owner);
  if (params.jake === "1" || params.stage === "JAKE_READY") {
    result = result.filter((l) => l.stage === "JAKE_READY");
  }
  if (params.risk) {
    const flagged = new Set(
      filterLeadsByFlag(params.risk as FlagCode).map((l) => l.id),
    );
    result = result.filter((l) => flagged.has(l.id));
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    result = result.filter((l) => {
      const hay = `${l.first_name} ${l.last_name} ${l.email ?? ""} ${l.phone ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }
  if (params.scope === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    result = result.filter((l) => new Date(l.created_at) >= start);
  }
  if (params.due === "1") {
    const now = Date.now();
    result = result.filter(
      (l) => l.next_action_at && new Date(l.next_action_at).getTime() <= now,
    );
  }
  return result.sort((a, b) => b.score - a.score);
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const store = getStore();
  const leads = applyFilters(store.getLeads(), params);

  return (
    <div className="space-y-5 animate-fade-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
            Leads
          </h1>
          <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
            {leads.length} records
            {params.risk ? ` · risk: ${params.risk}` : ""}
          </p>
        </div>
        <form className="flex w-full max-w-md gap-2">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search name, email, phone"
            className="h-11 flex-1 rounded-full border border-[rgba(7,22,74,0.12)] bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--spm-blue-secondary)]/35"
          />
          <button
            type="submit"
            className="h-11 rounded-full bg-gradient-to-b from-[var(--spm-sky)] to-[var(--spm-blue-primary)] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(28,72,230,0.18)]"
          >
            Search
          </button>
        </form>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { href: "/leads", label: "All" },
          { href: "/leads?band=P1", label: "Hot" },
          { href: "/leads?stage=JAKE_READY", label: "Jake-ready" },
          { href: "/leads?risk=no_owner", label: "No owner" },
          { href: "/leads?risk=follow_up_overdue", label: "Overdue" },
          { href: "/leads?risk=needs_reply", label: "Needs reply" },
          { href: "/leads?due=1", label: "Action due" },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="shrink-0 rounded-full border border-[rgba(7,22,74,0.12)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--spm-navy)]"
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="spm-panel hidden overflow-hidden md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f8fafd] text-xs uppercase tracking-[0.04em] text-[var(--spm-text-muted)]">
            <tr>
              <th className="px-4 py-3 font-bold">Lead</th>
              <th className="px-4 py-3 font-bold">Priority</th>
              <th className="px-4 py-3 font-bold">Source</th>
              <th className="px-4 py-3 font-bold">Owner</th>
              <th className="px-4 py-3 font-bold">Stage</th>
              <th className="px-4 py-3 font-bold">Next action</th>
              <th className="px-4 py-3 font-bold">HubSpot</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const owner = lead.owner_id
                ? store.getUser(lead.owner_id)
                : undefined;
              const flags = getLeadFlags(lead);
              return (
                <tr
                  key={lead.id}
                  className="border-t border-[rgba(7,22,74,0.06)] hover:bg-[#f7f9ff]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-semibold text-[var(--spm-navy)] hover:text-[var(--spm-blue-secondary)]"
                    >
                      {lead.first_name} {lead.last_name}
                    </Link>
                    <p className="text-xs text-[var(--spm-text-muted)]">
                      {lead.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
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
                    {flags[0] ? (
                      <p className="mt-1 text-[11px] text-[var(--spm-danger)]">
                        {flags[0].label}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--spm-text-muted)]">
                    {lead.source}
                  </td>
                  <td className="px-4 py-3">
                    {owner?.name ?? (
                      <span className="font-bold text-[var(--spm-danger)]">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div>{STAGE_LABELS[lead.stage]}</div>
                      <Badge tone="neutral">
                        {DISPOSITION_LABELS[lead.disposition]}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--spm-text-muted)]">
                    {formatNextAction(lead.next_action_type)}
                    {lead.next_action_at ? (
                      <p className="text-xs">{formatOpsDate(lead.next_action_at)}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        lead.sync_status === "failed"
                          ? "danger"
                          : lead.sync_status === "synced"
                            ? "success"
                            : "warning"
                      }
                    >
                      {lead.sync_status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {leads.map((lead) => {
          const flags = getLeadFlags(lead);
          return (
            <li key={lead.id}>
              <Link href={`/leads/${lead.id}`} className="spm-panel block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--spm-navy)]">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-xs text-[var(--spm-text-muted)]">
                      {lead.source}
                    </p>
                  </div>
                  <Badge tone={lead.score_band === "P1" ? "hot" : "high"}>
                    {lead.score}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{STAGE_LABELS[lead.stage]}</Badge>
                  <Badge tone="neutral">
                    {DISPOSITION_LABELS[lead.disposition]}
                  </Badge>
                  {flags.slice(0, 1).map((f) => (
                    <Badge key={f.code} tone="danger">
                      {f.label}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm text-[var(--spm-text-muted)]">
                  Next: {formatNextAction(lead.next_action_type)}
                  {lead.next_action_note ? ` · ${lead.next_action_note}` : ""}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
