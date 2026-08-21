import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "hot" | "high" | "nurture" | "low" | "success" | "warning" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    neutral: "border-[var(--spm-navy)] bg-white text-[var(--spm-navy)]",
    hot: "border-[var(--spm-navy)] bg-[color-mix(in_oklab,var(--spm-sky)_28%,white)] text-[var(--spm-blue-primary)]",
    high: "border-[var(--spm-navy)] bg-[color-mix(in_oklab,var(--spm-blue-secondary)_16%,white)] text-[var(--spm-deep-blue)]",
    nurture: "border-[var(--spm-navy)] bg-[var(--spm-cream)] text-[var(--spm-navy)]",
    low: "border-[var(--spm-sand)] bg-[var(--spm-sand)] text-[var(--spm-text-muted)]",
    success:
      "border-[var(--spm-navy)] bg-[color-mix(in_oklab,var(--spm-sky)_22%,white)] text-[var(--spm-blue-primary)]",
    warning: "border-[var(--spm-navy)] bg-[var(--spm-cream)] text-[var(--spm-navy)]",
    danger: "border-[var(--spm-navy)] bg-[var(--spm-gold)] text-[var(--spm-navy)]",
    info: "border-[var(--spm-navy)] bg-[color-mix(in_oklab,var(--spm-sky)_18%,white)] text-[var(--spm-blue-secondary)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none border-2 px-1.5 py-0.5 text-[11px] font-medium capitalize",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
