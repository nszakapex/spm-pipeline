"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function FilterChipRow({
  items,
  className = "flex gap-2 overflow-x-auto pb-1",
}: {
  items: { href: string; label: string; active: boolean }[];
  className?: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname, search]);

  return (
    <div className={className}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch
          onClick={() => setPendingHref(item.href)}
          className={`spm-chip ${(pendingHref ? pendingHref === item.href : item.active) ? "spm-chip-active" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
