import { redirect } from "next/navigation";
import { BrandBanner } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { demoLoginAction } from "@/lib/auth/actions";
import { DEMO_LOGIN_OPTIONS, getSessionUser } from "@/lib/auth/session";
import { brandTokens } from "@/lib/brand-tokens";
import { isDemoMode } from "@/lib/env";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session) {
    redirect("/dashboard");
  }

  const demo = isDemoMode();

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[rgba(79,157,255,0.22)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[rgba(232,189,54,0.16)] blur-3xl" />
      </div>

      <Panel className="relative w-full max-w-[28rem] animate-fade-up p-8 sm:p-9">
        <div className="flex flex-col items-start gap-6">
          <BrandBanner />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--spm-text-muted)]">
              Pipeline Control
            </p>
            <h1 className="mt-2 text-[2.15rem] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--spm-navy)]">
              {brandTokens.name.product}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--spm-text-muted)]">
              Sign in to work the book — capture, assignment, and next steps
              for Superpower Mentors.
            </p>
          </div>

          {demo ? (
            <div className="w-full space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--spm-text-muted)]">
                Sign in as
              </p>
              {DEMO_LOGIN_OPTIONS.map((opt) => (
                <form key={opt.id} action={demoLoginAction}>
                  <input type="hidden" name="userId" value={opt.id} />
                  <Button type="submit" className="h-12 w-full justify-between px-5">
                    <span>{opt.label}</span>
                    <span className="text-xs font-medium text-white/80">
                      Enter
                    </span>
                  </Button>
                </form>
              ))}
              <p className="pt-2 text-xs leading-5 text-[var(--spm-text-muted)]">
                Demo session cookie only. Records are synthetic. HubSpot is
                mock. Supabase Auth is not enabled.
              </p>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <p className="text-sm text-[var(--spm-text-muted)]">
                APP_MODE=auth is unavailable. Use APP_MODE=demo.
              </p>
            </div>
          )}
        </div>
        <div className="mt-8 flex items-center gap-3 border-t border-[rgba(7,22,74,0.08)] pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandTokens.assets.logoMark}
            alt=""
            width={20}
            height={20}
          />
          <p className="text-xs text-[var(--spm-text-muted)]">
            Built for {brandTokens.name.org}
          </p>
        </div>
      </Panel>
    </div>
  );
}
