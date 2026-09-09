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
    neutral: "border-[rgba(7,22,74,0.12)] bg-white text-[var(--spm-navy)]/78",
    hot: "border-[rgba(28,72,230,0.25)] bg-[#eef5ff] text-[var(--spm-blue-primary)]",
    high: "border-[rgba(47,111,196,0.25)] bg-[#f0f6ff] text-[var(--spm-blue-secondary)]",
    nurture: "border-[rgba(232,189,54,0.35)] bg-[var(--spm-cream)] text-[var(--spm-navy)]",
    low: "border-[rgba(75,88,117,0.2)] bg-[#f4f6fa] text-[var(--spm-text-muted)]",
    success: "border-[rgba(79,157,255,0.35)] bg-[#eef5ff] text-[var(--spm-blue-primary)]",
    warning: "border-[rgba(232,189,54,0.4)] bg-[var(--spm-cream)] text-[var(--spm-navy)]",
    danger: "border-[rgba(232,189,54,0.55)] bg-[var(--spm-gold)] text-[var(--spm-navy)]",
    info: "border-[rgba(47,111,196,0.2)] bg-[#edf3ff] text-[var(--spm-blue-secondary)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-[-0.01em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
