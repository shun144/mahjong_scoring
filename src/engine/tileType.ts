import type { Suit, Tile, Wind } from "./model";

/**
 * 牌を赤ドラを無視した34種の型インデックス(0-33)に変換する。
 * 0-8: 1m-9m / 9-17: 1p-9p / 18-26: 1s-9s / 27-33: 1z-7z
 */
export function tileToType(tile: Tile): number {
  const base = { m: 0, p: 9, s: 18, z: 27 }[tile.suit];
  return base + (tile.rank - 1);
}

const SUIT_ORDER: Suit[] = ["m", "p", "s", "z"];

export function typeToTile(type: number): Tile {
  const suit = SUIT_ORDER[Math.floor(type / 9)];
  const rank = (type % 9) + 1;
  return { suit, rank };
}

export function isTerminalOrHonor(type: number): boolean {
  if (type >= 27) return true; // 字牌
  const rank = (type % 9) + 1;
  return rank === 1 || rank === 9;
}

export function isTerminal(type: number): boolean {
  if (type >= 27) return false;
  const rank = (type % 9) + 1;
  return rank === 1 || rank === 9;
}

export function isHonorType(type: number): boolean {
  return type >= 27;
}

/** 風牌（東南西北）の型インデックスに変換する（東=27/南=28/西=29/北=30）。 */
export function windToHonorType(wind: Wind): number {
  const rank = { east: 1, south: 2, west: 3, north: 4 }[wind];
  return 27 + (rank - 1);
}

export function isGreenType(type: number): boolean {
  // 緑一色: 2,3,4,6,8索 + 發
  const greenSou = [2, 3, 4, 6, 8].map((r) => 18 + (r - 1));
  return greenSou.includes(type) || type === 27 + 5; // 發 = z6 -> index 27+5
}

/** 型インデックス配列(34要素)を持つ枚数カウント。 */
export function createEmptyCounts(): number[] {
  return new Array(34).fill(0);
}

export function tilesToCounts(tiles: readonly Tile[]): number[] {
  const counts = createEmptyCounts();
  for (const tile of tiles) {
    counts[tileToType(tile)] += 1;
  }
  return counts;
}

export function totalCount(counts: readonly number[]): number {
  return counts.reduce((a, b) => a + b, 0);
}
