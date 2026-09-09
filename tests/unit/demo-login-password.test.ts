import { describe, expect, it } from "vitest";
import {
  DEMO_LOGIN_PASSWORD,
  isValidDemoLoginPassword,
  resolveDemoLogin,
} from "@/lib/auth/demo-password";

describe("demo login password", () => {
  it("accepts the shared demo password", () => {
    expect(DEMO_LOGIN_PASSWORD).toBe("SPMPIPELINE");
    expect(isValidDemoLoginPassword("SPMPIPELINE")).toBe(true);
    expect(resolveDemoLogin({ userId: "user_001", password: "SPMPIPELINE" })).toEqual({
      ok: true,
      userId: "user_001",
    });
  });

  it("rejects a wrong or empty password without issuing a login", () => {
    expect(isValidDemoLoginPassword("spmpipeline")).toBe(false);
    expect(isValidDemoLoginPassword("")).toBe(false);
    expect(resolveDemoLogin({ userId: "user_001", password: "wrong" })).toEqual({
      ok: false,
      reason: "bad-password",
    });
  });

  it("rejects a missing profile before checking anything else meaningful", () => {
    expect(resolveDemoLogin({ userId: "", password: "SPMPIPELINE" })).toEqual({
      ok: false,
      reason: "unknown-user",
    });
  });
});
