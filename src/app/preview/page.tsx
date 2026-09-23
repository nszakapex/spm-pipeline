import Link from "next/link";
import { BrandBanner } from "@/components/brand/brand-mark";
import { ScoreMark } from "@/components/leads/score-mark";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DEMO_LOGIN_PASSWORD } from "@/lib/auth/demo-password";
import { brandTokens } from "@/lib/brand-tokens";
import { getPreviewShowcase } from "@/lib/preview/showcase";
import { WORKING_REASON_LABEL } from "@/lib/nurture/work-queue";
import { STAGE_LABELS, formatNextAction } from "@/types/domain";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Hiring manager preview",
  description:
    "Public walkthrough of SPM Pipeline — a HubSpot ops layer that keeps every lead visible between capture and close.",
  openGraph: {
    title: "SPM Pipeline — hiring manager preview",
    description:
      "Sales work queue, scoring, and HubSpot inbound ingest. Built by Nathaniel Szakallas for Superpower Mentors.",
    url: "https://spm-pipeline.vercel.app/preview",
    siteName: "SPM Pipeline",
    type: "website",
  },
};

export default function HiringPreviewPage() {
  const board = getPreviewShowcase();

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[rgba(79,157,255,0.22)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[rgba(232,189,54,0.16)] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <BrandBanner />
            <p className="spm-kicker">Hiring manager preview</p>
            <h1 className="spm-page-title max-w-3xl">
              Nothing vanishes between capture and close.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--spm-text-muted)]">
              {brandTokens.name.full} is the sales ops layer on top of HubSpot.
              HubSpot stays the CRM. This app keeps source, owner, next action,
              and a single work list in view. Built by Nathaniel Szakallas.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Link
              href="/login?profile=user_001"
              className={cn(buttonVariants(), "h-12 px-6")}
            >
              Open the live demo
            </Link>
            <a
              href="https://github.com/nszakapex/spm-pipeline"
              className="text-xs font-bold text-[var(--spm-blue-secondary)] hover:underline"
            >
              Source on GitHub
            </a>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Fact
            label="What you are looking at"
            value="Fictional sample book"
            detail="No real mentee or parent records. Persist overlay is not loaded here."
          />
          <Fact
            label="Live product"
            value={`${board.openCount} open leads`}
            detail={`${board.hotCount} hot · pipeline health ${board.pipelineHealth}% · ${board.leadCount} in the demo set`}
          />
          <Fact
            label="Try the signed-in board"
            value="Max Sussman"
            detail={`Password ${DEMO_LOGIN_PASSWORD} · then Home, Leads, Nurture, Pipeline`}
          />
        </section>

        <section className="spm-panel overflow-hidden">
          <div className="border-b border-[rgba(7,22,74,0.08)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
              Work next
              <span className="font-medium text-[var(--spm-text-muted)]">
                {" "}
                ({board.workNext.length})
              </span>
            </h2>
            <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
              Same queue the sales board uses. Reply first, then late work, then
              scheduled work. Each person appears once.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="spm-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Why</th>
                  <th>Next step</th>
                  <th>Also</th>
                </tr>
              </thead>
              <tbody>
                {board.workNext.map(({ lead, why, primary, secondary }) => (
                  <tr key={lead.id}>
                    <td>
                      <p className="font-medium text-[var(--spm-navy)]">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="mt-1.5">
                        <ScoreMark band={lead.score_band} compact />
                      </p>
                    </td>
                    <td className="max-w-xs text-[var(--spm-text-muted)]">
                      <p className="font-medium text-[var(--spm-navy)]">
                        {WORKING_REASON_LABEL[primary]}
                      </p>
                      <p>{why}</p>
                    </td>
                    <td className="whitespace-nowrap font-medium text-[var(--spm-navy)]">
                      {formatNextAction(lead.next_action_type)}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {secondary.slice(0, 2).map((reason) => (
                          <Badge key={reason} tone="warning">
                            {WORKING_REASON_LABEL[reason]}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {board.stages.length > 0 ? (
          <section className="spm-panel p-4">
            <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
              Open stages
            </h2>
            <p className="mt-0.5 text-sm text-[var(--spm-text-muted)]">
              Disposition (nurture, no-show) sits on the card, not as its own
              column.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {board.stages.map((row) => (
                <li key={row.stage}>
                  <Badge tone="neutral">
                    {STAGE_LABELS[row.stage]} {row.count}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-3 md:grid-cols-3">
          <Decision
            title="HubSpot stays the CRM"
            body="Inbound webhooks attach a contact to one row (HubSpot id, then email, then phone). This app does not write back to HubSpot and does not import the full inbox."
          />
          <Decision
            title="Persist first"
            body="Manual logs and ingest land in memory, then a signed cookie, then Supabase overlay. A down store must not blank Home."
          />
          <Decision
            title="Explainable priority"
            body="Hot / High / Cool only. The score math is still there; the board shows heat and the next step, not a P-band dump."
          />
        </section>

        <section className="spm-panel space-y-3 p-5">
          <h2 className="text-sm font-semibold text-[var(--spm-navy)]">
            What is real today
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-[var(--spm-text-muted)]">
            <li>Signed-in sales board: Home, Leads, Nurture, Pipeline.</li>
            <li>
              Demo login (Max, Mack, Nate) with a shared password. Viewer cannot
              log activity.
            </li>
            <li>
              HubSpot v3 webhook path at{" "}
              <code className="text-[var(--spm-navy)]">/api/webhooks/hubspot</code>.
              Client secret is optional and only verifies inbound signatures.
            </li>
            <li>
              Calls and texts done outside HubSpot: open the lead → Log what you
              just did.
            </li>
          </ul>
          <p className="text-sm text-[var(--spm-text-muted)]">
            Not in this prototype: live HubSpot outbound writes, a dialer, Twilio,
            or Supabase Auth.
          </p>
        </section>

        <footer className="flex flex-col gap-3 border-t border-[rgba(7,22,74,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--spm-text-muted)]">
            Nathaniel Szakallas · independent project for {brandTokens.name.org}
          </p>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-[var(--spm-blue-secondary)]">
            <Link href="/login" className="hover:underline">
              Team sign in
            </Link>
            <a
              href="https://github.com/nszakapex/nszakapex"
              className="hover:underline"
            >
              Portfolio
            </a>
            <a
              href="https://github.com/nszakapex/spm-pipeline"
              className="hover:underline"
            >
              Repository
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="spm-panel p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--spm-navy)]/45">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--spm-text-muted)]">{detail}</p>
    </div>
  );
}

function Decision({ title, body }: { title: string; body: string }) {
  return (
    <div className="spm-panel p-4">
      <h3 className="text-sm font-semibold text-[var(--spm-navy)]">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[var(--spm-text-muted)]">{body}</p>
    </div>
  );
}
