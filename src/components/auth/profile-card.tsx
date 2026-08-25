import { ROLE_LABEL } from "@/lib/auth/demo-login";
import type { UserRole } from "@/types/domain";
import { cn } from "@/lib/utils";

export function profileInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileCard({
  name,
  email,
  role,
  interactive,
}: {
  name: string;
  email: string;
  role: UserRole;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-[rgba(7,22,74,0.1)] bg-white p-3 text-left",
        interactive && "hover:bg-[#f7f9ff]",
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-xs font-bold text-[var(--spm-blue-primary)]">
        {profileInitials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--spm-navy)]">{name}</p>
        <p className="truncate text-xs text-[var(--spm-text-muted)]">{email}</p>
        <p className="mt-1 text-[11px] text-[var(--spm-text-muted)]">
          {ROLE_LABEL[role]} · Demo · HubSpot mock
        </p>
      </div>
    </div>
  );
}
