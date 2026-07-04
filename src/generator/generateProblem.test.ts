import { describe, expect, it } from "vitest";
import { scoreHand } from "../engine/scoreHand";
import { tilesToCounts } from "../engine/tileType";
import { problemToScoreHandInput } from "../data/problem";
import { generateProblem } from "./generateProblem";
import { createSeededRandom } from "./random";

const SAMPLE_SIZE = 300;

function generateMany(n: number, seed: number) {
  const rng = createSeededRandom(seed);
  const problems = [];
  for (let i = 0; i < n; i++) {
    const p = generateProblem(rng);
    if (p) problems.push(p);
  }
  return problems;
}

describe("generateProblem", () => {
  it("reliably produces valid problems (few or no failures across many attempts)", () => {
    const rng = createSeededRandom(1);
    let successes = 0;
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      if (generateProblem(rng)) successes += 1;
    }
    // ほぼ全ての試行が成功すること（無効手はリトライで吸収される）
    expect(successes).toBeGreaterThanOrEqual(SAMPLE_SIZE * 0.95);
  });

  it("every generated problem is re-scoreable and matches its stored answer", () => {
    const problems = generateMany(SAMPLE_SIZE, 2);
    expect(problems.length).toBeGreaterThan(0);
    for (const p of problems) {
      const recomputed = scoreHand(problemToScoreHandInput(p));
      expect(recomputed).toEqual(p.answer);
    }
  });

  it("every generated problem has at least one yaku (never dora-only)", () => {
    const problems = generateMany(SAMPLE_SIZE, 3);
    for (const p of problems) {
      expect(p.answer.yaku.length).toBeGreaterThan(0);
    }
  });

  it("only uses 場風=東/南 (never西/北)", () => {
    const problems = generateMany(SAMPLE_SIZE, 4);
    for (const p of problems) {
      expect(["east", "south"]).toContain(p.conditions.roundWind);
    }
  });

  it("dealer status is always consistent with seat wind (自風=東 の家が常に親)", () => {
    const problems = generateMany(SAMPLE_SIZE, 5);
    for (const p of problems) {
      expect(p.conditions.isDealer).toBe(p.conditions.seatWind === "east");
    }
  });

  it("riichi is only ever set on menzen hands (no open melds other than ankan)", () => {
    const problems = generateMany(SAMPLE_SIZE, 6);
    for (const p of problems) {
      if (p.conditions.riichi) {
        expect(p.hand.melds.every((m) => m.type === "ankan")).toBe(true);
      }
    }
  });

  it("uraDoraIndicators is only present when riichi is true", () => {
    const problems = generateMany(SAMPLE_SIZE, 7);
    for (const p of problems) {
      if (!p.conditions.riichi) {
        expect(p.uraDoraIndicators).toHaveLength(0);
      }
    }
  });

  it("dora indicator count is exactly 1 + the number of kans in the hand (SPEC.md §5.4)", () => {
    const problems = generateMany(SAMPLE_SIZE, 12);
    for (const p of problems) {
      const kanCount = p.hand.melds.filter(
        (m) => m.type === "minkan" || m.type === "ankan",
      ).length;
      expect(p.doraIndicators.length).toBe(1 + kanCount);
      expect(p.doraIndicators.length).toBeLessThanOrEqual(5);
      // リーチ時は裏ドラ表示牌も表と同数（1+槓の数）出す。非リーチは0枚。
      if (p.conditions.riichi) {
        expect(p.uraDoraIndicators.length).toBe(1 + kanCount);
      } else {
        expect(p.uraDoraIndicators.length).toBe(0);
      }
    }
  });

  it("同一牌は手牌全体で最大4枚（麻雀の牌山は各牌4枚まで・SPEC §4.1/§6）", () => {
    // 槓が既存の順子・刻子・雀頭と同じ牌を占有すると5枚以上になり得るため、
    // 槓を含む手が十分出るよう複数シードにわたって検証する。
    const problems = [1, 2, 3, 4, 5].flatMap((seed) => generateMany(SAMPLE_SIZE, seed * 100));
    for (const p of problems) {
      const tiles = [...p.hand.concealed, ...p.hand.melds.flatMap((m) => m.tiles)];
      const counts = tilesToCounts(tiles);
      expect(counts.every((count) => count <= 4)).toBe(true);
    }
  });

  it("distribution is not overly skewed: covers ron and tsumo, riichi and non-riichi, menzen and open hands", () => {
    const problems = generateMany(SAMPLE_SIZE, 8);
    const ronCount = problems.filter((p) => p.hand.winType === "ron").length;
    const tsumoCount = problems.filter((p) => p.hand.winType === "tsumo").length;
    expect(ronCount).toBeGreaterThan(problems.length * 0.2);
    expect(tsumoCount).toBeGreaterThan(problems.length * 0.2);

    const riichiCount = problems.filter((p) => p.conditions.riichi).length;
    const nonRiichiCount = problems.filter((p) => !p.conditions.riichi).length;
    expect(riichiCount).toBeGreaterThan(0);
    expect(nonRiichiCount).toBeGreaterThan(0);

    const openCount = problems.filter((p) => p.hand.melds.length > 0).length;
    const menzenCount = problems.filter((p) => p.hand.melds.length === 0).length;
    expect(openCount).toBeGreaterThan(0);
    expect(menzenCount).toBeGreaterThan(0);

    const fuTypes = new Set(problems.map((p) => p.answer.fu));
    expect(fuTypes.size).toBeGreaterThanOrEqual(4);

    const seatWinds = new Set(problems.map((p) => p.conditions.seatWind));
    expect(seatWinds.size).toBe(4);
  });

  it("occasionally produces 七対子 hands", () => {
    const problems = generateMany(SAMPLE_SIZE, 9);
    expect(problems.some((p) => p.answer.yaku.some((y) => y.name === "七対子"))).toBe(true);
  });

  it("tags.fuType and tags.yakuCategories always match the answer", () => {
    const problems = generateMany(100, 10);
    for (const p of problems) {
      expect(p.tags.fuType).toBe(p.answer.fu);
      expect(p.tags.yakuCategories).toEqual(p.answer.yaku.map((y) => y.name));
    }
  });

  it("generated ids are unique across a batch", () => {
    const problems = generateMany(100, 11);
    const ids = new Set(problems.map((p) => p.id));
    expect(ids.size).toBe(problems.length);
  });
});
