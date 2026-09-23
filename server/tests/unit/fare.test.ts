import { describe, expect, it } from "vitest";

import {
  calculateDistanceChargePoysha,
  calculateFare,
  calculatePooledFarePoysha,
  calculateSoloFarePoysha,
  getFareBreakdown,
} from "../../src/shared/utils/fare.calculator.js";

describe("Integer poysha fare engine", () => {
  it("hand-computes the Banani -> Mohakhali route (4 km)", () => {
    expect(calculateDistanceChargePoysha(4)).toBe(8000);
    expect(calculateSoloFarePoysha(4)).toBe(13000);
    expect(calculatePooledFarePoysha(4)).toBe(9750);
    expect(getFareBreakdown(4, true).poolDiscountPoysha).toBe(3250);
  });

  it("hand-computes the Banani -> Gulshan 1 route (3 km)", () => {
    expect(calculateSoloFarePoysha(3)).toBe(11000);
    expect(calculatePooledFarePoysha(3)).toBe(8250);
    expect(getFareBreakdown(3, true).poolDiscountPoysha).toBe(2750);
  });

  it("matches the PRD 25% pooled discount", () => {
    expect(calculateFare(4, true)).toBe(9750);
    expect(calculatePooledFarePoysha(4)).toBe(Math.round(calculateSoloFarePoysha(4) * 0.75));
  });

  it("never produces fractional poysha", () => {
    for (const km of [0.5, 1.7, 3.5, 4.0, 9.3]) {
      expect(Number.isInteger(calculateSoloFarePoysha(km))).toBe(true);
      expect(Number.isInteger(calculatePooledFarePoysha(km))).toBe(true);
    }
  });
});