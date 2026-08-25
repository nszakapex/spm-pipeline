import Link from "next/link";
import { brandTokens } from "@/lib/brand-tokens";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  showWordmark = true,
  tone = "dark",
}: {
  className?: string;
  showWordmark?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-3", className)}>
      {/* Public SPM mark SVG — not redrawn */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brandTokens.assets.logoMark}
        alt=""
        width={28}
        height={28}
        className="shrink-0"
      />
      {showWordmark ? (
        <span className="min-w-0">
          <span
            className={cn(
              "block text-sm font-semibold tracking-[-0.03em]",
              tone === "light" ? "text-white" : "text-[var(--spm-navy)]",
            )}
          >
            {brandTokens.name.product}
          </span>
          <span
            className={cn(
              "block truncate text-[11px] font-medium",
              tone === "light" ? "text-white/65" : "text-[var(--spm-text-muted)]",
            )}
          >
            Pipeline Control
          </span>
        </span>
      ) : null}
    </Link>
  );
}

export function BrandBanner({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandTokens.assets.logoBanner}
      alt={brandTokens.name.org}
      width={180}
      height={32}
      className={cn("h-8 w-auto", className)}
    />
  );
}
