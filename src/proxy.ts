import { NextResponse, type NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE, verifyDemoSessionToken } from "@/lib/auth/demo-token";
import { getEnv } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/api/health", "/api/logout"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Optimistic routing gate only.
 * Authorization is enforced by verified getSessionUser() in src/app/(app)/layout.tsx.
 *
 * In demo mode we HMAC-verify the demo cookie. Cookie presence alone is not auth.
 * Arbitrary sb-* cookies are ignored.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Env validation (rejects auth/live). Avoid leaking secrets in errors.
  let secret: string;
  try {
    secret = getEnv().DEMO_SESSION_SECRET;
  } catch {
    if (pathname === "/api/health" || pathname === "/login") {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const verifiedUserId = token ? verifyDemoSessionToken(token, secret) : null;
  const hasVerifiedDemoSession = Boolean(verifiedUserId);

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = hasVerifiedDemoSession ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  if (!hasVerifiedDemoSession && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/dashboard") {
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }

  // Do not bounce /login → /dashboard here based on cookie presence.
  // Valid sessions are redirected from the login page after getSessionUser().
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
