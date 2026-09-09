import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Panel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("spm-panel", className)} {...props} />;
}

export function PanelHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)}
      {...props}
    />
  );
}

export function PanelTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--spm-navy)]",
        className,
      )}
      {...props}
    />
  );
}

export function PanelDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm text-[var(--spm-text-muted)]", className)} {...props} />
  );
}
