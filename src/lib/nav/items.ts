import type { UserRole } from "@/types/domain";
import { isAdminRole } from "@/lib/auth/roles";

export type NavHref =
  | "/dashboard"
  | "/leads"
  | "/nurture"
  | "/pipeline"
  | "/sources"
  | "/analytics"
  | "/integrations"
  | "/settings"
  | "/more";

export interface NavDestination {
  href: NavHref;
  label: string;
}

export const SALES_NAV: NavDestination[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/leads", label: "Leads" },
  { href: "/nurture", label: "Nurture" },
  { href: "/pipeline", label: "Pipeline" },
];

export const ADMIN_NAV: NavDestination[] = [
  { href: "/sources", label: "Sources" },
  { href: "/analytics", label: "Analytics" },
  { href: "/integrations", label: "Integrations" },
  { href: "/settings", label: "Settings" },
];

/** Pages sales should not open. Settings stays available for sign-out. */
export const ADMIN_ONLY_PATHS = ["/sources", "/analytics", "/integrations"] as const;

export function canAccessPath(role: UserRole, pathname: string): boolean {
  return !ADMIN_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  ) || isAdminRole(role);
}

export function desktopNavForRole(role: UserRole): {
  sales: NavDestination[];
  admin: NavDestination[];
} {
  return {
    sales: SALES_NAV,
    admin: isAdminRole(role) ? ADMIN_NAV : [],
  };
}

export function mobilePrimaryNavForRole(role: UserRole): NavDestination[] {
  if (!isAdminRole(role)) return SALES_NAV;
  return [...SALES_NAV, { href: "/more", label: "More" }];
}
