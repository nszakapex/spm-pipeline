import { describe, expect, it } from "vitest";
import {
  DEMO_SESSION_MAX_AGE_SECONDS,
  createDemoSessionToken,
  verifyDemoSessionToken,
} from "@/lib/auth/demo-token";
import { TEST_ONLY_DEMO_SESSION_SECRET } from "@/lib/env";

const secret = TEST_ONLY_DEMO_SESSION_SECRET;
const now = Date.UTC(2026, 7, 21, 12, 0, 0);

describe("demo session tokens", () => {
  it("accepts a valid token", () => {
    const token = createDemoSessionToken("user_001", secret, now);
    expect(verifyDemoSessionToken(token, secret, now)).toBe("user_001");
  });

  it("rejects a tampered payload", () => {
    const token = createDemoSessionToken("user_001", secret, now);
    const tampered = token.replace("user_001", "user_999");
    expect(verifyDemoSessionToken(tampered, secret, now)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = createDemoSessionToken("user_001", secret, now);
    const parts = token.split(".");
    parts[2] = "a".repeat(parts[2].length);
    expect(verifyDemoSessionToken(parts.join("."), secret, now)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyDemoSessionToken("", secret, now)).toBeNull();
    expect(verifyDemoSessionToken("only.two", secret, now)).toBeNull();
    expect(verifyDemoSessionToken("a.b.c.d", secret, now)).toBeNull();
    expect(verifyDemoSessionToken("user.notanumber.sig", secret, now)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = createDemoSessionToken("user_001", secret, now);
    const later = now + (DEMO_SESSION_MAX_AGE_SECONDS + 1) * 1000;
    expect(verifyDemoSessionToken(token, secret, later)).toBeNull();
  });

  it("rejects unreasonably future-dated tokens", () => {
    const future = now + 60 * 60 * 1000;
    const token = createDemoSessionToken("user_001", secret, future);
    expect(verifyDemoSessionToken(token, secret, now)).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    const token = createDemoSessionToken("user_001", secret, now);
    expect(
      verifyDemoSessionToken(token, `${secret}-other-secret-value-xxxxxxxx`, now),
    ).toBeNull();
  });
});
