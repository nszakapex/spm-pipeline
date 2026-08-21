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
    nurture: "border-[rgba(184,144,31,0.3)] bg-[#fff8e8] text-[var(--spm-warning)]",
    low: "border-[rgba(75,88,117,0.2)] bg-[#f4f6fa] text-[var(--spm-text-muted)]",
    success: "border-[rgba(12,127,121,0.25)] bg-[#e8f7f6] text-[var(--spm-success)]",
    warning: "border-[rgba(184,144,31,0.3)] bg-[#fff8e8] text-[var(--spm-warning)]",
    danger: "border-[rgba(194,59,74,0.25)] bg-[#fff1f3] text-[var(--spm-danger)]",
    info: "border-[rgba(47,111,196,0.2)] bg-[#edf3ff] text-[var(--spm-blue-secondary)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium capitalize",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
