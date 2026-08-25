import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandBanner } from "@/components/brand/brand-mark";
import { ProfileCard } from "@/components/auth/profile-card";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { demoLoginAction } from "@/lib/auth/actions";
import { DEMO_LOGIN_OPTIONS, findDemoLoginOption, getSessionUser } from "@/lib/auth/session";
import { brandTokens } from "@/lib/brand-tokens";
import { isDemoMode } from "@/lib/env";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; notice?: string }>;
}) {
  const session = await getSessionUser();
  if (session) {
    redirect("/dashboard");
  }

  const demo = isDemoMode();
  const params = await searchParams;
  const selected = params.profile ? findDemoLoginOption(params.profile) : undefined;
  const badPassword = params.notice === "bad-password";

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
              {selected
                ? `Sign in as ${selected.name} to work the book.`
                : "Choose your profile, then sign in to work the book."}
            </p>
          </div>

          {demo ? (
            selected ? (
              <div className="w-full space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--spm-text-muted)]">
                  Profile
                </p>
                <ProfileCard
                  name={selected.name}
                  email={selected.email}
                  role={selected.role}
                />
                <form action={demoLoginAction} className="space-y-3">
                  <input type="hidden" name="userId" value={selected.id} />
                  <label className="block text-sm font-medium text-[var(--spm-navy)]">
                    Password
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      autoFocus
                      required
                      className="mt-1 h-11 w-full rounded-md border border-[rgba(7,22,74,0.12)] bg-white px-3 text-sm text-[var(--spm-navy)]"
                    />
                  </label>
                  {badPassword ? (
                    <p className="text-sm font-medium text-[var(--spm-navy)]" role="alert">
                      That password does not match. Try again.
                    </p>
                  ) : null}
                  <Button type="submit" className="h-12 w-full px-5">
                    Sign in
                  </Button>
                </form>
                <Link
                  href="/login"
                  className="inline-block text-xs font-bold text-[var(--spm-blue-secondary)] hover:underline"
                >
                  Choose a different profile
                </Link>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--spm-text-muted)]">
                  Choose your profile
                </p>
                {DEMO_LOGIN_OPTIONS.map((opt) => (
                  <Link
                    key={opt.id}
                    href={`/login?profile=${opt.id}`}
                    className="block"
                  >
                    <ProfileCard
                      name={opt.name}
                      email={opt.email}
                      role={opt.role}
                      interactive
                    />
                  </Link>
                ))}
                <p className="pt-2 text-xs leading-5 text-[var(--spm-text-muted)]">
                  Demo session cookie only. Records are synthetic. HubSpot is
                  mock. Supabase Auth is not enabled.
                </p>
              </div>
            )
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
