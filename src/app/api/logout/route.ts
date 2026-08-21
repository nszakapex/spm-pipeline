import { NextResponse, type NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/demo-token";
import { shouldUseSecureCookies } from "@/lib/env";

export async function POST(request: NextRequest) {
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? null;
  const secure = shouldUseSecureCookies(proto);
  const res = NextResponse.redirect(new URL("/login", request.url), 303);
  res.cookies.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  return res;
}

/** Allow simple link-style logout in constrained clients. */
export async function GET(request: NextRequest) {
  return POST(request);
}
