import type { Tile } from "./tile";

/**
 * ドラ表示牌から実際のドラ牌を導出する
 * 数牌: 次の数字（9の次は1）。風牌: 東→南→西→北→東。三元牌: 白→發→中→白。
 */
export function doraFromIndicator(indicator: Tile): Tile {
  if (indicator.suit === "z") {
    if (indicator.rank <= 4) {
      // 風牌: 東(1)→南(2)→西(3)→北(4)→東(1)
      return { suit: "z", rank: indicator.rank === 4 ? 1 : indicator.rank + 1 };
    }
    // 三元牌: 白(5)→發(6)→中(7)→白(5)
    return { suit: "z", rank: indicator.rank === 7 ? 5 : indicator.rank + 1 };
  }
  return { suit: indicator.suit, rank: indicator.rank === 9 ? 1 : indicator.rank + 1 };
}

/**
 * 実際のドラ牌から、それを導くドラ表示牌を逆算する（doraFromIndicatorの逆関数）。
 * 問題生成側で「狙った実際のドラ」から表示牌を組み立てる際に使う。
 */
export function indicatorForDora(dora: Tile): Tile {
  if (dora.suit === "z") {
    if (dora.rank <= 4) {
      return { suit: "z", rank: dora.rank === 1 ? 4 : dora.rank - 1 };
    }
    return { suit: "z", rank: dora.rank === 5 ? 7 : dora.rank - 1 };
  }
  return { suit: dora.suit, rank: dora.rank === 1 ? 9 : dora.rank - 1 };
}

/** handTiles内に doraTiles（実際のドラ牌）と同じ牌が何枚あるかを数える（赤/通常は区別しない）。 */
export function countDora(handTiles: readonly Tile[], doraTiles: readonly Tile[]): number {
  let count = 0;
  for (const dora of doraTiles) {
    count += handTiles.filter((t) => t.suit === dora.suit && t.rank === dora.rank).length;
  }
  return count;
}

/** handTiles内に、ドラ表示牌(indicators)から導出される実際のドラ牌が何枚あるかを数える。 */
export function countDoraFromIndicators(
  handTiles: readonly Tile[],
  indicators: readonly Tile[],
): number {
  return countDora(handTiles, indicators.map(doraFromIndicator));
}

/** 赤ドラ（red: true）の枚数を数える。 */
export function countAkaDora(handTiles: readonly Tile[]): number {
  return handTiles.filter((t) => t.red).length;
}
