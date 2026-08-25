import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { createDemoSessionToken } from "@/lib/auth/demo-token";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/demo-token";
import { TEST_ONLY_DEMO_SESSION_SECRET, shouldUseSecureCookies } from "@/lib/env";

function req(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy route protection", () => {
  it("sends unauthenticated /dashboard to /login", async () => {
    const res = proxy(req("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("sends unauthenticated / to /login", () => {
    const res = proxy(req("/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("keeps /login reachable with an invalid demo cookie (no loop to dashboard)", () => {
    const res = proxy(req("/login", `${DEMO_SESSION_COOKIE}=invalid.token.value`));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("ignores arbitrary sb-* cookies in demo mode", () => {
    const res = proxy(req("/dashboard", "sb-access-token=fake"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("allows a verified demo session through to protected routes", () => {
    const token = createDemoSessionToken(
      "user_001",
      TEST_ONLY_DEMO_SESSION_SECRET,
    );
    const res = proxy(req("/dashboard", `${DEMO_SESSION_COOKIE}=${token}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows /login even when a verified session cookie is present (page redirects)", () => {
    const token = createDemoSessionToken(
      "user_001",
      TEST_ONLY_DEMO_SESSION_SECRET,
    );
    const res = proxy(req("/login", `${DEMO_SESSION_COOKIE}=${token}`));
    expect(res.status).toBe(200);
  });

  it("keeps /api/health public", () => {
    const res = proxy(req("/api/health"));
    expect(res.status).toBe(200);
  });

  it("keeps /api/logout public so invalid sessions can still sign out", () => {
    const res = proxy(req("/api/logout"));
    expect(res.status).toBe(200);
  });

  it("keeps signed webhook routes public (auth is HMAC, not the demo cookie)", () => {
    const res = proxy(req("/api/webhooks/calendar"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("secure cookie policy", () => {
  it("forces Secure on Vercel", () => {
    process.env.VERCEL = "1";
    expect(shouldUseSecureCookies("http")).toBe(true);
    delete process.env.VERCEL;
  });

  it("uses Secure for https hints and allows local http", () => {
    delete process.env.VERCEL;
    expect(shouldUseSecureCookies("https")).toBe(true);
    expect(shouldUseSecureCookies("http")).toBe(false);
    expect(shouldUseSecureCookies(null)).toBe(false);
  });
});
