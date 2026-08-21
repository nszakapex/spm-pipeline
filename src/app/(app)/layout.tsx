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
        <div className="border-b border-[rgba(7,22,74,0.08)] bg-[#f8fafd] px-4 py-2 text-center text-[11px] font-semibold tracking-[-0.01em] text-[var(--spm-text-muted)] md:px-8">
          Demo · synthetic data · HubSpot mock
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
