import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Meld } from "@/core/scoring/domain/meld";
import type { Tile } from "@/core/scoring/domain/tile";
import { HandDisplay } from "./HandDisplay";

function countRenderedTiles() {
  // 伏せ牌("伏せ牌")は上がり判定に関係しないため除外し、実牌のみ数える。
  return screen.getAllByRole("img").filter((el) => el.getAttribute("aria-label") !== "伏せ牌").length;
}

describe("HandDisplay", () => {
  it("excludes the winning tile from the hand row (shown separately in the header)", () => {
    const concealed: Tile[] = [
      { suit: "m", rank: 2 },
      { suit: "m", rank: 3 },
      { suit: "m", rank: 4 },
      { suit: "p", rank: 5 },
      { suit: "p", rank: 6 },
      { suit: "p", rank: 7 },
      { suit: "s", rank: 1 },
      { suit: "s", rank: 2 },
      { suit: "s", rank: 3 },
      { suit: "z", rank: 1 },
      { suit: "z", rank: 1 },
      { suit: "z", rank: 1 },
      { suit: "z", rank: 5 },
      { suit: "z", rank: 5 },
    ];
    const winningTile: Tile = { suit: "z", rank: 5 };

    render(<HandDisplay concealed={concealed} winningTile={winningTile} />);

    // アガリ牌はヘッダーで別途表示するため、手牌の並びからは1枚除外される。
    expect(countRenderedTiles()).toBe(concealed.length - 1);
  });

  it("removes exactly one winning tile even when it is part of a pair (no over/under removal)", () => {
    const concealed: Tile[] = [
      { suit: "m", rank: 2 },
      { suit: "m", rank: 3 },
      { suit: "m", rank: 4 },
      { suit: "p", rank: 5, red: true },
      { suit: "p", rank: 6 },
      { suit: "p", rank: 7 },
      { suit: "z", rank: 5 },
      { suit: "z", rank: 5 },
    ];
    const winningTile: Tile = { suit: "z", rank: 5 };

    render(<HandDisplay concealed={concealed} winningTile={winningTile} />);

    // 対子の片割れだけが除外され、残る「白」は1枚。
    expect(countRenderedTiles()).toBe(concealed.length - 1);
    expect(screen.getAllByRole("img", { name: "白" })).toHaveLength(1);
  });

  it("includes meld tiles in addition to the concealed hand (minus the winning tile)", () => {
    const concealed: Tile[] = [
      { suit: "m", rank: 2 },
      { suit: "m", rank: 3 },
      { suit: "m", rank: 4 },
      { suit: "z", rank: 5 },
      { suit: "z", rank: 5 },
    ];
    const winningTile: Tile = { suit: "z", rank: 5 };
    const meld: Meld = {
      type: "pon",
      tiles: [
        { suit: "s", rank: 9 },
        { suit: "s", rank: 9 },
        { suit: "s", rank: 9 },
      ],
    };

    render(<HandDisplay concealed={concealed} winningTile={winningTile} melds={[meld]} />);

    expect(countRenderedTiles()).toBe(concealed.length - 1 + meld.tiles.length);
  });
});
