import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Meld, Tile } from "../../engine/model";
import { HandDisplay } from "./HandDisplay";

function countRenderedTiles() {
  // 伏せ牌("伏せ牌")は上がり判定に関係しないため除外し、実牌のみ数える。
  return screen.getAllByRole("img").filter((el) => el.getAttribute("aria-label") !== "伏せ牌").length;
}

describe("HandDisplay", () => {
  it("renders exactly concealed.length tiles when the winning tile is a simple, non-duplicated tile", () => {
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

    expect(countRenderedTiles()).toBe(concealed.length);
  });

  it("does not double-count the winning tile when it is part of a pair (regression for the double-tile bug)", () => {
    // P1のギャラリーページと同条件: 上がり牌が対子の一部と一致するケース。
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

    // 合計は8枚のまま（9枚に増えてはいけない）。うち「白」は2枚のみ。
    expect(countRenderedTiles()).toBe(concealed.length);
    expect(screen.getAllByRole("img", { name: "白" })).toHaveLength(2);
  });

  it("includes meld tiles in addition to the concealed count", () => {
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
      calledTile: { suit: "s", rank: 9 },
    };

    render(<HandDisplay concealed={concealed} winningTile={winningTile} melds={[meld]} />);

    expect(countRenderedTiles()).toBe(concealed.length + meld.tiles.length);
  });
});
