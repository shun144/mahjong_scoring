import { describe, expect, it } from "vitest";
import { scoreHand } from "../engine/scoreHand";
import problemBankRaw from "./problemBank.json";
import { problemToScoreHandInput, type Problem } from "./problem";

const problemBank = problemBankRaw as unknown as Problem[];

describe("problemBank", () => {
  it("contains a substantial, non-empty set of problems", () => {
    expect(problemBank.length).toBeGreaterThanOrEqual(50);
  });

  it("has unique ids", () => {
    const ids = problemBank.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(problemBank.map((p) => [p.id, p] as const))(
    "%s: engine output matches the stored answer",
    (_id, problem) => {
      const recomputed = scoreHand(problemToScoreHandInput(problem));
      expect(recomputed).not.toBeNull();
      expect(recomputed).toEqual(problem.answer);
    },
  );

  it("every problem has a fuType tag matching its answer.fu", () => {
    for (const p of problemBank) {
      expect(p.tags.fuType).toBe(p.answer.fu);
    }
  });

  it("every problem has non-empty yakuCategories matching its answer.yaku names", () => {
    for (const p of problemBank) {
      expect(p.tags.yakuCategories.length).toBeGreaterThan(0);
      expect(p.tags.yakuCategories).toEqual(p.answer.yaku.map((y) => y.name));
    }
  });

  it("covers a diverse range of fu values", () => {
    const fuValues = new Set(problemBank.map((p) => p.answer.fu));
    expect(fuValues.size).toBeGreaterThanOrEqual(7);
  });

  it("covers menzen and open (鳴き) hands", () => {
    expect(problemBank.some((p) => p.hand.melds.length === 0)).toBe(true);
    expect(problemBank.some((p) => p.hand.melds.length > 0)).toBe(true);
  });

  it("covers riichi and non-riichi hands", () => {
    expect(problemBank.some((p) => p.conditions.riichi)).toBe(true);
    expect(problemBank.some((p) => !p.conditions.riichi)).toBe(true);
  });

  it("covers both ron and tsumo", () => {
    expect(problemBank.some((p) => p.hand.winType === "ron")).toBe(true);
    expect(problemBank.some((p) => p.hand.winType === "tsumo")).toBe(true);
  });

  it("covers 七対子 and 役満 problems", () => {
    expect(problemBank.some((p) => p.answer.yaku.some((y) => y.name === "七対子"))).toBe(true);
    expect(problemBank.some((p) => p.answer.rank === "yakuman")).toBe(true);
  });

  it("covers dora, aka dora, and ura dora", () => {
    expect(problemBank.some((p) => p.answer.yaku.some((y) => y.name === "ドラ"))).toBe(true);
    expect(problemBank.some((p) => p.answer.yaku.some((y) => y.name === "赤ドラ"))).toBe(true);
    expect(problemBank.some((p) => p.answer.yaku.some((y) => y.name === "裏ドラ"))).toBe(true);
  });
});
