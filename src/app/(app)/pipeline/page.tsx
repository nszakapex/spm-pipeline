import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getLeadFlags } from "@/lib/analytics/queries";
import { getStore } from "@/lib/db/store";
import { OPEN_STAGES, STAGE_LABELS, DISPOSITION_LABELS, formatNextAction, type LeadStage } from "@/types/domain";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const params = await searchParams;
  const store = getStore();
  const leads = store.getLeads().filter((l) => OPEN_STAGES.includes(l.stage));
  const selected = (params.stage as LeadStage | undefined) ?? null;

  const columns = OPEN_STAGES.map((stage) => {
    const items = leads.filter((l) => l.stage === stage);
    return {
      stage,
      items,
      hot: items.filter((l) => l.score_band === "P1").length,
      overdue: items.filter((l) =>
        getLeadFlags(l).some((f) =>
          ["follow_up_overdue", "first_contact_overdue", "no_show_recovery"].includes(
            f.code,
          ),
        ),
      ).length,
    };
  });

  const mobileStage = selected ?? "NEW";
  const mobileItems =
    columns.find((c) => c.stage === mobileStage)?.items ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--spm-navy)]">Pipeline</h1>
        <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
          Open stages only. Disposition (nurture, no-show, etc.) is on each
          card, not a separate column.
        </p>
      </header>

      {/* Mobile stage list */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {columns.map((c) => (
            <Link
              key={c.stage}
              href={`/pipeline?stage=${c.stage}`}
              className={`spm-chip ${mobileStage === c.stage ? "spm-chip-active" : ""}`}
            >
              {STAGE_LABELS[c.stage]} ({c.items.length})
            </Link>
          ))}
        </div>
        <ul className="mt-3 space-y-3">
          {mobileItems.map((lead) => (
            <LeadCard key={lead.id} leadId={lead.id} />
          ))}
        </ul>
      </div>

      {/* Desktop kanban */}
      <div className="hidden gap-3 overflow-x-auto pb-2 md:flex">
        {columns.map((col) => (
          <section
            key={col.stage}
            className="spm-panel flex w-[260px] shrink-0 flex-col"
          >
            <header className="border-b border-[rgba(7,22,74,0.06)] px-3 py-3">
              <p className="text-sm font-semibold text-[var(--spm-navy)]">
                {STAGE_LABELS[col.stage]}
              </p>
              <p className="mt-1 text-xs text-[var(--spm-text-muted)]">
                {col.items.length} · {col.hot} hot · {col.overdue} overdue
              </p>
            </header>
            <ul className="spm-scroll max-h-[70vh] space-y-2 overflow-y-auto p-2">
              {col.items.map((lead) => (
                <li key={lead.id}>
                  <LeadCard leadId={lead.id} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function LeadCard({ leadId }: { leadId: string }) {
  const lead = getStore().getLead(leadId);
  if (!lead) return null;
  const owner = lead.owner_id ? getStore().getUser(lead.owner_id) : undefined;
  const flags = getLeadFlags(lead);
  return (
    <Link href={`/leads/${lead.id}`} className="spm-card block p-3 hover:bg-[var(--spm-cream)]">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-[var(--spm-navy)]">
          {lead.first_name} {lead.last_name}
        </p>
        <Badge tone={lead.score_band === "P1" ? "hot" : "high"}>{lead.score}</Badge>
      </div>
      <p className="mt-1 text-xs text-[var(--spm-text-muted)]">{lead.source}</p>
      <p className="mt-1 text-xs text-[var(--spm-text-muted)]">
        {owner?.name ?? "Unassigned"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge tone="neutral">{DISPOSITION_LABELS[lead.disposition]}</Badge>
        {flags.slice(0, 1).map((f) => (
          <Badge key={f.code} tone="danger">
            {f.label}
          </Badge>
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-[var(--spm-navy)]">
        {formatNextAction(lead.next_action_type)}
      </p>
    </Link>
  );
}
