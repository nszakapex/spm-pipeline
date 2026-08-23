import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { canAccessPath } from "@/lib/nav/items";

export async function requireAdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/dashboard");
  return user;
}

export async function redirectIfCannotAccess(pathname: string) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canAccessPath(user.role, pathname)) redirect("/dashboard");
  return user;
}
