import { describe, it, expect } from "vitest";
import { calculatePointsEarned } from "../loyalty";

describe("calculatePointsEarned", () => {
  it("should return 0 for zero amount", () => {
    expect(calculatePointsEarned(0, 10, 10)).toBe(0);
  });

  it("should return 0 for negative amount", () => {
    expect(calculatePointsEarned(-50, 10, 10)).toBe(0);
  });

  it("should return 0 for zero points per unit", () => {
    expect(calculatePointsEarned(100, 0, 10)).toBe(0);
  });

  it("should return 0 for negative points per unit", () => {
    expect(calculatePointsEarned(100, -5, 10)).toBe(0);
  });

  it("should calculate correctly for exact multiples", () => {
    // R$100 / R$10 = 10 units * 1 point = 10 points
    expect(calculatePointsEarned(100, 1, 10)).toBe(10);
  });

  it("should floor partial units", () => {
    // R$95 / R$10 = 9.5, floor = 9 units * 1 point = 9 points
    expect(calculatePointsEarned(95, 1, 10)).toBe(9);
  });

  it("should handle custom points per unit", () => {
    // R$100 / R$10 = 10 units * 5 points = 50 points
    expect(calculatePointsEarned(100, 5, 10)).toBe(50);
  });

  it("should handle custom unit amount", () => {
    // R$100 / R$25 = 4 units * 2 points = 8 points
    expect(calculatePointsEarned(100, 2, 25)).toBe(8);
  });

  it("should handle small amounts below threshold", () => {
    // R$5 / R$10 = 0.5, floor = 0 units * 10 points = 0 points
    expect(calculatePointsEarned(5, 10, 10)).toBe(0);
  });

  it("should handle large amounts", () => {
    // R$1000 / R$10 = 100 units * 10 points = 1000 points
    expect(calculatePointsEarned(1000, 10, 10)).toBe(1000);
  });

  it("should use default unit amount of 10", () => {
    // R$80 / R$10 = 8 units * 1 point = 8 points
    expect(calculatePointsEarned(80, 1)).toBe(8);
  });
});
