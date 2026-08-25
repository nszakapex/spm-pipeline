import { describe, expect, it } from "vitest";
import { DEMO_LOGIN_OPTIONS } from "@/lib/auth/demo-login";
import { DEMO_USERS } from "@/lib/demo/seed";

describe("demo login identities", () => {
  it("exposes Max, Mack, and Nate as the only login options", () => {
    expect(DEMO_LOGIN_OPTIONS.map((opt) => opt.label)).toEqual([
      "Max Sussman (Sales)",
      "Mack Ianni (Sales)",
      "Nate Szakallas (Admin)",
    ]);
  });

  it("keeps login ids and emails aligned with seeded users", () => {
    expect(DEMO_USERS.map((user) => user.name)).toEqual([
      "Max Sussman",
      "Mack Ianni",
      "Nate Szakallas",
    ]);
    expect(DEMO_LOGIN_OPTIONS.map((opt) => opt.id)).toEqual(
      DEMO_USERS.map((user) => user.id),
    );
    expect(DEMO_LOGIN_OPTIONS.map((opt) => opt.email)).toEqual([
      "max.sussman@example.spm-pipeline.local",
      "mack.ianni@example.spm-pipeline.local",
      "nate.szakallas@example.spm-pipeline.local",
    ]);
    for (const user of DEMO_USERS) {
      const option = DEMO_LOGIN_OPTIONS.find((opt) => opt.id === user.id);
      expect(option?.email).toBe(user.email);
      expect(option?.label).toContain(user.name);
    }
  });
});
