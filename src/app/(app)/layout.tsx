import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  AppSidebar,
  MobileBottomNav,
  MobileTopBar,
} from "@/components/layout/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <AppSidebar userName={user.name} userEmail={user.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <div className="border-b border-[var(--spm-gold)] bg-[var(--spm-deep-blue)] px-4 py-1.5 text-[12px] text-[var(--spm-cream)] md:px-6">
          Demo · synthetic data · HubSpot mock
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-6">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
