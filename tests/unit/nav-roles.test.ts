import { describe, expect, it } from "vitest";
import {
  canAccessPath,
  desktopNavForRole,
  mobilePrimaryNavForRole,
} from "@/lib/nav/items";

describe("role-based navigation", () => {
  it("gives sales four working destinations and hides admin routes", () => {
    const desktop = desktopNavForRole("sales");
    expect(desktop.sales.map((item) => item.href)).toEqual([
      "/dashboard",
      "/leads",
      "/nurture",
      "/pipeline",
    ]);
    expect(desktop.admin).toEqual([]);
    expect(mobilePrimaryNavForRole("sales").map((item) => item.label)).toEqual([
      "Home",
      "Leads",
      "Nurture",
      "Pipeline",
    ]);
    expect(canAccessPath("sales", "/integrations")).toBe(false);
    expect(canAccessPath("sales", "/sources")).toBe(false);
    expect(canAccessPath("sales", "/analytics")).toBe(false);
    expect(canAccessPath("sales", "/settings")).toBe(true);
  });

  it("gives admin the extra destinations plus a More dock item", () => {
    const desktop = desktopNavForRole("admin");
    expect(desktop.admin.map((item) => item.href)).toEqual([
      "/sources",
      "/analytics",
      "/integrations",
      "/settings",
    ]);
    expect(mobilePrimaryNavForRole("admin").at(-1)).toEqual({
      href: "/more",
      label: "More",
    });
    expect(canAccessPath("admin", "/integrations")).toBe(true);
  });
});
