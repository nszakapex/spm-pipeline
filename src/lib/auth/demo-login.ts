import type { AppUser, UserRole } from "@/types/domain";
import { DEMO_USERS } from "@/lib/demo/seed";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  sales: "Sales",
  viewer: "Viewer",
};

export function demoLoginLabel(user: Pick<AppUser, "name" | "role">): string {
  return `${user.name} (${ROLE_LABEL[user.role]})`;
}

/** Login buttons are derived from seeded demo users so names cannot drift. */
export const DEMO_LOGIN_OPTIONS = DEMO_USERS.map((user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  label: demoLoginLabel(user),
}));

export function findDemoLoginOption(userId: string) {
  return DEMO_LOGIN_OPTIONS.find((opt) => opt.id === userId);
}
