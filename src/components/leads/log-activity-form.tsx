import { logLeadActivityAction } from "@/lib/auth/log-activity-action";
import { Button } from "@/components/ui/button";

export function LogActivityForm({
  leadId,
  canWrite,
}: {
  leadId: string;
  canWrite: boolean;
}) {
  return (
    <section className="spm-panel p-5">
      <h2 className="text-[1.05rem] font-semibold text-[var(--spm-navy)]">
        Log what you just did
      </h2>
      <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
        Phone, iMessage, and personal email do not auto-update. Save them here
        and the pipeline moves.
      </p>
      {canWrite ? (
        <form action={logLeadActivityAction} className="mt-4 space-y-3">
          <input type="hidden" name="leadId" value={leadId} />
          <label className="block text-sm font-medium text-[var(--spm-navy)]">
            Activity
            <select
              name="kind"
              className="mt-1 h-10 w-full rounded-md border border-[rgba(7,22,74,0.12)] bg-white px-3 text-sm"
              defaultValue="call"
            >
              <option value="call">Call I just made</option>
              <option value="inbound_reply">They emailed or texted me</option>
              <option value="outbound_email">I emailed them</option>
              <option value="outbound_sms">I texted them</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-[var(--spm-navy)]">
            Call outcome
            <select
              name="outcome"
              className="mt-1 h-10 w-full rounded-md border border-[rgba(7,22,74,0.12)] bg-white px-3 text-sm"
              defaultValue="connected"
            >
              <option value="connected">Connected</option>
              <option value="voicemail">Voicemail</option>
              <option value="no_answer">No answer</option>
              <option value="busy">Busy</option>
              <option value="wrong_number">Wrong number</option>
              <option value="held">Strategy call held</option>
              <option value="no_show">No-show</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-[var(--spm-navy)]">
            Note
            <textarea
              name="recap"
              rows={3}
              placeholder="What happened / what they said"
              className="mt-1 w-full rounded-md border border-[rgba(7,22,74,0.12)] bg-white px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" size="sm">
            Save to pipeline
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-[var(--spm-text-muted)]">View only.</p>
      )}
    </section>
  );
}
