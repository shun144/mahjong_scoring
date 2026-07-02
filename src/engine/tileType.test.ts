import { describe, expect, it } from "vitest";
import {
  isGreenType,
  isHonorType,
  isTerminal,
  isTerminalOrHonor,
  tileToType,
  typeToTile,
} from "./tileType";
import { parseTileNotation } from "./tiles";

describe("tileToType / typeToTile round trip", () => {
  it.each(["1m", "9m", "1p", "9p", "1s", "9s", "1z", "7z", "5m"])("round-trips %s", (n) => {
    const tile = parseTileNotation(n);
    const type = tileToType(tile);
    expect(typeToTile(type)).toEqual({ suit: tile.suit, rank: tile.rank });
  });
});

describe("isTerminal / isTerminalOrHonor / isHonorType", () => {
  it("recognizes terminals (1,9) but not honors as terminal", () => {
    expect(isTerminal(tileToType(parseTileNotation("1m")))).toBe(true);
    expect(isTerminal(tileToType(parseTileNotation("9s")))).toBe(true);
    expect(isTerminal(tileToType(parseTileNotation("5m")))).toBe(false);
    expect(isTerminal(tileToType(parseTileNotation("1z")))).toBe(false);
  });

  it("terminalOrHonor includes both terminals and honors", () => {
    expect(isTerminalOrHonor(tileToType(parseTileNotation("1p")))).toBe(true);
    expect(isTerminalOrHonor(tileToType(parseTileNotation("7z")))).toBe(true);
    expect(isTerminalOrHonor(tileToType(parseTileNotation("5p")))).toBe(false);
  });

  it("honorType only true for z suit", () => {
    expect(isHonorType(tileToType(parseTileNotation("1z")))).toBe(true);
    expect(isHonorType(tileToType(parseTileNotation("9m")))).toBe(false);
  });
});

describe("isGreenType", () => {
  it("accepts exactly 2,3,4,6,8 sou and 發(6z)", () => {
    for (const rank of [2, 3, 4, 6, 8]) {
      expect(isGreenType(tileToType({ suit: "s", rank }))).toBe(true);
    }
    expect(isGreenType(tileToType(parseTileNotation("6z")))).toBe(true); // 發
  });

  it("rejects non-green sou ranks and other honors", () => {
    for (const rank of [1, 5, 7, 9]) {
      expect(isGreenType(tileToType({ suit: "s", rank }))).toBe(false);
    }
    expect(isGreenType(tileToType(parseTileNotation("1z")))).toBe(false); // 東
    expect(isGreenType(tileToType(parseTileNotation("5z")))).toBe(false); // 白
    expect(isGreenType(tileToType(parseTileNotation("2m")))).toBe(false); // 索子以外
  });
});
