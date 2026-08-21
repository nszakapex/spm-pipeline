import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
      title: "Needs reply",
      leads: filterLeadsByFlag("needs_reply"),
    },
    {
      key: "due_today",
      title: "Due today",
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
      ].filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i),
    },
    {
      key: "no_show",
      title: "No-show recovery",
      leads: filterLeadsByFlag("no_show_recovery"),
    },
    {
      key: "long_term",
      title: "Long-term nurture",
      leads: getStore()
        .getLeads()
        .filter((l) => l.disposition === "NURTURE"),
    },
    {
      key: "no_response",
      title: "No response",
      leads: getStore()
        .getLeads()
        .filter((l) => l.disposition === "NO_RESPONSE"),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--spm-navy)]">
          Nurture queue
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--spm-text-muted)]">
          Leads you should work, grouped by reason, with last touch and next
          step on each row.
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.key} className="spm-panel overflow-hidden">
          <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
              {section.title}{" "}
              <span className="font-medium text-[var(--spm-text-muted)]">
                ({section.leads.length})
              </span>
            </h2>
          </div>
          {section.leads.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--spm-text-muted)]">
              Empty.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="spm-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Why</th>
                    <th>Last touch</th>
                    <th>Due</th>
                    <th>Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {section.leads.map((lead) => {
                    const item = row(lead);
                    return (
                      <tr key={lead.id}>
                        <td>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-medium text-[var(--spm-navy)] hover:underline"
                          >
                            {lead.first_name} {lead.last_name}
                          </Link>
                          <p className="mt-0.5">
                            <Badge
                              tone={lead.score_band === "P1" ? "hot" : "neutral"}
                            >
                              {SCORE_BAND_LABELS[lead.score_band]}
                            </Badge>
                          </p>
                        </td>
                        <td className="max-w-sm text-[var(--spm-text-muted)]">
                          {item.why}
                        </td>
                        <td className="whitespace-nowrap text-[var(--spm-text-muted)]">
                          {formatOpsDate(item.lastTouch)}
                        </td>
                        <td className="whitespace-nowrap text-[var(--spm-text-muted)]">
                          {item.due ? formatOpsDate(item.due) : "—"}
                        </td>
                        <td className="whitespace-nowrap font-medium text-[var(--spm-navy)]">
                          {formatNextAction(item.action)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
