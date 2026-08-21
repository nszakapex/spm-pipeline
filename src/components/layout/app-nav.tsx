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
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[#b7c2d3] bg-[linear-gradient(180deg,#e4ebf4_0%,#cfd8e6_100%)] px-3 py-4 md:flex">
      <BrandMark className="px-2" />
      <nav className="mt-7 flex flex-1 flex-col gap-0.5">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[7px] px-3 py-2 text-[13px] font-semibold",
                active
                  ? "bg-[linear-gradient(180deg,#7eb6ff_0%,var(--spm-blue-primary)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] [text-shadow:0_1px_0_rgba(7,22,74,0.28)]"
                  : "text-[var(--spm-navy)]/80 hover:bg-white/35",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 rounded-[1.1rem] border border-[rgba(7,22,74,0.08)] bg-white/55 p-3 shadow-[inset_0_1px_0_#fff]">
        <p className="text-sm font-semibold text-[var(--spm-navy)]">{userName}</p>
        <p className="truncate text-xs text-[var(--spm-text-muted)]">{userEmail}</p>
        <form action="/api/logout" method="post" className="mt-2">
          <button
            type="submit"
            className="text-xs font-bold text-[var(--spm-blue-secondary)] hover:underline"
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
    <nav className="spm-dock md:hidden" aria-label="Primary">
      <ul className="grid grid-cols-5 gap-1 px-1 pt-1.5">
        {MOBILE_PRIMARY.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold",
                  active
                    ? "bg-white/15 text-[var(--spm-sky)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                    : "text-white",
                )}
              >
                <Icon className="size-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]" />
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
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0b1020]/90 px-4 py-3 backdrop-blur-xl md:hidden">
      <BrandMark tone="light" />
      {title ? (
        <span className="text-sm font-semibold text-white">{title}</span>
      ) : null}
      <div className="flex items-center gap-1">
        <Link
          href="/settings"
          className="grid size-10 place-items-center rounded-full text-white/70"
          aria-label="Settings"
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </div>
  );
}
