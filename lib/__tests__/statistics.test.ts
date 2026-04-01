import { describe, it, expect } from "vitest";
import { calculateStats, pearsonCorrelation, normalize } from "../statistics";

describe("calculateStats", () => {
  it("calculates correct stats", () => {
    const r = calculateStats([1, 2, 3, 4, 5]);
    expect(r.count).toBe(5);
    expect(r.mean).toBe(3);
    expect(r.min).toBe(1);
    expect(r.max).toBe(5);
    expect(r.stdDev).toBeGreaterThan(1.4);
    expect(r.stdDev).toBeLessThan(1.5);
  });
  it("handles empty array", () => {
    const r = calculateStats([]);
    expect(r.count).toBe(0);
    expect(r.mean).toBe(0);
  });
});

describe("pearsonCorrelation", () => {
  it("perfect positive correlation", () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(r).toBe(1);
  });
  it("perfect negative correlation", () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    expect(r).toBe(-1);
  });
});

describe("normalize", () => {
  it("normalizes to 0-1 range", () => {
    const r = normalize([10, 20, 30]);
    expect(r[0]).toBe(0);
    expect(r[1]).toBe(0.5);
    expect(r[2]).toBe(1);
  });
  it("handles constant values", () => {
    const r = normalize([5, 5, 5]);
    expect(r).toEqual([0.5, 0.5, 0.5]);
  });
});
