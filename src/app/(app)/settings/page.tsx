import Link from "next/link";
import {
  Panel,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { isAdminRole } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { DEFAULT_SLA, STAGE_LABELS } from "@/types/domain";
import { SCORE_VERSION } from "@/lib/scoring/score-lead";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSessionUser();
  const admin = isAdminRole(session?.role);
  const env = getEnv();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="spm-page-title">Settings</h1>
        <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
          {admin
            ? "Prototype configuration and operational defaults."
            : "Your demo session on this device."}
        </p>
      </header>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Session</PanelTitle>
            <PanelDescription>
              {session
                ? `Signed in as ${session.name}.`
                : "End the demo session on this device."}
            </PanelDescription>
          </div>
        </PanelHeader>
        <div className="px-5 pb-5">
          <form action="/api/logout" method="post">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[rgba(7,22,74,0.12)] bg-white px-5 text-sm font-semibold text-[var(--spm-navy)] shadow-[inset_0_1px_0_#fff] hover:bg-[#f7f9ff]"
            >
              Sign out
            </button>
          </form>
        </div>
      </Panel>

      {admin ? (
        <>
          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Prototype information</PanelTitle>
                <PanelDescription>
                  Prototype environment — customer records shown here are sample
                  data.
                </PanelDescription>
              </div>
            </PanelHeader>
            <dl className="grid gap-3 px-5 pb-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--spm-text-muted)]">App mode</dt>
                <dd className="font-medium">{env.APP_MODE}</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">HubSpot mode</dt>
                <dd className="font-medium">{env.HUBSPOT_MODE} (mock only)</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Auth</dt>
                <dd className="font-medium">
                  Demo session cookie only. Supabase Auth mode is unavailable in
                  this prototype.
                </dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Scoring version</dt>
                <dd className="font-medium">{SCORE_VERSION}</dd>
              </div>
            </dl>
          </Panel>

          <Panel id="pipeline-health">
            <PanelHeader>
              <div>
                <PanelTitle>Pipeline health formula</PanelTitle>
                <PanelDescription>
                  Transparent weighted violation score across active leads and source
                  reconciliation.
                </PanelDescription>
              </div>
            </PanelHeader>
            <ul className="list-disc space-y-1 px-8 pb-5 text-sm text-[var(--spm-text-muted)]">
              <li>Missing source attribution — weight 20</li>
              <li>No owner — weight 20</li>
              <li>No next action — weight 20</li>
              <li>First-contact SLA breach — weight 15</li>
              <li>Stale stage — weight 10</li>
              <li>Integration failure — weight 10</li>
              <li>Unmatched/failed source events (14-day window) — weight 5</li>
            </ul>
            <p className="px-5 pb-5 text-sm text-[var(--spm-text-muted)]">
              Health % = 100 − Σ(violation rate × weight).
            </p>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Scoring rules summary</PanelTitle>
              </div>
            </PanelHeader>
            <ul className="space-y-1 px-5 pb-5 text-sm text-[var(--spm-text-muted)]">
              <li>Intent — up to 40</li>
              <li>Engagement — up to 30</li>
              <li>Readiness — up to 20</li>
              <li>Source quality — up to 10</li>
              <li>Negative adjustments for no-response, no-interest, invalid contact, etc.</li>
              <li>Bands: 80–100 P1 Hot · 60–79 P2 High · 40–59 P3 Nurture · 0–39 P4 Low</li>
            </ul>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>SLA settings (demo)</PanelTitle>
              </div>
            </PanelHeader>
            <dl className="grid gap-3 px-5 pb-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--spm-text-muted)]">First contact SLA</dt>
                <dd className="font-medium">{DEFAULT_SLA.firstContactHours} hours</dd>
              </div>
              <div>
                <dt className="text-[var(--spm-text-muted)]">Reconciliation threshold</dt>
                <dd className="font-medium">
                  {DEFAULT_SLA.reconciliationHours} hours
                </dd>
              </div>
            </dl>
            <div className="px-5 pb-5 text-sm text-[var(--spm-text-muted)]">
              Stale stage thresholds (days):{" "}
              {Object.entries(DEFAULT_SLA.staleStageDays)
                .filter(([k]) => !["WON", "LOST"].includes(k))
                .map(([k, v]) => `${STAGE_LABELS[k as keyof typeof STAGE_LABELS]} ${v}d`)
                .join(" · ")}
            </div>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <PanelTitle>Pipeline stages</PanelTitle>
              </div>
            </PanelHeader>
            <p className="px-5 pb-5 text-sm text-[var(--spm-text-muted)]">
              NEW → ATTEMPTING_CONTACT → CONNECTED → QUALIFIED → JAKE_READY →
              CALL_BOOKED → CALL_HELD → ENROLLMENT_PENDING → WON / LOST
            </p>
            <p className="px-5 pb-5 text-sm text-[var(--spm-text-muted)]">
              Dispositions (separate): ACTIVE · NURTURE · NO_RESPONSE ·
              NOT_QUALIFIED · NO_SHOW · INVALID_CONTACT
            </p>
          </Panel>
        </>
      ) : (
        <p className="text-sm text-[var(--spm-text-muted)]">
          Sources, analytics, and integrations stay with Nate.{" "}
          <Link href="/dashboard" className="font-medium text-[var(--spm-blue-secondary)] hover:underline">
            Back to Home
          </Link>
        </p>
      )}
    </div>
  );
}
