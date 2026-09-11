"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface FilterChipItem {
  href: string;
  label: string;
  active: boolean;
}

function ChipRow({
  items,
  className,
  pendingHref,
  onNavigate,
}: {
  items: FilterChipItem[];
  className: string;
  pendingHref: string | null;
  onNavigate?: (href: string) => void;
}) {
  return (
    <div className={className}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch
          onClick={() => onNavigate?.(item.href)}
          className={`spm-chip ${(pendingHref ? pendingHref === item.href : item.active) ? "spm-chip-active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function FilterChipRowInner({
  items,
  className,
}: {
  items: FilterChipItem[];
  className: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname, search]);

  return (
    <ChipRow
      items={items}
      className={className}
      pendingHref={pendingHref}
      onNavigate={setPendingHref}
    />
  );
}

export function FilterChipRow({
  items,
  className = "flex gap-2 overflow-x-auto pb-1",
}: {
  items: FilterChipItem[];
  className?: string;
}) {
  return (
    <Suspense fallback={<ChipRow items={items} className={className} pendingHref={null} />}>
      <FilterChipRowInner items={items} className={className} />
    </Suspense>
  );
}
