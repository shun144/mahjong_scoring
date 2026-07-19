import { describe, expect, it } from "vitest";
import { generateMeldTotalChoices } from "./fuElementChoices";
import { createSeededRandom } from "./random";

describe("generateMeldTotalChoices", () => {
  it("includes the correct value among 4 unique non-negative choices", () => {
    const rng = createSeededRandom(42);
    const choices = generateMeldTotalChoices(8, rng);
    expect(choices).toContain(8);
    expect(new Set(choices).size).toBe(choices.length);
    expect(choices.length).toBeLessThanOrEqual(4);
    expect(choices.every((v) => v >= 0)).toBe(true);
  });

  it("is deterministic for a given seed", () => {
    const choicesA = generateMeldTotalChoices(4, createSeededRandom(7));
    const choicesB = generateMeldTotalChoices(4, createSeededRandom(7));
    expect(choicesA).toEqual(choicesB);
  });

  it("never produces negative distractors even when correct is 0", () => {
    const rng = createSeededRandom(1);
    const choices = generateMeldTotalChoices(0, rng);
    expect(choices).toContain(0);
    expect(choices.every((v) => v >= 0)).toBe(true);
  });

  it("returns choices sorted in ascending order", () => {
    for (const seed of [1, 7, 42, 100]) {
      const choices = generateMeldTotalChoices(8, createSeededRandom(seed));
      expect(choices).toEqual([...choices].sort((a, b) => a - b));
    }
  });
});
