import type { UserRole } from "@/types/domain";

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "admin";
}
