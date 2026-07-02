import { beforeEach, describe, expect, it } from "vitest";
import problemBankRaw from "../data/problemBank.json";
import type { Problem } from "../data/problem";
import { createSeededRandom } from "../generator/random";
import { nextProblem } from "./nextProblem";
import { recordAnswer } from "./statsStore";

const problemBank = problemBankRaw as unknown as Problem[];

beforeEach(() => {
  localStorage.clear();
});

describe("nextProblem", () => {
  it("always returns a valid problem", () => {
    const rng = createSeededRandom(1);
    for (let i = 0; i < 50; i++) {
      const p = nextProblem(rng);
      expect(p).toBeDefined();
      expect(p.answer.yaku.length).toBeGreaterThan(0);
    }
  });

  it("returns a mix of bank and generated sources over many calls", () => {
    const rng = createSeededRandom(2);
    const sources = new Set<string>();
    for (let i = 0; i < 100; i++) {
      sources.add(nextProblem(rng).source);
    }
    expect(sources.has("bank")).toBe(true);
    expect(sources.has("generated")).toBe(true);
  });

  it("surfaces problems tagged with a weak (poorly-scored) yaku category more often", () => {
    const TARGET_TAG = "七対子";
    const TRIALS = 1500;

    function bankOnlyTagRate(seed: number): number {
      const rng = createSeededRandom(seed);
      let bankCount = 0;
      let taggedCount = 0;
      for (let i = 0; i < TRIALS; i++) {
        const p = nextProblem(rng);
        if (p.source !== "bank") continue;
        bankCount += 1;
        if (p.tags.yakuCategories.includes(TARGET_TAG)) taggedCount += 1;
      }
      return taggedCount / bankCount;
    }

    const baselineRate = bankOnlyTagRate(7);

    // TARGET_TAGを大量に間違えた履歴を積む -> このタグは「苦手」になる
    const weakProblem = problemBank.find((p) => p.tags.yakuCategories.includes(TARGET_TAG));
    if (!weakProblem) throw new Error(`テスト前提: バンクに${TARGET_TAG}を含む問題が必要`);
    for (let i = 0; i < 30; i++) recordAnswer(weakProblem, false);

    const biasedRate = bankOnlyTagRate(7); // 同じシードで比較

    expect(biasedRate).toBeGreaterThan(baselineRate);
  });
});
