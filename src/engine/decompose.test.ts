import { describe, expect, it } from "vitest";
import {
  decomposeChiitoitsu,
  decomposeKokushi,
  decomposeStandard,
} from "./decompose";
import { tilesToCounts } from "./tileType";
import { parseTileNotation } from "./tiles";

/** "123m456p789s55z" のような連結記法を個々のnotationに分解してカウント配列を作る。 */
function countsFromCompact(compact: string): number[] {
  const parts = compact.match(/\d+[mpsz]/g) ?? [];
  const notations: string[] = [];
  for (const part of parts) {
    const suit = part[part.length - 1];
    for (const digit of part.slice(0, -1)) {
      notations.push(`${digit}${suit}`);
    }
  }
  return tilesToCounts(notations.map(parseTileNotation));
}

describe("decomposeStandard", () => {
  it("decomposes a clean standard hand: 123m 456p 789s 123s 55z", () => {
    const counts = countsFromCompact("123m456p789s123s55z");
    const results = decomposeStandard(counts, 4);
    expect(results.length).toBe(1);
    expect(results[0].sets.length).toBe(4);
    expect(results[0].pairType).toBe(31); // 5z(白) = 27 + (5-1) = 31
  });

  it("finds a single decomposition for a hand with two identical sequences (iipeikou shape)", () => {
    // 223344m (=234m+234m) + 567p + 999s + 11z(雀頭)
    const counts = countsFromCompact("223344m567p999s11z");
    const results = decomposeStandard(counts, 4);
    expect(results.length).toBe(1);
    expect(
      results[0].sets.filter((s) => s.kind === "sequence").length,
    ).toBe(3);
  });

  it("finds multiple interpretations for a genuinely ambiguous shape", () => {
    // 222333444m は「234m×3」（三色/三順子）と「222m+333m+444m」（三刻子）の
    // 両方の解釈が可能な教科書的な曖昧形。789p固定 + 55s雀頭。
    const counts = countsFromCompact("222333444m789p55s");
    const results = decomposeStandard(counts, 4);
    expect(results.length).toBe(2);
    const sequenceCounts = results.map(
      (r) => r.sets.filter((s) => s.kind === "sequence").length,
    );
    expect(sequenceCounts.sort()).toEqual([1, 4]); // 789pの1つ + (234m×3 or 0)
  });

  it("returns empty when the hand cannot be decomposed", () => {
    const counts = countsFromCompact("11223m"); // 5枚だけの不完全な形
    const results = decomposeStandard(counts, 4);
    expect(results).toEqual([]);
  });

  it("decomposes a shanpon-capable completed hand", () => {
    // 456m 456p 456s 22z 333z (雀頭22z, 刻子333z) - 14枚
    const counts = countsFromCompact("456m456p456s22z");
    counts[27 + 2] += 3; // 西(z3) を3枚追加 → 333z
    const results = decomposeStandard(counts, 4);
    expect(results.length).toBe(1);
    expect(results[0].pairType).toBe(28); // 2z(南) = 27+(2-1)=28
    expect(
      results[0].sets.some((s) => s.kind === "triplet" && s.tileType === 29),
    ).toBe(true); // 3z(西) = 27+(3-1)=29
  });
});

describe("decomposeChiitoitsu", () => {
  it("accepts 7 distinct pairs", () => {
    const counts = new Array(34).fill(0);
    [0, 1, 2, 3, 4, 5, 6].forEach((t) => (counts[t] += 2));
    expect(decomposeChiitoitsu(counts)?.pairs.length).toBe(7);
  });

  it("rejects four-of-a-kind (not distinct pairs)", () => {
    const counts = new Array(34).fill(0);
    [0, 1, 2, 3, 4, 5].forEach((t) => (counts[t] += 2));
    counts[6] += 4;
    expect(decomposeChiitoitsu(counts)).toBeNull();
  });

  it("rejects a hand that is not seven pairs", () => {
    const counts = new Array(34).fill(0);
    [0, 1, 2, 3, 4, 5, 6].forEach((t) => (counts[t] += 2));
    counts[7] += 1; // 奇数枚が混入
    expect(decomposeChiitoitsu(counts)).toBeNull();
  });
});

describe("decomposeKokushi", () => {
  const KOKUSHI = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

  it("accepts all 13 terminal/honor types with one pair", () => {
    const counts = new Array(34).fill(0);
    for (const t of KOKUSHI) counts[t] = 1;
    counts[0] = 2; // 1mを雀頭に
    const result = decomposeKokushi(counts);
    expect(result).not.toBeNull();
    expect(result?.pairType).toBe(0);
  });

  it("rejects a hand missing one of the 13 required types", () => {
    const counts = new Array(34).fill(0);
    for (const t of KOKUSHI.slice(0, 12)) counts[t] = 1; // 中(33)を欠く
    counts[0] = 2;
    expect(decomposeKokushi(counts)).toBeNull();
  });

  it("rejects a hand containing a non-terminal/honor tile", () => {
    const counts = new Array(34).fill(0);
    for (const t of KOKUSHI) counts[t] = 1;
    counts[0] = 2;
    counts[4] = 1; // 5m混入
    expect(decomposeKokushi(counts)).toBeNull();
  });
});
