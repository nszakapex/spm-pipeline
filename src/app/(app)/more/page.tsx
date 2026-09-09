import Link from "next/link";
import { isAdminRole } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";
import { ADMIN_NAV } from "@/lib/nav/items";
import { redirect } from "next/navigation";

export const metadata = { title: "More" };

export default async function MorePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const destinations = isAdminRole(session.role)
    ? ADMIN_NAV
    : [{ href: "/settings" as const, label: "Settings" }];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="spm-page-title">More</h1>
        <p className="mt-1 text-sm text-[var(--spm-text-muted)]">
          {isAdminRole(session.role)
            ? "Admin destinations that stay off the sales dock."
            : "Account and session."}
        </p>
      </header>

      <section className="spm-panel overflow-hidden">
        <ul>
          {destinations.map((item) => (
            <li key={item.href} className="border-b border-[rgba(7,22,74,0.08)] last:border-b-0">
              <Link
                href={item.href}
                className="block px-4 py-3 text-sm font-semibold text-[var(--spm-navy)] hover:bg-[#f7f9ff]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
