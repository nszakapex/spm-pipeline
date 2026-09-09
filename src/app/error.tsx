"use client";

import { AuthErrorPanel } from "@/components/auth/auth-error-panel";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AuthErrorPanel onRetry={reset} />;
}
