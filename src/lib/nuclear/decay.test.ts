import { describe, expect, it } from "vitest";
import { calculateDecayedActivity } from "./decay";

describe("Nuclear Medicine Decay Calculation Logic", () => {
  it("calculates Tc-99m decay (half-life 6.01 hours)", () => {
    const activityAfterOneHalfLife = calculateDecayedActivity(100, 6.01, "Tc-99m");
    expect(activityAfterOneHalfLife).toBeCloseTo(50, 1);

    const activityAfterTwoHalfLives = calculateDecayedActivity(100, 12.02, "Tc-99m");
    expect(activityAfterTwoHalfLives).toBeCloseTo(25, 1);
  });

  it("calculates I-131 decay (half-life 8.02 days = 192.48 hours)", () => {
    const activityAfterOneHalfLife = calculateDecayedActivity(150, 8.02 * 24, "I-131");
    expect(activityAfterOneHalfLife).toBeCloseTo(75, 1);
  });

  it("returns zero for invalid negative activity or time", () => {
    expect(calculateDecayedActivity(-10, 5, "I-131")).toBe(0);
    expect(calculateDecayedActivity(100, -2, "Tc-99m")).toBe(0);
  });
});
