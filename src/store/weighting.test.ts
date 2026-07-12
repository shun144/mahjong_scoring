import { describe, expect, it } from "vitest";
import type { Problem } from "../data/problem";
import type { ScoreRank } from "../engine/score";
import { createSeededRandom } from "../generator/random";
import { createEmptyStats, type StatsState } from "./statsStore";
import { categoryBias, CHIITOI_BIAS_FU_PARTS, problemWeight, weightedPick } from "./weighting";

function fakeProblem(fuType: number, yakuCategories: string[]): Problem {
  return {
    id: "p1",
    source: "bank",
    hand: { concealed: [], melds: [], winningTile: { suit: "m", rank: 1 }, winType: "ron" },
    doraIndicators: [],
    uraDoraIndicators: [],
    conditions: { seatWind: "east", roundWind: "east", isDealer: false, riichi: false },
    answer: { yaku: [], han: 1, fu: fuType, payment: { kind: "ron", total: 1000 } },
    tags: { fuType, yakuCategories },
  };
}

/** categoryBias 検証用に answer の rank/fu/役名を差し替えた問題を作る。 */
function biasProblem(over: { rank?: ScoreRank; fu?: number; yaku?: string[] }): Problem {
  const fu = over.fu ?? 40;
  const p = fakeProblem(fu, over.yaku ?? []);
  p.answer = {
    yaku: (over.yaku ?? []).map((name) => ({ name, han: 1 })),
    han: 5,
    fu,
    payment: { kind: "ron", total: 8000 },
    rank: over.rank,
  };
  return p;
}

describe("problemWeight", () => {
  it("gives a neutral weight to a problem with entirely unseen tags", () => {
    const stats = createEmptyStats();
    const weight = problemWeight(fakeProblem(30, ["リーチ"]), stats);
    expect(weight).toBeCloseTo(1.2 - 0.5, 5); // PRIOR 1/2 = 0.5
  });

  it("weighs a poorly-scored tag higher than a well-scored tag", () => {
    const stats: StatsState = createEmptyStats();
    stats.byFuType["30"] = { correct: 0, total: 10 }; // 苦手
    stats.byFuType["40"] = { correct: 10, total: 10 }; // 得意

    const weakWeight = problemWeight(fakeProblem(30, []), stats);
    const strongWeight = problemWeight(fakeProblem(40, []), stats);
    expect(weakWeight).toBeGreaterThan(strongWeight);
  });

  it("never produces a non-positive weight even for a fully-mastered tag", () => {
    const stats: StatsState = createEmptyStats();
    stats.byFuType["30"] = { correct: 100, total: 100 };
    const weight = problemWeight(fakeProblem(30, []), stats);
    expect(weight).toBeGreaterThan(0);
  });

  it("uses the weakest relevant tag among fuType and multiple yaku categories", () => {
    const stats: StatsState = createEmptyStats();
    stats.byFuType["30"] = { correct: 10, total: 10 }; // 得意
    stats.byYakuCategory["リーチ"] = { correct: 10, total: 10 }; // 得意
    stats.byYakuCategory["三色同順"] = { correct: 0, total: 10 }; // 苦手

    const weight = problemWeight(fakeProblem(30, ["リーチ", "三色同順"]), stats);
    const soloWeakWeight = problemWeight(fakeProblem(999, ["三色同順"]), stats);
    // fuType 999は未挑戦(中立0.5)だが、三色同順(0付近)の方がさらに低いはずなので
    // 両者の重みはほぼ同じ(三色同順のaccuracyが支配的)になる
    expect(weight).toBeCloseTo(soloWeakWeight, 1);
  });
});

describe("categoryBias", () => {
  it("suppresses 役満 (bias < 1)", () => {
    expect(categoryBias(biasProblem({ rank: "yakuman", fu: 40 }))).toBeLessThan(1);
  });

  it("suppresses 七対子 (bias < 1)", () => {
    expect(categoryBias(biasProblem({ yaku: ["七対子"], fu: 25 }))).toBeLessThan(1);
  });

  it("boosts 満貫以上かつ50符以上 (bias > 1)", () => {
    expect(categoryBias(biasProblem({ rank: "mangan", fu: 50 }))).toBeGreaterThan(1);
  });

  it("is neutral (=1) for a normal 40符 hand and for 満貫未満の50符", () => {
    expect(categoryBias(biasProblem({ fu: 40 }))).toBe(1);
    expect(categoryBias(biasProblem({ rank: undefined, fu: 50 }))).toBe(1);
  });

  it("prioritises 役満 suppression over the 50符 boost when both apply", () => {
    // 役満かつ50符+ でも役満抑制（<1）が優先される
    expect(categoryBias(biasProblem({ rank: "yakuman", fu: 60 }))).toBeLessThan(1);
  });

  it("chiitoiBias 引数を渡すと七対子の抑制係数だけを上書きする（符分解モード用）", () => {
    const chiitoi = biasProblem({ yaku: ["七対子"], fu: 25 });
    expect(categoryBias(chiitoi, CHIITOI_BIAS_FU_PARTS)).toBe(CHIITOI_BIAS_FU_PARTS);
    // 引数省略時は従来どおり CHIITOI_BIAS（0.31）のまま
    expect(categoryBias(chiitoi)).toBeCloseTo(0.31, 5);
  });

  it("chiitoiBias 引数は役満・満貫50符+の分岐に影響しない", () => {
    expect(categoryBias(biasProblem({ rank: "yakuman", fu: 40 }), 0.05)).toBeLessThan(1);
    expect(categoryBias(biasProblem({ rank: "mangan", fu: 50 }), 0.05)).toBeGreaterThan(1);
  });
});

describe("weightedPick", () => {
  it("always picks the only item when there is one candidate", () => {
    const rng = createSeededRandom(1);
    expect(weightedPick(["a"], [1], rng)).toBe("a");
  });

  it("falls back to the first item when total weight is zero", () => {
    const rng = createSeededRandom(1);
    expect(weightedPick(["a", "b"], [0, 0], rng)).toBe("a");
  });

  it("selects items proportionally to their weight over many trials", () => {
    const rng = createSeededRandom(42);
    const items = ["heavy", "light"];
    const weights = [9, 1]; // heavy should win ~90% of the time
    let heavyCount = 0;
    const trials = 2000;
    for (let i = 0; i < trials; i++) {
      if (weightedPick(items, weights, rng) === "heavy") heavyCount++;
    }
    const ratio = heavyCount / trials;
    expect(ratio).toBeGreaterThan(0.85);
    expect(ratio).toBeLessThan(0.95);
  });
});
