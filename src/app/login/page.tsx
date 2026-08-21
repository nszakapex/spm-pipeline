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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">

      <Panel className="w-full max-w-md p-7 sm:p-8">
        <div className="flex flex-col items-start gap-5">
          <BrandBanner />
          <div>
            <h1 className="text-[1.85rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--spm-navy)]">
              {brandTokens.name.product}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--spm-text-muted)]">
              Sign in to Pipeline Control — lead integrity, prioritization, and
              nurture for Superpower Mentors.
            </p>
          </div>

          {demo ? (
            <div className="w-full space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--spm-text-muted)]">
                Continue as
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
                Demo authentication uses an isolated server-side session cookie.
                Records are synthetic sample data. HubSpot runs in mock mode.
                Supabase Auth is not enabled in this prototype.
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
