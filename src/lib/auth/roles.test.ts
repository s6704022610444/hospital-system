import { describe, expect, it } from "vitest";
import { hospitalRoles, canSwitchRole } from "./roles";

describe("hospital role switching", () => {
  it("defines all ten hospital roles", () => {
    expect(hospitalRoles).toHaveLength(10);
    expect(hospitalRoles).toContain("med_tech");
    expect(hospitalRoles).toContain("nuclear_med");
  });

  it("allows switching only to an assigned role", () => {
    expect(canSwitchRole(["doctor", "director"], "director")).toBe(true);
    expect(canSwitchRole(["doctor", "director"], "nurse")).toBe(false);
  });
});
