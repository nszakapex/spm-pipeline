import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Panel,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { filterLeadsByFlag, getLeadFlags } from "@/lib/analytics/queries";
import { getStore } from "@/lib/db/store";
import { SCORE_BAND_LABELS, formatNextAction, type Lead } from "@/types/domain";
import { formatOpsDate } from "@/lib/utils";

export const metadata = { title: "Nurture" };

function row(lead: Lead) {
  const flags = getLeadFlags(lead);
  return {
    lead,
    why:
      lead.next_action_note ||
      lead.nurture_reason ||
      flags[0]?.reason ||
      "Needs follow-up",
    lastTouch: lead.last_contact_at ?? lead.last_activity_at ?? lead.created_at,
    due: lead.next_action_at ?? lead.nurture_until,
    action: lead.next_action_type ?? "FOLLOW_UP",
  };
}

export default function NurturePage() {
  const sections = [
    {
      key: "needs_reply",
      title: "Needs Reply",
      leads: filterLeadsByFlag("needs_reply"),
    },
    {
      key: "due_today",
      title: "Due Today",
      leads: getStore()
        .getLeads()
        .filter((l) => {
          if (!l.next_action_at && !l.nurture_until) return false;
          const d = new Date(l.next_action_at ?? l.nurture_until!);
          const now = new Date();
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
          );
        }),
    },
    {
      key: "overdue",
      title: "Overdue",
      leads: [
        ...filterLeadsByFlag("follow_up_overdue"),
        ...filterLeadsByFlag("first_contact_overdue"),
      ].filter(
        (l, i, arr) => arr.findIndex((x) => x.id === l.id) === i,
      ),
    },
    {
      key: "no_show",
      title: "No-show Recovery",
      leads: filterLeadsByFlag("no_show_recovery"),
    },
    {
      key: "long_term",
      title: "Long-Term Nurture",
      leads: getStore()
        .getLeads()
        .filter((l) => l.disposition === "NURTURE"),
    },
    {
      key: "no_response",
      title: "No Response",
      leads: getStore()
        .getLeads()
        .filter((l) => l.disposition === "NO_RESPONSE"),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <header>
        <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
          Nurture
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--spm-text-muted)]">
          Daily working queue — why each lead is here, last touch, and the
          next step.
        </p>
      </header>

      {sections.map((section) => (
        <Panel key={section.key}>
          <PanelHeader>
            <div>
              <PanelTitle>
                {section.title}{" "}
                <span className="text-[var(--spm-text-muted)]">
                  ({section.leads.length})
                </span>
              </PanelTitle>
              <PanelDescription>
                Operational queue for {section.title.toLowerCase()}.
              </PanelDescription>
            </div>
          </PanelHeader>
          {section.leads.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-[var(--spm-text-muted)]">
              Nothing in this queue right now.
            </p>
          ) : (
            <ul className="divide-y divide-[rgba(7,22,74,0.06)] px-2 pb-2">
              {section.leads.map((lead) => {
                const item = row(lead);
                return (
                  <li key={lead.id}>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="flex flex-col gap-2 rounded-[1rem] px-3 py-3.5 hover:bg-[#f7f9ff] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[var(--spm-navy)]">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <Badge
                            tone={lead.score_band === "P1" ? "hot" : "neutral"}
                          >
                            {SCORE_BAND_LABELS[lead.score_band]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
                          {item.why}
                        </p>
                        <p className="mt-1 text-xs text-[var(--spm-text-muted)]">
                          Last touch {formatOpsDate(item.lastTouch)}
                          {item.due ? ` · Due ${formatOpsDate(item.due)}` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-[var(--spm-navy)]">
                        {formatNextAction(item.action)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      ))}
    </div>
  );
}
