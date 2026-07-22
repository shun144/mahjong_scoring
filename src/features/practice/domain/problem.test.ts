import { describe, expect, it } from "vitest";
import { scoreHand } from "@/core/scoring/domain/scoreHandService";
import { parseTileNotation } from "@/core/scoring/domain/tile";
import { resolveAnswer, type Problem } from "./problem";

function tiles(compact: string) {
  const parts = compact.match(/\d+[mpsz]/g) ?? [];
  const out: ReturnType<typeof parseTileNotation>[] = [];
  for (const part of parts) {
    const suit = part[part.length - 1];
    for (const digit of part.slice(0, -1)) out.push(parseTileNotation(`${digit}${suit}`));
  }
  return out;
}

// リーチ+平和+ドラ2 = 4翻30符（基本点1920）の境界手。roundUpMangan有無で答えが変わる。
function boundaryProblem(overrides: Partial<Problem> = {}): Problem {
  const hand = {
    concealed: tiles("234m567p33z345s789m"),
    melds: [],
    winningTile: parseTileNotation("9m"),
    winType: "ron" as const,
  };
  const conditions = {
    seatWind: "east" as const,
    roundWind: "east" as const,
    isDealer: false,
    riichi: true,
  };
  const doraIndicators = [parseTileNotation("2s"), parseTileNotation("6p")];
  const answer = scoreHand({
    ...hand,
    doraIndicators,
    uraDoraIndicators: [],
    ...conditions,
  });
  if (!answer) throw new Error("テスト用の境界手が不正です");

  return {
    id: "test-boundary",
    source: "generated",
    hand,
    doraIndicators,
    uraDoraIndicators: [],
    conditions,
    answer,
    tags: { fuType: 30, yakuCategories: ["リーチ", "平和"] },
    ...overrides,
  };
}

describe("resolveAnswer", () => {
  it("roundUpMangan=falseなら標準ルールの答え(子7700)のまま", () => {
    const problem = boundaryProblem();
    const resolved = resolveAnswer(problem, false);
    expect(resolved.answer.rank).toBeUndefined();
    expect(resolved.answer.payment).toEqual({ kind: "ron", total: 7700 });
  });

  it("roundUpMangan=trueなら満貫に切り上がった答え(子8000)になる", () => {
    const problem = boundaryProblem();
    const resolved = resolveAnswer(problem, true);
    expect(resolved.answer.rank).toBe("mangan");
    expect(resolved.answer.payment).toEqual({ kind: "ron", total: 8000 });
    // han/fu/yakuは不変(高点法の勝ち解釈は切り上げ満貫で変わらないため)。
    expect(resolved.answer.han).toBe(problem.answer.han);
    expect(resolved.answer.fu).toBe(problem.answer.fu);
    expect(resolved.answer.yaku).toEqual(problem.answer.yaku);
  });

  it("手牌・条件・タグ等、answer以外は変更しない", () => {
    const problem = boundaryProblem();
    const resolved = resolveAnswer(problem, true);
    expect(resolved.hand).toBe(problem.hand);
    expect(resolved.conditions).toBe(problem.conditions);
    expect(resolved.tags).toBe(problem.tags);
  });
});
