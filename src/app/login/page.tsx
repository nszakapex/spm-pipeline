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
    <div className="flex min-h-screen items-center justify-center bg-[var(--spm-app-bg)] px-4 py-10">
      <Panel className="w-full max-w-md p-6 sm:p-7">
        <div className="flex flex-col items-start gap-5">
          <BrandBanner />
          <div>
            <h1 className="text-2xl font-semibold text-[var(--spm-navy)]">
              {brandTokens.name.product}
            </h1>
            <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
              Sign in to work the pipeline — capture, assignment, and next
              steps for Superpower Mentors.
            </p>
          </div>

          {demo ? (
            <div className="w-full space-y-2">
              <p className="text-sm text-[var(--spm-text-muted)]">Sign in as</p>
              {DEMO_LOGIN_OPTIONS.map((opt) => (
                <form key={opt.id} action={demoLoginAction}>
                  <input type="hidden" name="userId" value={opt.id} />
                  <Button type="submit" className="w-full justify-between px-4">
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
        <div className="mt-6 flex items-center gap-3 border-t border-[rgba(7,22,74,0.08)] pt-4">
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
