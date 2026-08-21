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
    <div className="spm-stage">
      <div className="spm-window">
        <div className="spm-titlebar">
          <span className="spm-traffic" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="spm-titlebar-label">SPM Pipeline</span>
          <span className="spm-titlebar-meta">Demo · HubSpot mock</span>
        </div>
        <div className="spm-window-body">
          <AppSidebar userName={user.name} userEmail={user.email} />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileTopBar />
            <main className="spm-well mx-auto w-full max-w-7xl flex-1 animate-fade-up px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
              {children}
            </main>
            <MobileBottomNav />
          </div>
        </div>
        <div className="spm-statusbar">
          <span>Pipeline Control</span>
          <span>Demo · HubSpot mock</span>
        </div>
      </div>
    </div>
  );
}
