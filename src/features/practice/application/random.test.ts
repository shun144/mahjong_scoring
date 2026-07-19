import { describe, expect, it } from "vitest";
import { chance, createSeededRandom, pickOne, randomInt } from "./random";

describe("createSeededRandom", () => {
  it("is deterministic for the same seed", () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces values within [0,1)", () => {
    const rng = createSeededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("pickOne / randomInt / chance", () => {
  it("pickOne always returns an element of the array", () => {
    const rng = createSeededRandom(1);
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(pickOne(arr, rng));
    }
  });

  it("randomInt stays within inclusive bounds", () => {
    const rng = createSeededRandom(2);
    for (let i = 0; i < 500; i++) {
      const v = randomInt(3, 7, rng);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it("chance(1) is always true and chance(0) is always false", () => {
    const rng = createSeededRandom(3);
    expect(chance(1, rng)).toBe(true);
    expect(chance(0, rng)).toBe(false);
  });
});
