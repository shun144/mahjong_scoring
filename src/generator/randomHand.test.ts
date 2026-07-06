import { describe, expect, it } from "vitest";
import type { Meld, Tile } from "../engine/model";
import { tilesToCounts } from "../engine/tileType";
import { createSeededRandom } from "./random";
import { allowsRiichi, generateRandomHand } from "./randomHand";

const t = (suit: Tile["suit"], rank: number): Tile => ({ suit, rank });
const ankan = (suit: Tile["suit"], rank: number): Meld => ({
  type: "ankan",
  tiles: [t(suit, rank), t(suit, rank), t(suit, rank), t(suit, rank)],
});
const minkan = (suit: Tile["suit"], rank: number): Meld => ({
  type: "minkan",
  tiles: [t(suit, rank), t(suit, rank), t(suit, rank), t(suit, rank)],
});
const pon = (suit: Tile["suit"], rank: number): Meld => ({
  type: "pon",
  tiles: [t(suit, rank), t(suit, rank), t(suit, rank)],
});

describe("allowsRiichi", () => {
  it("allows riichi for a fully concealed hand (no melds)", () => {
    expect(allowsRiichi([])).toBe(true);
  });

  it("allows riichi when only 暗槓 are present and kans < 4", () => {
    expect(allowsRiichi([ankan("m", 1)])).toBe(true);
    expect(allowsRiichi([ankan("m", 1), ankan("p", 2), ankan("s", 3)])).toBe(true);
  });

  it("forbids riichi for 四槓子 (4 kans) even when all 暗槓 keep the hand menzen", () => {
    expect(allowsRiichi([ankan("m", 1), ankan("p", 2), ankan("s", 3), ankan("m", 9)])).toBe(
      false,
    );
  });

  it("forbids riichi when 明槓/ポン break menzen", () => {
    expect(allowsRiichi([minkan("m", 1)])).toBe(false);
    expect(allowsRiichi([pon("m", 1)])).toBe(false);
  });
});

describe("generateRandomHand", () => {
  it("同一牌が手牌＋ドラ/裏ドラ表示牌の合計で4枚を超えない（表示牌も牌山の実牌・SPEC §5.4）", () => {
    const rng = createSeededRandom(12345);
    let generated = 0;
    for (let i = 0; i < 800; i++) {
      const hand = generateRandomHand(rng);
      if (!hand) continue;
      generated += 1;
      const tiles = [
        ...hand.concealed,
        ...hand.melds.flatMap((m) => m.tiles),
        ...hand.doraIndicators,
        ...hand.uraDoraIndicators,
      ];
      const overType = tilesToCounts(tiles).findIndex((count) => count > 4);
      expect(overType).toBe(-1);
    }
    // シードによりほぼ全試行で生成が成功する。回帰時に空ループで見逃さないよう最低数を担保。
    expect(generated).toBeGreaterThan(100);
  });
});
