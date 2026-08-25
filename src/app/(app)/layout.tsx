import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hydratePipelineForRequest } from "@/lib/db/hydrate-pipeline";
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
  await hydratePipelineForRequest();

  return (
    <div className="spm-shell">
      <AppSidebar userName={user.name} userEmail={user.email} role={user.role} />
      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        <MobileTopBar role={user.role} />
        <main className="spm-well mx-auto w-full max-w-7xl flex-1 animate-fade-up px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
        <MobileBottomNav role={user.role} />
      </div>
    </div>
  );
}
