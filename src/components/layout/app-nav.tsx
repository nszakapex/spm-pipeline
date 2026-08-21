"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Cable,
  ClipboardList,
  LayoutDashboard,
  Radio,
  Settings,
  Users,
  Sprout,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sources", label: "Sources", icon: Radio },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: ClipboardList },
  { href: "/nurture", label: "Nurture", icon: Sprout },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/integrations", label: "Integrations", icon: Cable },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_PRIMARY = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/nurture", label: "Nurture", icon: Sprout },
  { href: "/pipeline", label: "Pipeline", icon: ClipboardList },
  { href: "/sources", label: "Sources", icon: Radio },
];

export function AppSidebar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[rgba(7,22,74,0.12)] bg-white px-3 py-4 md:flex">
      <BrandMark className="px-2" />
      <nav className="mt-6 flex flex-1 flex-col gap-0.5">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium",
                active
                  ? "bg-[#edf3ff] text-[var(--spm-blue-secondary)]"
                  : "text-[var(--spm-navy)]/75 hover:bg-[rgba(7,22,74,0.04)] hover:text-[var(--spm-navy)]",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 border-t border-[rgba(7,22,74,0.12)] px-2 pt-3">
        <p className="text-sm font-medium text-[var(--spm-navy)]">{userName}</p>
        <p className="truncate text-xs text-[var(--spm-text-muted)]">{userEmail}</p>
        <form action="/api/logout" method="post" className="mt-2">
          <button
            type="submit"
            className="text-xs font-medium text-[var(--spm-blue-secondary)] hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(7,22,74,0.12)] bg-white px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 md:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {MOBILE_PRIMARY.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium",
                  active
                    ? "text-[var(--spm-blue-primary)]"
                    : "text-[var(--spm-text-muted)]",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileTopBar({ title }: { title?: string }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[rgba(7,22,74,0.12)] bg-white px-4 py-2.5 md:hidden">
      <BrandMark />
      {title ? (
        <span className="text-sm font-semibold text-[var(--spm-navy)]">{title}</span>
      ) : null}
      <div className="flex items-center gap-1">
        <Link
          href="/settings"
          className="grid size-9 place-items-center rounded-md text-[var(--spm-navy)]/70"
          aria-label="Settings"
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </div>
  );
}
