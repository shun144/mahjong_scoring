import { describe, expect, it } from "vitest";
import type { Meld, Tile } from "../engine/model";
import { allowsRiichi } from "./randomHand";

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
