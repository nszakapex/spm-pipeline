"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuthErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="spm-panel w-full max-w-[28rem] p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--spm-text-muted)]">
          Pipeline Control
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--spm-navy)]">
          Can&apos;t open the pipeline
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--spm-text-muted)]">
          Sign out and sign in again. The session on this device may be stale.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a href="/api/logout" className={cn(buttonVariants(), "h-12 w-full px-5")}>
            Sign out
          </a>
          <Button type="button" variant="secondary" className="h-12 w-full px-5" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
