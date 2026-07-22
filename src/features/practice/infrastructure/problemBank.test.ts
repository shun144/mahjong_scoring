import { describe, expect, it } from "vitest";
import { scoreHand } from "@/core/scoring/domain/scoreHandService";
import { tilesToCounts } from "@/core/scoring/domain/tile";
import problemBankRaw from "./problemBank.json";
import { problemToScoreHandInput, type Problem } from "../domain/problem";

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

  it("自風=東 ⟺ 親（東家は必ず親・SPEC §4.1）", () => {
    for (const p of problemBank) {
      expect(p.conditions.isDealer).toBe(p.conditions.seatWind === "east");
    }
  });

  it("covers both 親（東家）and 子", () => {
    expect(problemBank.some((p) => p.conditions.isDealer)).toBe(true);
    expect(problemBank.some((p) => !p.conditions.isDealer)).toBe(true);
  });

  it("covers 七対子 and 役満 problems", () => {
    expect(problemBank.some((p) => p.answer.yaku.some((y) => y.name === "七対子"))).toBe(true);
    expect(problemBank.some((p) => p.answer.rank === "yakuman")).toBe(true);
  });

  it("同一牌は手牌＋ドラ/裏ドラ表示牌の合計で最大4枚（表示牌も牌山の実牌・SPEC §4.1/§5.4）", () => {
    for (const p of problemBank) {
      // ドラ表示牌・裏ドラ表示牌も牌山から取る実牌なので、手牌と合算して4枚を超えてはならない。
      const tiles = [
        ...p.hand.concealed,
        ...p.hand.melds.flatMap((m) => m.tiles),
        ...p.doraIndicators,
        ...p.uraDoraIndicators,
      ];
      const counts = tilesToCounts(tiles);
      expect(counts.every((count) => count <= 4)).toBe(true);
    }
  });

  it("covers dora, aka dora, and ura dora", () => {
    expect(problemBank.some((p) => p.answer.yaku.some((y) => y.name === "ドラ"))).toBe(true);
    expect(problemBank.some((p) => p.answer.yaku.some((y) => y.name === "赤ドラ"))).toBe(true);
    expect(problemBank.some((p) => p.answer.yaku.some((y) => y.name === "裏ドラ"))).toBe(true);
  });

  it("ドラ表示牌の枚数は「1+槓の数」に一致する（麻雀ルール上「なし」はあり得ない・SPEC §5.4）", () => {
    for (const p of problemBank) {
      const kanCount = p.hand.melds.filter(
        (m) => m.type === "minkan" || m.type === "ankan",
      ).length;
      expect(p.doraIndicators.length).toBe(1 + kanCount);
    }
  });

  it("ドラ/裏ドラ表示牌は実戦準拠の上限5枚以内", () => {
    // 実戦では表示牌は基本1枚＋槓ごとに1枚で最大5枚。数え役満をドラ表示牌の積み上げで
    // 作ると不正な盤面（例: 表示牌7枚）になるため、上限を担保する。
    for (const p of problemBank) {
      expect(p.doraIndicators.length).toBeLessThanOrEqual(5);
      expect(p.uraDoraIndicators.length).toBeLessThanOrEqual(5);
    }
  });

  it("非リーチ問題は裏ドラ表示牌を持たない", () => {
    for (const p of problemBank) {
      if (!p.conditions.riichi) expect(p.uraDoraIndicators.length).toBe(0);
    }
  });

  it("リーチ問題の裏ドラ表示牌は表ドラ表示牌と同数（1+槓の数・SPEC §5.4）", () => {
    for (const p of problemBank) {
      if (p.conditions.riichi) {
        expect(p.uraDoraIndicators.length).toBe(p.doraIndicators.length);
      }
    }
  });
});
