"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Cable,
  ClipboardList,
  Ellipsis,
  LayoutDashboard,
  Radio,
  Settings,
  Users,
  Sprout,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { desktopNavForRole, mobilePrimaryNavForRole, type NavHref } from "@/lib/nav/items";
import type { UserRole } from "@/types/domain";
import { cn } from "@/lib/utils";

const ICONS: Record<NavHref, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/leads": Users,
  "/nurture": Sprout,
  "/pipeline": ClipboardList,
  "/sources": Radio,
  "/analytics": BarChart3,
  "/integrations": Cable,
  "/settings": Settings,
  "/more": Ellipsis,
};

function NavLink({
  href,
  label,
  active,
}: {
  href: NavHref;
  label: string;
  active: boolean;
}) {
  const Icon = ICONS[href];
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[7px] px-3 py-2 text-[13px] font-semibold",
        active
          ? "bg-[#e8f1ff] text-[var(--spm-blue-primary)]"
          : "text-[var(--spm-navy)]/80 hover:bg-[rgba(7,22,74,0.04)]",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

function pathIsActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  userName,
  userEmail,
  role,
}: {
  userName: string;
  userEmail: string;
  role: UserRole;
}) {
  const pathname = usePathname();
  const { sales, admin } = desktopNavForRole(role);

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[rgba(7,22,74,0.08)] bg-[#f7f9fc] px-3 py-5 md:flex">
      <BrandMark className="px-2" />
      <nav className="mt-7 flex flex-1 flex-col gap-0.5">
        {sales.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={pathIsActive(pathname, item.href)}
          />
        ))}
        {admin.length > 0 ? (
          <>
            <p className="mt-4 px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--spm-navy)]/45">
              Admin
            </p>
            {admin.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={pathIsActive(pathname, item.href)}
              />
            ))}
          </>
        ) : null}
      </nav>
      <div className="mt-4 rounded-lg border border-[rgba(7,22,74,0.1)] bg-white p-3">
        <p className="text-sm font-semibold text-[var(--spm-navy)]">{userName}</p>
        <p className="truncate text-xs text-[var(--spm-text-muted)]">{userEmail}</p>
        <p className="mt-1 text-[11px] text-[var(--spm-text-muted)]">Demo · HubSpot mock</p>
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

export function MobileBottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = mobilePrimaryNavForRole(role);
  return (
    <nav className="spm-dock md:hidden" aria-label="Primary">
      <ul
        className={cn(
          "grid gap-1 px-1 pt-1.5",
          items.length === 5 ? "grid-cols-5" : "grid-cols-4",
        )}
      >
        {items.map((item) => {
          const active = pathIsActive(pathname, item.href);
          const Icon = ICONS[item.href];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold",
                  active
                    ? "bg-[#eef5ff] text-[var(--spm-blue-primary)]"
                    : "text-[var(--spm-navy)]",
                )}
              >
                <Icon className="size-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileTopBar({ role, title }: { role: UserRole; title?: string }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[rgba(7,22,74,0.08)] bg-white px-4 py-3 md:hidden">
      <BrandMark />
      {title ? (
        <span className="text-sm font-semibold text-[var(--spm-navy)]">{title}</span>
      ) : null}
      <div className="flex items-center gap-1">
        <Link
          href={role === "admin" ? "/more" : "/settings"}
          className="grid size-10 place-items-center rounded-full text-[var(--spm-navy)]/70"
          aria-label={role === "admin" ? "More" : "Settings"}
        >
          {role === "admin" ? <Ellipsis className="size-5" /> : <Settings className="size-5" />}
        </Link>
      </div>
    </div>
  );
}
