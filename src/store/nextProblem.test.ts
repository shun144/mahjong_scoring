import { beforeEach, describe, expect, it } from "vitest";
import problemBankRaw from "../data/problemBank.json";
import type { Problem } from "../data/problem";
import { createSeededRandom } from "../generator/random";
import { nextProblem } from "./nextProblem";
import { loadStats, recordAnswer, type StatsState } from "./statsStore";
import { categoryBias, problemWeight } from "./weighting";

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

    // 出題確率は nextProblem のバンク抽選（weightedPick）が使う重み
    // problemWeight × categoryBias に比例する。そこで「TARGET_TAG を含む問題の重み合計
    // ÷ 全問題の重み合計」＝ TARGET_TAG の出題確率、として苦手化前後を比較する。
    // 乱数を介さず決定論的に検証するため、PRNG の系列相関やサンプリング分散に左右されない。
    function targetSelectionProbability(stats: StatsState): number {
      let target = 0;
      let all = 0;
      for (const p of problemBank) {
        const weight = problemWeight(p, stats) * categoryBias(p);
        all += weight;
        if (p.tags.yakuCategories.includes(TARGET_TAG)) target += weight;
      }
      return target / all;
    }

    const baselineProbability = targetSelectionProbability(loadStats()); // 成績なし

    // TARGET_TAGを大量に間違えた履歴を積む -> このタグは「苦手」になる
    const weakProblem = problemBank.find((p) => p.tags.yakuCategories.includes(TARGET_TAG));
    if (!weakProblem) throw new Error(`テスト前提: バンクに${TARGET_TAG}を含む問題が必要`);
    for (let i = 0; i < 30; i++) recordAnswer(weakProblem, false);

    const biasedProbability = targetSelectionProbability(loadStats());

    expect(biasedProbability).toBeGreaterThan(baselineProbability);
  });
});
