import { describe, expect, it } from "vitest";
import type { Tile } from "./model";
import {
  compareTiles,
  isValidTile,
  parseTileNotation,
  removeOneMatchingTile,
  sortTiles,
  tileToLabel,
  tileToNotation,
  tilesEqual,
} from "./tiles";

describe("isValidTile", () => {
  it("accepts valid suited tiles", () => {
    expect(isValidTile({ suit: "m", rank: 1 })).toBe(true);
    expect(isValidTile({ suit: "s", rank: 9 })).toBe(true);
  });

  it("accepts valid honor tiles", () => {
    expect(isValidTile({ suit: "z", rank: 1 })).toBe(true);
    expect(isValidTile({ suit: "z", rank: 7 })).toBe(true);
  });

  it("rejects out-of-range ranks", () => {
    expect(isValidTile({ suit: "m", rank: 0 })).toBe(false);
    expect(isValidTile({ suit: "m", rank: 10 })).toBe(false);
    expect(isValidTile({ suit: "z", rank: 8 })).toBe(false);
  });

  it("rejects red flag on non-five or honor tiles", () => {
    expect(isValidTile({ suit: "m", rank: 5, red: true })).toBe(true);
    expect(isValidTile({ suit: "m", rank: 3, red: true })).toBe(false);
    expect(isValidTile({ suit: "z", rank: 1, red: true })).toBe(false);
  });
});

describe("tilesEqual", () => {
  it("treats identical suit/rank/red as equal", () => {
    expect(tilesEqual({ suit: "m", rank: 5 }, { suit: "m", rank: 5 })).toBe(
      true,
    );
  });

  it("distinguishes red five from normal five", () => {
    expect(
      tilesEqual({ suit: "m", rank: 5, red: true }, { suit: "m", rank: 5 }),
    ).toBe(false);
  });
});

describe("sortTiles / compareTiles", () => {
  it("orders by suit then rank: m < p < s < z", () => {
    const tiles: Tile[] = [
      { suit: "z", rank: 1 },
      { suit: "s", rank: 2 },
      { suit: "m", rank: 9 },
      { suit: "p", rank: 1 },
    ];
    const sorted = sortTiles(tiles);
    expect(sorted.map(tileToNotation)).toEqual(["9m", "1p", "2s", "1z"]);
  });

  it("does not mutate the input array", () => {
    const tiles: Tile[] = [{ suit: "s", rank: 2 }, { suit: "m", rank: 1 }];
    const original = [...tiles];
    sortTiles(tiles);
    expect(tiles).toEqual(original);
  });

  it("treats red five and normal five as the same sort position", () => {
    const a: Tile = { suit: "m", rank: 5 };
    const b: Tile = { suit: "m", rank: 5, red: true };
    expect(compareTiles(a, b)).toBe(0);
  });
});

describe("tileToNotation / parseTileNotation round trip", () => {
  it.each([
    { suit: "m", rank: 1 },
    { suit: "p", rank: 9 },
    { suit: "s", rank: 5, red: true },
    { suit: "z", rank: 7 },
  ] satisfies Tile[])("round-trips %j", (tile) => {
    const notation = tileToNotation(tile);
    expect(parseTileNotation(notation)).toEqual(tile);
  });

  it("uses '0' notation for red fives", () => {
    expect(tileToNotation({ suit: "p", rank: 5, red: true })).toBe("0p");
    expect(parseTileNotation("0p")).toEqual({
      suit: "p",
      rank: 5,
      red: true,
    });
  });

  it("throws on malformed notation", () => {
    expect(() => parseTileNotation("xm")).toThrow();
    expect(() => parseTileNotation("5x")).toThrow();
    expect(() => parseTileNotation("")).toThrow();
  });

  it("throws when formatting an invalid tile", () => {
    expect(() => tileToNotation({ suit: "z", rank: 9 })).toThrow();
  });
});

describe("tileToLabel", () => {
  it("labels suited tiles with kanji digits", () => {
    expect(tileToLabel({ suit: "m", rank: 1 })).toBe("一萬");
    expect(tileToLabel({ suit: "s", rank: 5, red: true })).toBe("五索(赤)");
  });

  it("labels honor tiles by name", () => {
    expect(tileToLabel({ suit: "z", rank: 1 })).toBe("東");
    expect(tileToLabel({ suit: "z", rank: 6 })).toBe("發");
  });
});

describe("removeOneMatchingTile", () => {
  it("removes exactly one matching tile", () => {
    const tiles: Tile[] = [
      { suit: "z", rank: 5 },
      { suit: "z", rank: 5 },
      { suit: "m", rank: 1 },
    ];
    const result = removeOneMatchingTile(tiles, { suit: "z", rank: 5 });
    expect(result).toHaveLength(2);
    expect(result.filter((t) => tilesEqual(t, { suit: "z", rank: 5 }))).toHaveLength(1);
  });

  it("leaves the array unchanged (aside from copying) when there is no match", () => {
    const tiles: Tile[] = [{ suit: "m", rank: 1 }, { suit: "p", rank: 2 }];
    const result = removeOneMatchingTile(tiles, { suit: "s", rank: 9 });
    expect(result).toEqual(tiles);
    expect(result).not.toBe(tiles);
  });

  it("does not mutate the input array", () => {
    const tiles: Tile[] = [{ suit: "m", rank: 1 }, { suit: "m", rank: 1 }];
    const original = [...tiles];
    removeOneMatchingTile(tiles, { suit: "m", rank: 1 });
    expect(tiles).toEqual(original);
  });

  it("distinguishes red five from normal five when matching", () => {
    const tiles: Tile[] = [
      { suit: "m", rank: 5, red: true },
      { suit: "m", rank: 5 },
    ];
    const result = removeOneMatchingTile(tiles, { suit: "m", rank: 5 });
    expect(result).toEqual([{ suit: "m", rank: 5, red: true }]);
  });
});
