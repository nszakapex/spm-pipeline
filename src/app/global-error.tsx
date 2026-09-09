"use client";

import { AuthErrorPanel } from "@/components/auth/auth-error-panel";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-full font-sans antialiased">
        <AuthErrorPanel onRetry={reset} />
      </body>
    </html>
  );
}
